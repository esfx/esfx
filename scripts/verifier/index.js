// @ts-check
const fs = require("fs");
const assert = require("assert");
const path = require("path");
const ts = require("typescript");
const chalk = /** @type {typeof import("chalk").default} */(/** @type {*} */(require("chalk")));
const basePath = path.resolve(__dirname, "../..");
const internalPath = path.resolve(basePath, "internal").toLowerCase();
const packagesPath = path.resolve(basePath, "packages").toLowerCase();
const prompts = require("prompts");
const types = require("./types");
const { trackChanges, applyChanges, createPatch } = require("./textChanges");
const { applyFix, getFixDescription } = require("./codeFix");
const { formatLocation, pickProperty, tryReadJsonFile } = require("./utils");
const { verifyContainer } = require("./rules/container");
const argv = require("yargs")
    .option("fix", { type: "boolean" })
    .option("interactive", { type: "boolean", default: true })
    .argv;

const ignores = Object.fromEntries(
    Object.entries(/** @type {Record<string, string[]>} */(require("../verify.ignores.json")))
        .map(([key, values]) => [key, values.map(value => new RegExp(value, "i"))]));

/** @type {types.Diagnostic[]} */
const warningDiagnostics = [];

/** @type {types.Diagnostic[]} */
const errorDiagnostics = [];

/** @type {Map<string, ts.JsonSourceFile>} */
const knownFiles = new Map();

const paths = { basePath, internalPath, packagesPath };

for (const base of [internalPath, packagesPath]) {
    const containerTsconfigJsonPath = path.resolve(base, "tsconfig.json");
    const baseRelativeContainerTsconfigJsonPath = path.relative(base, containerTsconfigJsonPath);
    const containerTsconfigJsonFile = tryReadJsonFile(containerTsconfigJsonPath, addError);
    if (containerTsconfigJsonFile) {
        knownFiles.set(containerTsconfigJsonFile.fileName, containerTsconfigJsonFile);
    }

    const actualContainerProjects = containerTsconfigJsonFile && collectProjectReferences(containerTsconfigJsonFile);

    /** @type {Map<string, import("typescript").JsonSourceFile>} */
    const expectedContainerProjects = new Map();

    /** @type {import("./types").ContainerVerifierContext} */
    const context = {
        paths,
        basePath: base,
        knownFiles,
        expectedContainerProjects,
        actualContainerProjects,
        baseRelativeContainerTsconfigJsonPath,
        containerTsconfigJsonFile,
        collectProjectReferences,
        addError,
        addWarning,
        formatLocation: (sourceFile, location) => formatLocation(basePath, sourceFile, location)
    };

    const result = verifyContainer(context);
    if (result === "continue") continue;
    if (result === "break") break;
}

if (argv.fix) {
    applyFixes(argv.interactive ? applyFixInteractively : applyFixAutomatically);
}
else {
    reportDiagnosticsAndExit();
}

/**
 * @param {types.Diagnostic} diagnostic
 */
function isIgnored(diagnostic) {
    if (diagnostic.location) {
        let key = diagnostic.location.replace(/\\/g, "/");
        let patterns = ignores[key];
        if (patterns) {
            for (const pattern of patterns) {
                if (pattern.test(diagnostic.message)) return true;
            }
        }
        // trim column
        key = key.replace(/:\d+$/, "");
        patterns = ignores[key];
        if (patterns) {
            for (const pattern of patterns) {
                if (pattern.test(diagnostic.message)) return true;
            }
        }
        // trim line
        key = key.replace(/:\d+$/, "");
        patterns = ignores[key];
        if (patterns) {
            for (const pattern of patterns) {
                if (pattern.test(diagnostic.message)) return true;
            }
        }
    }
    return false;
}

/**
 * @param {types.Diagnostic} diagnostic
 */
function addError(diagnostic) {
    if (isIgnored(diagnostic)) return;
    errorDiagnostics.push(diagnostic);
}

/**
 * @param {types.Diagnostic} diagnostic
 */
function addWarning(diagnostic) {
    if (isIgnored(diagnostic)) return;
    warningDiagnostics.push(diagnostic);
}

/**
 * @param {import("typescript").JsonSourceFile} file
 */
function collectProjectReferences(file) {
    /** @type {Map<string, ts.StringLiteral>} */
    const projectReferences = new Map();
    const references = pickProperty(file.statements[0].expression, "references");
    if (references && ts.isArrayLiteralExpression(references)) {
        for (const reference of references.elements) {
            const refPathExpr = pickProperty(reference, "path");
            if (refPathExpr && ts.isStringLiteral(refPathExpr)) {
                const refPath = path.resolve(path.dirname(file.fileName), refPathExpr.text).toLowerCase();
                if (refPath.startsWith(internalPath)) {
                    projectReferences.set(refPath, refPathExpr)
                }
                else if (refPath.startsWith(packagesPath)) {
                    projectReferences.set(refPath, refPathExpr);
                }
            }
        }
    }

    return projectReferences;
}

function reportDiagnosticsAndExit() {
    let fixableCount = 0;
    const unhandledWarnings = warningDiagnostics.filter(diagnostic => !diagnostic.fixed);
    if (unhandledWarnings.length) {
        console.log("Warnings:");
        for (const diagnostic of unhandledWarnings) {
            reportDiagnostic(diagnostic, false);
            if (diagnostic.fixes && diagnostic.fixes.length) fixableCount++;
        }
        console.log();
    }

    const unhandledErrors = errorDiagnostics.filter(diagnostic => !diagnostic.fixed);
    if (unhandledErrors.length) {
        console.log("Errors:");
        for (const diagnostic of unhandledErrors) {
            reportDiagnostic(diagnostic, true);
            if (diagnostic.fixes && diagnostic.fixes.length) fixableCount++;
        }
        console.log();
    }

    if (fixableCount) {
        console.log(`${chalk.gray("MSG!")} There ${fixableCount > 1 ? "are" : "is"} ${fixableCount} ${fixableCount > 1 ? "fixes" : "fix"} available! Run this command with '--fix' to apply.`);
    }

    process.exit(unhandledErrors.length);
}

/**
 * @param {types.Diagnostic} diagnostic
 * @param {boolean} isError
 */
function reportDiagnostic({ message, location = "", relatedLocation = "" }, isError) {
    const prefix = isError ? chalk.red("ERR!") : chalk.yellow("WRN!");
    console.log(`${prefix} ${location ? location + " " : ""}${message}`);
    if (relatedLocation) {
        console.log(`${prefix}     Related: ${relatedLocation}`);
    }
}

/**
 * @param {types.Diagnostic} diagnostic
 * @param {import("./codeFix").CodeFix[]} fixesOut
 */
async function applyFixAutomatically(diagnostic, fixesOut) {
    if (!diagnostic.fixes || !diagnostic.fixes.length) return;

    const fix = diagnostic.fixes[0];
    console.log(`${chalk.gray("MSG!")} ${fix.description || "Applying fix"}`);
    fixesOut.push(fix);
    diagnostic.fixed = true;
}

/**
 * @param {ts.JsonSourceFile} file
 * @param {import("./codeFix").CodeFix[]} approvedFixes
 * @param {import("./codeFix").CodeFix} [currentFix]
 */
function previewFix(file, approvedFixes, currentFix) {
    approvedFixes = approvedFixes.filter(fix => fix.file.fileName === fix.file.fileName);
    if (approvedFixes.length || currentFix) {
        const currentFixResult = trackChanges(tracker => {
            /** @type {Set<import("./codeFix").CodeFix>} */
            const fixed = new Set();
            for (const approvedFix of approvedFixes) {
                if (file.fileName === approvedFix.file.fileName) {
                    applyFix(approvedFix, tracker, fixed);
                }
            }
            if (currentFix) {
                applyFix(currentFix, tracker, fixed);
            }
        });
        for (const fileChange of currentFixResult) {
            if (fileChange.fileName === file.fileName) {
                const file = knownFiles.get(fileChange.fileName);
                return applyChanges(file.text, fileChange.textChanges);
            }
        }
    }
    return file.text;
}

/**
 * @typedef CodeFixPreview
 * @property {import("./codeFix").CodeFix} fix
 * @property {string} patch
 */

/**
 * @param {import("./codeFix").CodeFix[]} approvedFixes
 * @param {import("./codeFix").CodeFix[]} possibleFixes
 */
function previewFixes(approvedFixes, possibleFixes) {
    /** @type {Map<string, string>} */
    const beforeTexts = new Map();
    /** @type {CodeFixPreview[]} */
    const possibleResults = [];
    for (const fix of possibleFixes) {
        const file = fix.file;
        let beforeText = beforeTexts.get(file.fileName);
        if (beforeText === undefined) {
            beforeText = previewFix(file, approvedFixes);
            beforeTexts.set(file.fileName, beforeText);
        }

        const afterText = previewFix(file, approvedFixes, fix);
        const patch = createPatch(file.fileName, beforeText, afterText);
        possibleResults.push({ fix: fix, patch });
    }
    return possibleResults;
}

/**
 * @param {types.Diagnostic} diagnostic
 * @param {import("./codeFix").CodeFix[]} fixesOut
 * @returns {Promise<void | "stop">}
 */
async function applyFixInteractively(diagnostic, fixesOut) {
    if (!diagnostic.fixes || !diagnostic.fixes.length) return;

    /** @type {CodeFixPreview[]} */
    let previews;
    try {
        previews = previewFixes(fixesOut, diagnostic.fixes);
    }
    catch (e) {
        console.error(`An error occurred while applying the preview, skipping...`, e);
        return;
    }

    let stop = false;

    /** @type {import("./codeFix").CodeFix?} */
    let fix;
    if (previews.length === 1) {
        console.log(previews[0].patch);
        const result = await prompts([{
            name: "fix",
            type: "confirm",
            initial: true,
            message: getFixDescription(previews[0].fix),
        }], {
            onCancel: () => { stop = true }
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
                choices: previews.map(({ patch, fix}) => ({
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

/**
 * @param {(diagnostic: types.Diagnostic, fixesOut: import("./codeFix").CodeFix[]) => Promise<void | "stop">} applier
 */
async function applyFixes(applier) {
    /** @type {import("./codeFix").CodeFix[]} */
    const fixesToApply = [];
    if (warningDiagnostics.length) {
        console.log("Warnings:");
        for (const diagnostic of warningDiagnostics) {
            reportDiagnostic(diagnostic, false);
            if (diagnostic.fixes && diagnostic.fixes.length) {
                if ((await applier(diagnostic, fixesToApply)) === "stop") {
                    break;
                }
            }
        }
        console.log();
    }

    if (errorDiagnostics.length) {
        console.log("Errors:");
        for (const diagnostic of errorDiagnostics) {
            reportDiagnostic(diagnostic, true);
            if (diagnostic.fixes && diagnostic.fixes.length) {
                if ((await applier(diagnostic, fixesToApply)) === "stop") {
                    break;
                }
            }
        }
        console.log();
    }

    if (fixesToApply.length) {
        /** @type {Set<import("./codeFix").CodeFix>} */
        const fixed = new Set();
        /** @type {Map<string, import("./codeFix").CodeFix[]>} */
        const fixesToApplyPerFile = new Map();
        for (const fix of fixesToApply) {
            let fileFixes = fixesToApplyPerFile.get(fix.file.fileName);
            if (!fileFixes) fixesToApplyPerFile.set(fix.file.fileName, fileFixes = []);
            fileFixes.push(fix);
        }

        for (const [fileName, fixes] of fixesToApplyPerFile) {
            try {
                let stop = false;
                const result = trackChanges(tracker => {
                    for (const fix of fixes) {
                        applyFix(fix, tracker, fixed);
                    }
                });

                for (const fileChange of result) {
                    const file = knownFiles.get(fileChange.fileName);
                    assert(file);

                    console.log("File:", fileChange.fileName);
                    try {
                        const text = applyChanges(file.text, fileChange.textChanges);

                        // verify the source text
                        const parsed = /** @type {ts.JsonSourceFile} */(ts.createSourceFile(file.fileName, text, ts.ScriptTarget.JSON, true, ts.ScriptKind.JSON));
                        if (/** @type {*}*/(parsed).parseDiagnostics?.length) {
                            console.error(`Applying fixes to '${file.fileName}' resulted in invalid syntax, skipping...`);
                            continue;
                        }

                        if (applier === applyFixInteractively) {
                            console.log(createPatch(file.fileName, file.text, text));
                            const result = await prompts([{
                                name: "save",
                                type: "confirm",
                                initial: true,
                                message: `Save changes?`,
                            }], {
                                onCancel: () => { stop = true }
                            });
                            if (stop) break;
                            if (!result.save) continue;
                        }
                        await fs.promises.writeFile(file.fileName, text, "utf8");
                    }
                    catch (e) {
                        console.error(`An error occurred while applying fixes to '${fileChange.fileName}', skipping...`, e);
                    }
                }
                if (stop) break;
            }
            catch (e) {
                console.error(`An error occurred while applying fixes to '${fileName}', skipping...`, e);
            }
        }
    }

    reportDiagnosticsAndExit();
}
