// @ts-check
const ts = require("typescript");
const fs = require("fs");
const path = require("path");

/**
 * @param {string} basePath
 * @param {ts.SourceFile} sourceFile
 * @param {ts.Node | ts.TextRange} node
 */
function formatLocation(basePath, sourceFile, node) {
    const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, "kind" in node ? node.getStart(sourceFile) : node.pos);
    return `${path.relative(basePath, path.resolve(sourceFile.fileName))}:${line + 1}:${character + 1}`;
}
exports.formatLocation = formatLocation;

/**
 * @param {import("typescript").Node | undefined} expr
 * @param {string} name
 * @returns {import("./types").PropertyAssignmentInitializer | undefined}
 */
function pickProperty(expr, name) {
    if (expr && ts.isObjectLiteralExpression(expr)) {
        for (const property of expr.properties) {
            if (ts.isPropertyAssignment(property) && ts.isStringLiteral(property.name) && property.name.text === name) {
                return /** @type {import("./types").PropertyAssignmentInitializer} */(property.initializer);
            }
        }
    }
}
exports.pickProperty = pickProperty;

/**
 * @template T
 * @param {*} value 
 * @param {(value: any) => value is T} test 
 * @returns {T | undefined}
 */
function tryCast(value, test) {
    return value === undefined || !test(value) ? undefined : value;
}
exports.tryCast = tryCast;

/**
 * @template T
 * @template U
 * @param {T | U | undefined} value 
 * @param {(value: T | U) => value is U} test 
 * @returns {value is Exclude<T, U>}
 */
function isDefinedAndNot(value, test) {
    return value !== undefined && !test(value);
}
exports.isDefinedAndNot = isDefinedAndNot;

/**
 * @template T
 * @template U
 * @param {T | U | undefined} value 
 * @param {(value: T | U) => value is U} test 
 * @returns {value is Extract<T, U>}
 */
function isDefinedAnd(value, test) {
    return value !== undefined && test(value);
}
exports.isDefinedAnd = isDefinedAnd;

/**
 * @param {string} file
 * @param {(diagnostic: import("./types").Diagnostic) => void} addError
 * @returns {import("typescript").JsonSourceFile | undefined}
 */
 function tryReadJsonFile(file, addError) {
    try {
        const data = fs.readFileSync(file, "utf8");
        return /** @type {ts.JsonSourceFile} */(ts.createSourceFile(file, data, ts.ScriptTarget.JSON, /*setParentNodes*/ true, ts.ScriptKind.JSON));
    }
    catch (e) {
        addError({ message: `Error parsing package.json: ${e}` });
    }
}
exports.tryReadJsonFile = tryReadJsonFile;

/** @type {ts.ParseConfigFileHost} */
exports.parseConfigFileHost = {
    fileExists: ts.sys.fileExists,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    readDirectory: ts.sys.readDirectory,
    readFile: ts.sys.readFile,
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
    onUnRecoverableConfigFileDiagnostic: diagnostic => {},
};