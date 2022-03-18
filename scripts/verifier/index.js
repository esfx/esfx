// @ts-check
const path = require("path");
const ts = require("typescript");
const chalk = /** @type {typeof import("chalk").default} */(/** @type {*} */(require("chalk")));
const basePath = path.resolve(__dirname, "../..");
const internalPath = path.resolve(basePath, "internal").toLowerCase();
const packagesPath = path.resolve(basePath, "packages").toLowerCase();
const { formatLocation, pickProperty, tryReadJsonFile } = require("./utils");
const { verifyContainer } = require("./rules/container");
const { applyFixes, applyFixInteractively, applyFixAutomatically } = require("./codeFixApplier");
const argv = require("yargs")
    .option("fix", { type: "boolean" })
    .option("interactive", { type: "boolean", default: true })
    .argv;

async function main() {
    const ignores = Object.fromEntries(
        Object.entries(/** @type {Record<string, string[]>} */(require("../verify.ignores.json")))
            .map(([key, values]) => [key, values.map(value => new RegExp(value, "i"))]));
    
    /** @type {import("./types").Diagnostic[]} */
    const warningDiagnostics = [];
    
    /** @type {import("./types").Diagnostic[]} */
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
        await applyFixes(
            knownFiles,
            [
                ["warning", warningDiagnostics],
                ["error", errorDiagnostics]
            ],
            argv.interactive ? applyFixInteractively : applyFixAutomatically,
            {
                reportGroupStart(group) {
                    switch (group) {
                        case "warning":
                            console.log("Warnings:");
                            break;
                        case "error":
                            console.log("Errors:");
                            break;
                    }
                },
                reportGroupEnd() {
                    console.log();
                },
                reportDiagnostic
            });
        reportDiagnosticsAndExit();
    }
    else {
        reportDiagnosticsAndExit();
    }


    /**
     * @param {import("./types").Diagnostic} diagnostic
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
     * @param {import("./types").Diagnostic} diagnostic
     */
    function addError(diagnostic) {
        if (isIgnored(diagnostic)) return;
        errorDiagnostics.push(diagnostic);
    }

    /**
     * @param {import("./types").Diagnostic} diagnostic
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
                reportDiagnostic(diagnostic, "warning");
                if (diagnostic.fixes && diagnostic.fixes.length) fixableCount++;
            }
            console.log();
        }

        const unhandledErrors = errorDiagnostics.filter(diagnostic => !diagnostic.fixed);
        if (unhandledErrors.length) {
            console.log("Errors:");
            for (const diagnostic of unhandledErrors) {
                reportDiagnostic(diagnostic, "error");
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
     * @param {import("./types").Diagnostic} diagnostic
     * @param {"info" | "warning" | "error"} group
     */
    function reportDiagnostic({ message, location = "", relatedLocation = "" }, group) {
        const prefix =
            group === "error" ? chalk.red("ERR!") :
            group === "warning" ? chalk.yellow("WRN!") :
            chalk.white("INFO");
        console.log(`${prefix} ${location ? location + " " : ""}${message}`);
        if (relatedLocation) {
            console.log(`${prefix}     Related: ${relatedLocation}`);
        }
    }
}

main().catch(e => console.error(e));
