// @ts-check
const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { pickProperty } = require("../../utils");

/**
 * @type {import("../../types").PackageVerifierRule}
 */
function verifyTslibUsage(context) {
    const { packageTsconfigJsonFile, packageJsonFile, dependencies, devDependencies, formatLocation, addError, addWarning } = context;

    const parsedCommandLine = ts.getParsedCommandLineOfConfigFile(
        packageTsconfigJsonFile.fileName,
        ts.getDefaultCompilerOptions(),
        {
            fileExists: ts.sys.fileExists,
            getCurrentDirectory: ts.sys.getCurrentDirectory,
            readDirectory: ts.sys.readDirectory,
            readFile: ts.sys.readFile,
            useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
            onUnRecoverableConfigFileDiagnostic: diagnostic => {}
        });


    const tslibDependency = dependencies && pickProperty(dependencies, "tslib");
    const tslibDevDependency = devDependencies && pickProperty(devDependencies, "tslib");
    /** @type {{ file: ts.SourceFile, range: ts.TextRange} | undefined} */
    let tslibReference;
    /** @type {{ file: ts.SourceFile, range: ts.TextRange} | undefined} */
    let tslibTestReference;
    let hasOutput = false;

    const sourceFiles = collectSourceFiles(packageTsconfigJsonFile)
        .filter(f => !f.isDeclarationFile && ts.isExternalModule(f));
    for (const sourceFile of sourceFiles) {
        const imports = sourceFile.statements.filter(ts.isImportDeclaration);
        const exports = sourceFile.statements.filter(ts.isExportDeclaration);
        for (const decl of [...imports, ...exports]) {
            if (decl.moduleSpecifier && ts.isStringLiteral(decl.moduleSpecifier)) {
                if (/@esfx[\\/].*[\\/]src([\\/]|$)/.test(decl.moduleSpecifier.text)) {
                    addError({
                        message: `Invalid ${ts.isImportDeclaration(decl) ? "import" : "export"} for 'src': ${decl.moduleSpecifier.text}`,
                        location: formatLocation(sourceFile, decl.moduleSpecifier)
                    });
                }
            }
        }

        if (parsedCommandLine.options.importHelpers) {
            const outputFiles = ts.getOutputFileNames(parsedCommandLine, sourceFile.fileName, !ts.sys.useCaseSensitiveFileNames);
            for (const outputFile of outputFiles) {
                if (!outputFile.endsWith(".js")) continue;
                try {
                    const text = fs.readFileSync(outputFile, "utf8");
                    hasOutput = true;
                    const match = /^\s*(?:const|var) tslib(?:_\d+)? = require\("tslib"\);/m.exec(text);
                    if (match) {
                        const end = match.index + match[0].length;
                        const ref = {
                            file: ts.createSourceFile(outputFile, text, ts.ScriptTarget.Latest, true),
                            range: {
                                pos: end - `require("tslib");`.length,
                                end
                            }
                        };
                        if (/[\\/]__tests?__[\\/]/.test(outputFile)) {
                            if (!tslibTestReference) tslibTestReference = ref;
                        }
                        else {
                            if (!tslibReference) tslibReference = ref;
                        }
                        if (tslibTestReference && tslibReference) {
                            break;
                        }
                    }
                }
                catch {
                }
            }
        }
    }

    if (parsedCommandLine.options.importHelpers) {
        if (hasOutput) {
            if (tslibReference) {
                if (!tslibDependency) {
                    if (tslibDevDependency) {
                        addError({
                            message: `'tslib' should be a 'dependency', not a 'devDependency' as it is referenced by shipping code.`,
                            location: formatLocation(packageJsonFile, tslibDevDependency),
                            relatedLocation: formatLocation(tslibReference.file, tslibReference.range)
                        });
                    }
                    else {
                        addError({
                            message: `'tslib' should be added as a 'dependency' as it is referenced by shipping code.`,
                            location: formatLocation(packageJsonFile, dependencies),
                            relatedLocation: formatLocation(tslibReference.file, tslibReference.range)
                        });
                    }
                }
            }
            else if (tslibTestReference) {
                if (!tslibDevDependency) {
                    if (tslibDependency) {
                        addError({
                            message: `'tslib' should be a 'devDependency', not a 'dependency', as it is only referenced by non-shipping test code.`,
                            location: formatLocation(packageJsonFile, tslibDependency),
                            relatedLocation: formatLocation(tslibTestReference.file, tslibTestReference.range)
                        });
                    }
                    else {
                        addError({
                            message: `'tslib' should be added as a 'devDependency' as it is referenced by non-shipping test code.`,
                            location: formatLocation(packageJsonFile, devDependencies),
                            relatedLocation: formatLocation(tslibTestReference.file, tslibTestReference.range)
                        });
                    }
                }
            }
            else if (tslibDependency) {
                addWarning({
                    message: `'tslib' should be removed as a 'dependency' as it is not referenced by shipping code.`,
                    location: formatLocation(packageJsonFile, tslibDependency)
                });
            }
            else if (tslibDevDependency) {
                addWarning({
                    message: `'tslib' should be removed as a 'devDependency' as it is not referenced by non-shipping test code.`,
                    location: formatLocation(packageJsonFile, tslibDevDependency)
                });
            }
        }
        else {
            addWarning({
                message: "'tslib' dependency usage could not be checked as there were no build outputs.",
                location: formatLocation(packageTsconfigJsonFile || packageJsonFile, packageTsconfigJsonFile || packageJsonFile)
            });
        }
    }

}
exports.verifyTslibUsage = verifyTslibUsage;

/**
 * @param {ts.JsonSourceFile} file
 */
 function collectSourceFiles(file) {
    const commandLine = ts.parseJsonSourceFileConfigFileContent(file, ts.sys, path.dirname(file.fileName));
    const host = ts.createCompilerHost(commandLine.options);
    const program = ts.createProgram({
        options: commandLine.options,
        rootNames: commandLine.fileNames,
        projectReferences: commandLine.projectReferences,
        host,
        configFileParsingDiagnostics: ts.getConfigFileParsingDiagnostics(commandLine)
    });
    return program.getSourceFiles();
}
