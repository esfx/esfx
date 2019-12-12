// @ts-check
const fs = require("fs");
const assert = /** @type {((condition: any, message?: string) => asserts condition) & typeof import("assert")} */(require("assert"));
const path = require("path");
const ts = require("typescript");
const chalk = /** @type {typeof import("chalk").default} */(/** @type {*} */(require("chalk")));
const basePath = path.resolve(__dirname, "..");
const internalPath = path.resolve(basePath, "internal").toLowerCase();
const packagesPath = path.resolve(basePath, "packages").toLowerCase();
const prompts = require("prompts");

const argv = require("yargs")
    .option("fix", { type: "boolean" })
    .option("interactive", { type: "boolean", default: true })
    .argv;

/** @enum {number} */
const LeadingTriviaOption = { Exclude: 0, IncludeAll: 1 };

/** @enum {number} */
const TrailingTriviaOption = { Exclude: 0, Include: 1 };

/**
 * @typedef {{leadingTriviaOption?: LeadingTriviaOption}} ConfigurableStart
 * @typedef {{trailingTriviaOption?: TrailingTriviaOption}} ConfigurableEnd
 * @typedef {ConfigurableStart & ConfigurableEnd} ConfigurableStartEnd
 *
 * @typedef InsertNodeOptions
 * @property {string} [prefix]
 * @property {string} [suffix]
 * @property {number} [indentation]
 * @property {number} [delta]
 * @property {boolean} [preserveLeadingWhitespace]
 *
 * @typedef {ConfigurableStartEnd & InsertNodeOptions} ChangeNodeOptions
 * @typedef {InsertNodeOptions & { joiner?: string }} ReplaceWithMultipleNodesOptions
 *
 * @typedef FormatContext
 * @property {ts.FormatCodeSettings} options
 * @property {() => undefined} getRules
 *
 * @typedef TextChangesContext
 * @property {Partial<ts.LanguageServiceHost>} host
 * @property {FormatContext} formatContext
 * @property {ts.UserPreferences} preferences
 *
 * @typedef TextChangesNamespace
 * @property {ChangeTrackerClass} ChangeTracker
 * @property {(text: string, changes: readonly ts.TextChange[])=>string} applyChanges
 *
 * @typedef ChangeTrackerClass
 * @property {(context: TextChangesContext, cb: (tracker: ChangeTracker) => void) => ts.FileTextChanges[]} with
 *
 * @typedef ChangeTracker
 * @property {(sourceFile: ts.SourceFile, node: ts.Node)=>void} delete
 * @property {(sourceFile: ts.SourceFile, range: ts.TextRange)=>void} [deleteRange]
 * @property {(sourceFile: ts.SourceFile, pos: number, newNode: ts.Node, options?: InsertNodeOptions)=>void} [insertNodeAt]
 * @property {(sourceFile: ts.SourceFile, list: ts.NodeArray<ts.Node>, newNode: ts.Node)=>void} insertNodeAtEndOfList
 *
 * @typedef Diagnostic
 * @property {string} message
 * @property {string} [location]
 * @property {string} [relatedLocation]
 * @property {CodeFix[]} [fixes]
 * @property {boolean} [fixed]
 *
 * @typedef CodeFixBase
 * @property {ts.JsonSourceFile} file
 * @property {string} [description]
 * @property {boolean} [fixed]
 *
 * @typedef RemovePropertyCodeFixBase
 * @property {"removeProperty"} action
 * @property {ts.ObjectLiteralExpression} object
 * @property {ts.PropertyAssignment} property
 * @property {never} [antecedent]
 *
 * @typedef {CodeFixBase & RemovePropertyCodeFixBase} RemovePropertyCodeFix
 *
 * @typedef RemoveElementCodeFixBase
 * @property {"removeElement"} action
 * @property {ts.ArrayLiteralExpression} array
 * @property {ts.ObjectLiteralExpression} element
 * @property {never} [antecedent]
 *
 * @typedef {CodeFixBase & RemoveElementCodeFixBase} RemoveElementCodeFix
 *
 * @typedef AppendPropertyCodeFixBase
 * @property {"appendProperty"} action
 * @property {ts.ObjectLiteralExpression} object
 * @property {ts.PropertyAssignment} property
 * @property {AppendPropertyCodeFix} [antecedent]
 *
 * @typedef {CodeFixBase & AppendPropertyCodeFixBase} AppendPropertyCodeFix
 *
 * @typedef AppendElementCodeFixBase
 * @property {"appendElement"} action
 * @property {ts.ArrayLiteralExpression} array
 * @property {ts.ObjectLiteralExpression} element
 * @property {AppendPropertyCodeFix} [antecedent]
 *
 * @typedef {CodeFixBase & AppendElementCodeFixBase} AppendElementCodeFix
 *
 * @typedef {RemovePropertyCodeFix | RemoveElementCodeFix | AppendPropertyCodeFix | AppendElementCodeFix} CodeFix
 */

/** @type {Diagnostic[]} */
const warningDiagnostics = [];

/** @type {Diagnostic[]} */
const errorDiagnostics = [];

/** @type {Map<string, ts.JsonSourceFile>} */
const knownFiles = new Map();

for (const base of [internalPath, packagesPath]) {
    const containerTsconfigJsonPath = path.resolve(base, "tsconfig.json");
    const baseRelativeContainerTsconfigJsonPath = path.relative(base, containerTsconfigJsonPath);
    const containerTsconfigJsonFile = tryReadJsonFile(containerTsconfigJsonPath);
    if (containerTsconfigJsonFile) {
        knownFiles.set(containerTsconfigJsonFile.fileName, containerTsconfigJsonFile);
    }

    const actualContainerProjects = containerTsconfigJsonFile && collectProjectReferences(containerTsconfigJsonFile);

    /** @type {Map<string, import("typescript").JsonSourceFile>} */
    const expectedContainerProjects = new Map();

    for (const packageName of fs.readdirSync(base)) {
        const packagePath = path.resolve(base, packageName);
        if (!fs.statSync(packagePath).isDirectory()) continue;

        const packageJsonPath = path.resolve(packagePath, "package.json");
        if (!fs.existsSync(packageJsonPath)) continue;

        const packageTsconfigJsonPath = path.resolve(packagePath, "tsconfig.json");
        if (!fs.existsSync(packageTsconfigJsonPath)) continue;

        const packageJsonFile = tryReadJsonFile(packageJsonPath);
        if (!packageJsonFile) continue;

        knownFiles.set(packageJsonFile.fileName, packageJsonFile);

        const packageJsonObject = packageJsonFile.statements[0].expression;
        if (!ts.isObjectLiteralExpression(packageJsonObject)) {
            errorDiagnostics.push({
                message: `Invalid package file: Expected an object.`,
                location: formatLocation(packageJsonFile, packageJsonObject)
            });
            continue;
        }

        /** @type {AppendPropertyCodeFix?} */
        let dependenciesFix;
        let dependencies = pickProperty(packageJsonObject, "dependencies");
        if (dependencies && !ts.isObjectLiteralExpression(dependencies)) {
            errorDiagnostics.push({
                message: `Invalid package file: Expected 'dependencies' property to be an object.`,
                location: formatLocation(packageJsonFile, dependencies)
            });
            continue;
        }

        /** @type {AppendPropertyCodeFix?} */
        let devDependenciesFix;
        let devDependencies = pickProperty(packageJsonObject, "devDependencies");
        if (devDependencies && !ts.isObjectLiteralExpression(devDependencies)) {
            errorDiagnostics.push({
                message: `Invalid package file: Expected 'devDependencies' property to be an object.`,
                location: formatLocation(packageJsonFile, devDependencies)
            });
            continue;
        }

        /** @type {import("typescript").JsonSourceFile} */
        const packageTsconfigJsonFile = tryReadJsonFile(packageTsconfigJsonPath);
        if (!packageTsconfigJsonFile) continue;

        knownFiles.set(packageTsconfigJsonFile.fileName, packageTsconfigJsonFile);

        const packageTsconfigObject = packageTsconfigJsonFile.statements[0].expression;
        if (!ts.isObjectLiteralExpression(packageTsconfigObject)) {
            errorDiagnostics.push({
                message: `Invalid configuration file: Expected an object.`,
                location: formatLocation(packageTsconfigJsonFile, packageTsconfigObject)
            });
            continue;
        }

        /** @type {AppendPropertyCodeFix?} */
        let referencesFix;
        let references = pickProperty(packageTsconfigObject, "references");
        if (references && !ts.isArrayLiteralExpression(references)) {
            errorDiagnostics.push({
                message: `Invalid configuration file. Expected 'references' property to be an array.`,
                location: formatLocation(packageTsconfigJsonFile, references)
            });
            continue;
        }

        expectedContainerProjects.set(packagePath, packageTsconfigJsonFile);
        const expectedProjects = collectPackageDependencies(packageJsonFile);
        const actualProjects = collectProjectReferences(packageTsconfigJsonFile);
        const baseRelativePackageJsonPath = path.relative(basePath, packageJsonPath);
        const baseRelativePackageTsconfigJsonPath = path.relative(basePath, packageTsconfigJsonPath);

        const referenceLocation = formatLocation(packageTsconfigJsonFile, references || packageTsconfigObject);
        for (const [expected, node] of expectedProjects) {
            if (!actualProjects.has(expected)) {
                const relatedLocation = formatLocation(packageJsonFile, node);
                const packageRelativeExpected = path.relative(packagePath, path.resolve(expected));

                if (!references) {
                    references = ts.createArrayLiteral([], true);
                    referencesFix = {
                        file: packageTsconfigJsonFile,
                        action: "appendProperty",
                        object: packageTsconfigObject,
                        property: ts.createPropertyAssignment("references", references)
                    };
                }

                assert(ts.isArrayLiteralExpression(references));
                assert(ts.isPropertyAssignment(node.parent));

                errorDiagnostics.push({
                    message: `Missing reference: '${packageRelativeExpected}'`,
                    location: referenceLocation,
                    relatedLocation,
                    fixes: [{
                        file: packageTsconfigJsonFile,
                        action: "appendElement",
                        array: references,
                        element: ts.createObjectLiteral([ts.createPropertyAssignment("path", ts.createStringLiteral(packageRelativeExpected))], false),
                        antecedent: referencesFix,
                        description: `Add missing reference '${packageRelativeExpected}' to '${baseRelativePackageTsconfigJsonPath}'`
                    }, {
                        file: packageJsonFile,
                        action: "removeProperty",
                        object: node.parent.parent,
                        property: node.parent,
                        description: `Remove dependency '${node.text}' from '${baseRelativePackageJsonPath}'`
                    }]
                });
            }
        }

        for (const [actual, node] of actualProjects) {
            if (!expectedProjects.has(actual)) {
                const nodeLocation = formatLocation(packageTsconfigJsonFile, node);
                const packageRelativeActual = path.relative(packagePath, path.resolve(actual));
                const packageDependencyName = formatDependencyName(path.resolve(actual));

                if (!dependencies) {
                    dependencies = ts.createObjectLiteral([], true);
                    dependenciesFix = {
                        file: packageJsonFile,
                        action: "appendProperty",
                        object: packageJsonObject,
                        property: ts.createPropertyAssignment("dependencies", dependencies)
                    };
                }

                assert(ts.isObjectLiteralExpression(dependencies));

                if (!devDependencies) {
                    devDependencies = ts.createObjectLiteral([], true);
                    devDependenciesFix = {
                        file: packageJsonFile,
                        action: "appendProperty",
                        object: packageJsonObject,
                        property: ts.createPropertyAssignment("devDependencies", devDependencies)
                    };
                }

                assert(ts.isObjectLiteralExpression(devDependencies));
                assert(ts.isPropertyAssignment(node.parent) && ts.isObjectLiteralExpression(node.parent.parent) && ts.isArrayLiteralExpression(node.parent.parent.parent));

                warningDiagnostics.push({
                    message: `Extraneous reference: '${packageRelativeActual}'`,
                    location: nodeLocation,
                    fixes: [{
                        file: packageTsconfigJsonFile,
                        action: "removeElement",
                        array: node.parent.parent.parent,
                        element: node.parent.parent,
                        description: `Remove extraneous reference '${packageRelativeActual}' from '${baseRelativePackageTsconfigJsonPath}'`
                    }, {
                        file: packageJsonFile,
                        action: "appendProperty",
                        object: dependencies,
                        property: ts.createPropertyAssignment(packageDependencyName, ts.createStringLiteral(getPackageVersion(actual))),
                        antecedent: dependenciesFix,
                        description: `Add production dependency '${packageDependencyName}' to '${baseRelativePackageJsonPath}'`
                    }, {
                        file: packageJsonFile,
                        action: "appendProperty",
                        object: devDependencies,
                        property: ts.createPropertyAssignment(packageDependencyName, ts.createStringLiteral(getPackageVersion(actual))),
                        antecedent: devDependenciesFix,
                        description: `Add development dependency '${packageDependencyName}' to '${baseRelativePackageJsonPath}'`
                    }]
                });
            }
        }
    }

    if (actualContainerProjects) {
        const containerTsconfigObject = containerTsconfigJsonFile.statements[0].expression;
        if (!ts.isObjectLiteralExpression(containerTsconfigObject)) {
            errorDiagnostics.push({
                message: `Invalid configuration file: Expected an object.`,
                location: formatLocation(containerTsconfigJsonFile, containerTsconfigObject)
            });
            continue;
        }

        /** @type {AppendPropertyCodeFix?} */
        let referencesFix;
        let references = pickProperty(containerTsconfigObject, "references");

        const referenceLocation = formatLocation(containerTsconfigJsonFile, references || containerTsconfigObject);
        for (const [expected, node] of expectedContainerProjects) {
            if (!actualContainerProjects.has(expected)) {
                if (!references) {
                    references = ts.createArrayLiteral([], true);
                    referencesFix = {
                        file: containerTsconfigJsonFile,
                        action: "appendProperty",
                        object: containerTsconfigObject,
                        property: ts.createPropertyAssignment("references", references)
                    };
                }

                assert(ts.isArrayLiteralExpression(references));

                const relatedLocation = `${path.relative(basePath, path.resolve(node.fileName))}:1:1`;
                const baseRelativeExpected = path.relative(base, path.resolve(expected));
                errorDiagnostics.push({
                    message: `Missing reference: '${baseRelativeExpected}'`,
                    location: referenceLocation,
                    relatedLocation,
                    fixes: [{
                        file: containerTsconfigJsonFile,
                        action: "appendElement",
                        array: references,
                        element: ts.createObjectLiteral([ts.createPropertyAssignment("path", ts.createStringLiteral(baseRelativeExpected))], false),
                        antecedent: referencesFix,
                        description: `Add missing reference '${baseRelativeExpected}' to '${baseRelativeContainerTsconfigJsonPath}'`
                    }]
                });
            }
        }

        for (const [actual, node] of actualContainerProjects) {
            if (!expectedContainerProjects.has(actual)) {
                const nodeLocation = formatLocation(containerTsconfigJsonFile, node);
                const baseRelativeActual = path.relative(base, path.resolve(actual));

                assert(ts.isPropertyAssignment(node.parent) && ts.isObjectLiteralExpression(node.parent.parent) && ts.isArrayLiteralExpression(node.parent.parent.parent));

                warningDiagnostics.push({
                    message: `Extraneous reference: '${baseRelativeActual}'`,
                    location: nodeLocation,
                    fixes: [{
                        file: containerTsconfigJsonFile,
                        action: "removeElement",
                        array: node.parent.parent.parent,
                        element: node.parent.parent,
                        description: `Remove extraneous reference to '${baseRelativeActual}' from '${baseRelativeContainerTsconfigJsonPath}'`
                    }]
                });
            }
        }
    }
}

// if (argv.fix) {
//     applyFixes(argv.interactive ? applyFixInteractively : applyFixAutomatically);
// }
// else {
    reportDiagnosticsAndExit();
// }

function getPackageVersion(dependency) {
    try {
        const data = fs.readFileSync(path.resolve(dependency, "package.json"), "utf8");
        const json = JSON.parse(data);
        return typeof json.version === "string" ? `^${json.version}` : "*";
    }
    catch {
        return "*";
    }
}

/**
 *
 * @param {import("typescript").Node | undefined} expr
 * @param {string} name
 * @returns {import("typescript").Expression | undefined}
 */
function pickProperty(expr, name) {
    if (ts.isObjectLiteralExpression(expr)) {
        for (const property of expr.properties) {
            if (ts.isPropertyAssignment(property) && ts.isStringLiteral(property.name) && property.name.text === name) {
                return property.initializer;
            }
        }
    }
}

/**
 * @param {string} file
 * @returns {import("typescript").JsonSourceFile | undefined}
 */
function tryReadJsonFile(file) {
    try {
        const data = fs.readFileSync(file, "utf8");
        return /** @type {ts.JsonSourceFile} */(ts.createSourceFile(file, data, ts.ScriptTarget.JSON, true, ts.ScriptKind.JSON));
    }
    catch (e) {
        errorDiagnostics.push({ message: `Error parsing package.json: ${e}` });
    }
}

/**
 * @param {import("typescript").JsonSourceFile} file
 */
function collectPackageDependencies(file) {
    /** @type {Map<string, ts.StringLiteral>} */
    const packageDependencies = new Map();
    const dependencies = pickProperty(file.statements[0].expression, "dependencies");
    const devDependencies = pickProperty(file.statements[0].expression, "devDependencies");
    for (const dependenciesObject of [dependencies, devDependencies]) {
        if (dependenciesObject && ts.isObjectLiteralExpression(dependenciesObject)) {
            for (const property of dependenciesObject.properties) {
                if (!ts.isPropertyAssignment(property) || !ts.isStringLiteral(property.name)) {
                    continue;
                }
                const key = property.name.text;
                if (key.startsWith("@esfx/internal-")) {
                    packageDependencies.set(path.resolve(internalPath, key.slice("@esfx/internal-".length)).toLowerCase(), property.name);
                }
                else if (key.startsWith("@esfx/")) {
                    packageDependencies.set(path.resolve(packagesPath, key.slice("@esfx/".length)).toLowerCase(), property.name);
                }
            }
        }
    }
    return packageDependencies;
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

/**
 * @param {string} dependency
 */
function formatDependencyName(dependency) {
    assert(path.isAbsolute(dependency), "Dependency path must be absolute");
    if (dependency.toLocaleLowerCase().startsWith(internalPath)) {
        return `@esfx/internal-${dependency.slice(internalPath.length + 1)}`;
    }
    else if (dependency.toLocaleLowerCase().startsWith(packagesPath)) {
        return `@esfx/${dependency.slice(packagesPath.length + 1)}`;
    }
    else {
        throw new Error(`Unsupported path: ${dependency}`);
    }
}

/**
 * @param {import("typescript").SourceFile} sourceFile
 * @param {import("typescript").Node} node
 */
function formatLocation(sourceFile, node) {
    const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart(sourceFile));
    return `${path.relative(basePath, path.resolve(sourceFile.fileName))}:${line + 1}:${character + 1}`;
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
 * @param {Diagnostic} diagnostic
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
 * @param {Diagnostic} diagnostic
 * @param {CodeFix[]} fixesOut
 */
async function applyFixAutomatically(diagnostic, fixesOut) {
    if (!diagnostic.fixes || !diagnostic.fixes.length) return;

    const fix = diagnostic.fixes[0];
    console.log(`${chalk.gray("MSG!")} ${fix.description || "Applying fix"}`);
    fixesOut.push(fix);
    diagnostic.fixed = true;
}

/**
 * @param {Diagnostic} diagnostic
 * @param {CodeFix[]} fixesOut
 */
async function applyFixInteractively(diagnostic, fixesOut) {
    if (!diagnostic.fixes || !diagnostic.fixes.length) return;

    /** @type {CodeFix?} */
    let fix;
    if (diagnostic.fixes.length === 1) {
        const result = await prompts([{
            name: "fix",
            type: "confirm",
            initial: true,
            message: diagnostic.fixes[0].description || `Fix this?`
        }]);
        if (result.fix) {
            fix = diagnostic.fixes[0];
        }
    }
    else {
        const result = await prompts([
            {
                name: "fix",
                type: "list",
                message: "Which fix would you like to apply?",
                choices: diagnostic.fixes.map(fix => ({
                    title: fix.description,
                    value: fix
                }))
            }
        ]);
        if (result.fix) {
            fix = result.fix;
        }
    }
    if (fix) {
        fixesOut.push(fix);
        diagnostic.fixed = true;
    }
}

/**
 * @param {(diagnostic: Diagnostic, fixesOut: CodeFix[]) => Promise<void>} applier
 */
async function applyFixes(applier) {
    /** @type {CodeFix[]} */
    const fixesToApply = [];
    if (warningDiagnostics.length) {
        console.log("Warnings:");
        for (const diagnostic of warningDiagnostics) {
            reportDiagnostic(diagnostic, false);
            if (diagnostic.fixes && diagnostic.fixes.length) {
                await applier(diagnostic, fixesToApply)
            }
        }
        console.log();
    }

    if (errorDiagnostics.length) {
        console.log("Errors:");
        for (const diagnostic of errorDiagnostics) {
            reportDiagnostic(diagnostic, true);
            if (diagnostic.fixes && diagnostic.fixes.length) {
                await applier(diagnostic, fixesToApply)
            }
        }
        console.log();
    }

    if (fixesToApply.length) {
        const textChanges = /** @type {TextChangesNamespace} */(/** @type {any} */(ts).textChanges);
        const result = textChanges.ChangeTracker.with({
            host: {},
            // @ts-ignore
            formatContext: ts.formatting.getFormatContext({}),
            preferences: {}
        }, tracker => {
            tracker = wrapChangeTracker(tracker);
            for (const fix of fixesToApply) {
                applyFix(fix, tracker);
            }
        });

        for (const fileChange of result) {
            const file = knownFiles.get(fileChange.fileName);
            assert(file);

            const text = textChanges.applyChanges(file.text, fileChange.textChanges);
            console.log("File:", fileChange.fileName);
            console.log(text);
        }
    }

    reportDiagnosticsAndExit();
}

/**
 * @param {AppendPropertyCodeFix} fix
 * @returns {ChangeTracker}
 */
function createDependenciesMutator(fix) {
    assert(ts.isObjectLiteralExpression(fix.property.initializer));
    const original = fix.property.initializer;
    return {
        delete(_, n) {
            assert(ts.isPropertyAssignment(n));
            assert(ts.isObjectLiteralExpression(fix.property.initializer));
            const node = fix.property.initializer;
            assert(node.properties.includes(n));
            fix.property = ts.updatePropertyAssignment(
                fix.property,
                fix.property.name,
                ts.updateObjectLiteral(
                    node,
                    ts.setTextRange(ts.createNodeArray(node.properties.filter(p => p !== n), node.properties.hasTrailingComma), node.properties))
            );
        },
        insertNodeAtEndOfList(_, list, n) {
            assert(list === original.properties);
            assert(ts.isPropertyAssignment(n));
            assert(ts.isObjectLiteralExpression(fix.property.initializer));
            const node = fix.property.initializer;
            fix.property = ts.updatePropertyAssignment(
                fix.property,
                fix.property.name,
                ts.updateObjectLiteral(node, ts.setTextRange(ts.createNodeArray([...node.properties, n], node.properties.hasTrailingComma), node.properties))
            );
        }
    }
}

/**
 * @param {AppendPropertyCodeFix} fix
 * @returns {ChangeTracker}
 */
function createReferencesMutator(fix) {
    assert(ts.isArrayLiteralExpression(fix.property.initializer));
    const original = fix.property.initializer;
    return {
        delete(_, n) {
            assert(ts.isObjectLiteralExpression(n));
            assert(ts.isArrayLiteralExpression(fix.property.initializer));
            const node = fix.property.initializer;
            assert(node.elements.includes(n));
            fix.property = ts.updatePropertyAssignment(
                fix.property,
                fix.property.name,
                ts.updateArrayLiteral(node, ts.setTextRange(ts.createNodeArray(node.elements.filter(e => e !== n), node.elements.hasTrailingComma), node.elements))
            );
        },
        insertNodeAtEndOfList(_, list, n) {
            assert(list === original.elements);
            assert(ts.isObjectLiteralExpression(n));
            assert(ts.isArrayLiteralExpression(fix.property.initializer));
            const node = fix.property.initializer;
            fix.property = ts.updatePropertyAssignment(
                fix.property,
                fix.property.name,
                ts.updateArrayLiteral(node, ts.setTextRange(ts.createNodeArray([...node.elements, n], node.elements.hasTrailingComma), node.elements))
            );
        }
    }
}

/**
 * @param {ChangeTracker} tracker 
 * @returns {ChangeTracker}
 */
function wrapChangeTracker(tracker) {
    return {
        delete(_, n) {
            tracker.delete(_, n)
            deleteTrailingComma(_, n.parent, n, tracker);
        },
        insertNodeAtEndOfList(_, list, n) {
            if (list.hasTrailingComma) {
                if (list.length) {
                    tracker.insertNodeAt(_, list.end, n, { prefix: "\n" });
                }
                else {
                    tracker.insertNodeAt(_, list.pos, n, {});
                }
                return;
            }
            tracker.insertNodeAtEndOfList(_, list, n);
        }
    }
}

/**
 * @param {CodeFix} fix
 * @param {ChangeTracker} tracker
 */
function applyFix(fix, tracker) {
    if (fix.fixed) return;
    const originalTracker = tracker;

    fix.fixed = true;

    if (fix.antecedent) {
        if (ts.isObjectLiteralExpression(fix.antecedent.property.initializer)) {
            tracker = createDependenciesMutator(fix.antecedent);
        }
        else if (ts.isArrayLiteralExpression(fix.antecedent.property.initializer)) {
            tracker = createReferencesMutator(fix.antecedent);
        }
    }

    switch (fix.action) {
        case "removeProperty":
            tracker.delete(fix.file, fix.property);
            break;
        case "removeElement":
            tracker.delete(fix.file, fix.element);
            break;
        case "appendProperty":
            tracker.insertNodeAtEndOfList(fix.file, fix.object.properties, fix.property);
            break;
        case "appendElement":
            tracker.insertNodeAtEndOfList(fix.file, fix.array.elements, fix.element);
            break;
    }

    tracker = originalTracker;
    if (fix.antecedent) {
        applyFix(fix.antecedent, tracker);
    }
}

/**
 * @param {ts.SourceFile} file
 * @param {ts.Node} parent 
 * @param {ts.Node} node
 * @param {ChangeTracker} tracker
 */
function deleteTrailingComma(file, parent, node, tracker) {
    let children = parent.getChildren(file);
    let index = children.indexOf(node);
    if (index === -1) {
        const syntaxList = /** @type {ts.SyntaxList} */(children.find(n => n.kind === ts.SyntaxKind.SyntaxList));
        if (syntaxList) {
            children = syntaxList._children;
            index = children.indexOf(node);
        }
    }
    if (index < children.length - 1 && children[index + 1].kind === ts.SyntaxKind.CommaToken) {
        // delete the trailing comma
        const comma = children[index + 1];
        tracker.deleteRange(file, { pos: comma.pos, end: comma.pos + 1 });
    }
}
