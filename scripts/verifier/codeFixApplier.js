// @ts-check
const ts = require("typescript");
const fs = require("fs");
const prompts = require("prompts");
const chalk = /** @type {typeof import("chalk").default} */(/** @type {*} */(require("chalk")));
const assert = require("assert");
const { trackChanges, applyChanges, createPatch } = require("./textChanges");
const { applyFix, getFixDescription, resolveFix } = require("./codeFix");

/**
 * @typedef CodeFixPreview
 * @property {string} fileName
 * @property {string} text
 * @property {boolean} isNewFile
 */

/**
 * @param {ReadonlyMap<string, ts.JsonSourceFile>} knownFiles
 * @param {import("./codeFix").CodeFix[]} approvedFixes
 * @param {import("./codeFix").CodeFix} [currentFix]
 */
function previewFix(knownFiles, approvedFixes, currentFix) {
    /** @type {CodeFixPreview[]} */
    const previews = [];
    if (approvedFixes.length || currentFix) {
        const currentFixResult = trackChanges(tracker => {
            /** @type {Set<import("./codeFix").CodeFix>} */
            const fixed = new Set();
            for (const approvedFix of approvedFixes) {
                applyFix(approvedFix, tracker, fixed);
            }
            if (currentFix) {
                applyFix(currentFix, tracker, fixed);
            }
        });
        for (const fileChange of currentFixResult) {
            const file = !fileChange.isNewFile ? knownFiles.get(fileChange.fileName) : undefined;
            previews.push({
                fileName: file?.fileName ?? fileChange.fileName,
                text: applyChanges(file?.text ?? "", fileChange.textChanges),
                isNewFile: !!fileChange.isNewFile
            });
        }
    }
    return previews;
}
exports.previewFix = previewFix;

/**
 * @typedef CodeFixPreviewPatch
 * @property {import("./codeFix").CodeFix} fix
 * @property {string} patch
 */

/**
 * @param {ReadonlyMap<string, ts.JsonSourceFile>} knownFiles
 * @param {import("./codeFix").CodeFix[]} approvedFixes
 * @param {import("./codeFix").CodeFix[]} possibleFixes
 */
function previewFixes(knownFiles, approvedFixes, possibleFixes) {
    const beforePreviews = new Map(previewFix(knownFiles, approvedFixes).map(preview => [preview.fileName, preview]));

    /** @type {CodeFixPreviewPatch[]} */
    const possibleResults = [];
    for (const fix of possibleFixes) {
        const afterPreviews = previewFix(knownFiles, approvedFixes, fix);
        let patch = "";
        for (const afterPreview of afterPreviews) {
            const beforePreview = beforePreviews.get(afterPreview.fileName);
            const beforeText = beforePreview ? beforePreview.text : knownFiles.get(afterPreview.fileName)?.text ?? "";
            const fileName = afterPreview.isNewFile ? afterPreview.fileName + "*" : afterPreview.fileName;
            if (patch) patch += "\n";
            patch += createPatch(fileName, beforeText, afterPreview.text);
        }
        possibleResults.push({ fix, patch });
    }
    return possibleResults;
}
exports.previewFixes = previewFixes;

/**
 * @param {ReadonlyMap<string, ts.JsonSourceFile>} knownFiles
 * @param {import("./types").Diagnostic} diagnostic
 * @param {import("./codeFix").CodeFix[]} fixesOut
 * @param {boolean} fixByDefault
 * @returns {Promise<void | "stop">}
 */
async function applyFixInteractively(knownFiles, diagnostic, fixesOut, fixByDefault) {
    if (!diagnostic.fixes || !diagnostic.fixes.length) return;

    /** @type {CodeFixPreviewPatch[]} */
    let previews;
    try {
        previews = previewFixes(knownFiles, fixesOut, diagnostic.fixes);
    }
    catch (e) {
        console.error(`An error occurred while applying the preview, skipping...`, e);
        return;
    }

    let stop = false;

    /** @type {import("./codeFix").CodeFix | undefined} */
    let fix;
    if (previews.length === 1) {
        console.log(previews[0].patch);
        const result = await prompts([{
            name: "fix",
            type: "confirm",
            initial: fixByDefault,
            message: getFixDescription(previews[0].fix),
        }], {
            onCancel: () => { stop = true },
        });
        if (result.fix) {
            fix = previews[0].fix;
        }
    }
    else {
        const result = await prompts([
            {
                name: "fix",
                type: "list",
                message: "Which fix would you like to apply?",
                choices: previews.map(({ patch, fix }) => ({
                    title: `${patch}\n${getFixDescription(fix)}`,
                    value: fix
                }))
            }
        ], {
            onCancel: () => { stop = true }
        });
        if (result.fix) {
            fix = result.fix;
        }
    }
    if (fix) {
        fixesOut.push(fix);
        diagnostic.fixed = true;
    }
    return stop ? "stop" : undefined;
}
exports.applyFixInteractively = applyFixInteractively;

/**
 * @param {ReadonlyMap<string, ts.JsonSourceFile>} knownFiles
 * @param {import("./types").Diagnostic} diagnostic
 * @param {import("./codeFix").CodeFix[]} fixesOut
 * @param {boolean} fixByDefault
 */
async function applyFixAutomatically(knownFiles, diagnostic, fixesOut, fixByDefault) {
    if (!diagnostic.fixes || !diagnostic.fixes.length) return;

    const fix = diagnostic.fixes[0];
    console.log(`${chalk.gray("MSG!")} ${fix.description || "Applying fix"}`);
    fixesOut.push(fix);
    diagnostic.fixed = true;
}
exports.applyFixAutomatically = applyFixAutomatically;

/**
 * @typedef DiagnosticGroupReporter
 * @property {(group: "info" | "warning" | "error") => void} [reportGroupStart]
 * @property {(diagnostic: import("./types").Diagnostic, group: "info" | "warning" | "error") => void} [reportDiagnostic]
 * @property {(group: "info" | "warning" | "error") => void} [reportGroupEnd]
 */

/**
 * @param {Map<string, ts.JsonSourceFile>} knownFiles
 * @param {Iterable<["info" | "warning" | "error", import("./types").Diagnostic[]]>} groupedDiagnostics
 * @param {(knownFiles: ReadonlyMap<string, ts.JsonSourceFile>, diagnostic: import("./types").Diagnostic, fixesOut: import("./codeFix").CodeFix[], fixByDefault: boolean) => Promise<void | "stop">} applier
 * @param {DiagnosticGroupReporter} [reporter]
 * @returns {Promise<"stop" | undefined>}
 */
async function applyFixes(knownFiles, groupedDiagnostics, applier, reporter, fixByDefault = true, promptOnSave = true) {
    /**
     * @param {import("./codeFix").CodeFix} fix 
     */
    const recordKnownFiles = fix => {
        resolveFix(fix);
        switch (fix.action) {
            case "batch":
                fix.fixes.forEach(recordKnownFiles);
                break;
            case "addFile":
                break;
            default:
                if (!knownFiles.has(fix.file.fileName)) knownFiles.set(fix.file.fileName, fix.file);
        }
    };

    for (const [, diagnostics] of groupedDiagnostics) {
        for (const diagnostic of diagnostics) {
            if (!diagnostic.fixes) continue;
            for (const fix of diagnostic.fixes) {
                recordKnownFiles(fix);
            }
        }
    }

    /** @type {import("./codeFix").CodeFix[]} */
    const fixesToApply = [];
    let stopped = false;
    for (const [group, diagnostics] of groupedDiagnostics) {
        reporter?.reportGroupStart?.(group);
        for (const diagnostic of diagnostics) {
            reporter?.reportDiagnostic?.(diagnostic, group);
            if (diagnostic.fixes && diagnostic.fixes.length) {
                if ((await applier(knownFiles, diagnostic, fixesToApply, fixByDefault)) === "stop") {
                    stopped = true;
                    break;
                }
            }
        }
        reporter?.reportGroupEnd?.(group);
    }

    if (fixesToApply.length) {
        /** @type {Set<import("./codeFix").CodeFix>} */
        const fixed = new Set();

        /** @type {Map<string, ts.FileTextChanges>} */
        const textChangesPerFile = new Map(trackChanges(tracker => {
            for (const fix of fixesToApply) {
                applyFix(fix, tracker, fixed);
            }
        }).map(changes => [changes.fileName, changes]));

        /** @type {[string, string][]} */
        const outputs = [];
        for (const [fileName, fileTextChanges] of textChangesPerFile) {
            const file = knownFiles.get(fileName);
            try {
                const text = applyChanges(file?.text ?? "", fileTextChanges.textChanges);
    
                // verify the source text
                const parsed = /** @type {ts.JsonSourceFile} */(ts.createSourceFile(fileName, text, ts.ScriptTarget.JSON, true, ts.ScriptKind.JSON));
                if (/** @type {*}*/(parsed).parseDiagnostics?.length) {
                    console.error(`Applying fixes to '${fileName}' resulted in invalid syntax, stopping...`);
                    return "stop";
                }
    
                outputs.push([fileName, text]);
            }
            catch (e) {
                console.error(`An error occurred while applying fixes to '${fileName}', stopping...`, e);
                return "stop";
            }
        }

        for (const [fileName, text] of outputs) {
            const file = knownFiles.get(fileName);
            console.log("File:", fileName);

            let stop = false;
            try {
                if (applier === applyFixInteractively && promptOnSave) {
                    console.log(createPatch(fileName, file?.text ?? "", text));
                    const result = await prompts([{
                        name: "save",
                        type: "confirm",
                        initial: fixByDefault,
                        message: `Save changes?`,
                    }], {
                        onCancel: () => { stop = true }
                    });
                    if (stop) return "stop";
                    if (!result.save) continue;
                }
                await fs.promises.writeFile(fileName, text, "utf8");
            }
            catch (e) {
                console.error(`An error occurred while applying fixes to '${fileName}', stopping...`, e);
                return "stop";
            }
            if (stop) return "stop";
        }
    }
    else if (stopped) {
        return "stop";
    }
}
exports.applyFixes = applyFixes;