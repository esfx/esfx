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
 * @template {ts.Node} T
 * @param {import("typescript").Node | undefined} expr
 * @param {string} name
 * @param {(node: ts.Node) => node is T} test
 * @returns {T & import("./types").PropertyAssignmentInitializer | undefined}
 */
function pickPropertyMatching(expr, name, test) {
    const result = pickProperty(expr, name);
    if (result && test(result)) {
        return result;
    }
}
exports.pickPropertyMatching = pickPropertyMatching;

/**
 * @param {ts.JsonSourceFile | undefined} file
 * @returns {ts.ObjectLiteralExpression | undefined}
 */
function getObjectLiteralBody(file) {
    const body = file?.statements[0].expression;
    if (body && ts.isObjectLiteralExpression(body)) return body;
}
exports.getObjectLiteralBody = getObjectLiteralBody;

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

const compilerHost = ts.createCompilerHost({});
const getCanonicalFileName = compilerHost.getCanonicalFileName.bind(compilerHost);

/**
 * @param {string} file
 * @returns {ts.Path}
 */
function toPath(file) {
    return /** @type {*} */(ts).toPath(file, compilerHost.getCurrentDirectory(), getCanonicalFileName);
}
exports.toPath = toPath;

/**
 * @param {string} file
 * @param {((diagnostic: import("./types").Diagnostic) => void) | undefined} addError
 * @param {Map<string, ts.JsonSourceFile>} [knownFiles]
 * @returns {import("typescript").JsonSourceFile | undefined}
 */
function tryReadJsonFile(file, addError, knownFiles) {
    let data;
    try {
        data = fs.readFileSync(file, "utf8");
    }
    catch (e) {
        addError?.({ message: `File not found: ${file}`, code: "ENOENT" });
        return;
    }

    try {
        const sourceFile = /** @type {ts.JsonSourceFile} */(ts.createSourceFile(toPath(file), data, ts.ScriptTarget.JSON, /*setParentNodes*/ true, ts.ScriptKind.JSON));
        /** @type {*} */(sourceFile).path = toPath(sourceFile.fileName);
        knownFiles?.set(sourceFile.fileName, sourceFile);
        return sourceFile;
    }
    catch (e) {
        addError?.({ message: `Error parsing package.json: ${e}` });
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

/**
 * @param {import("../resolver/types").PackageJsonExports} map
 * @param {"commonjs" | "module"} moduleType
 * @returns {import("../resolver/types").PackageJsonExports}
 */
function simplifyExportsMap(map, moduleType) {
    let previous;
    do {
        previous = map;
        if (Array.isArray(map)) map = simplifyPackageJsonRelativeExportArray(map, moduleType);
        if (isPackageJsonConditionalExports(map)) map = simplifyPackageJsonConditionalExport(map, moduleType);
        if (isPackageJsonRelativeExports(map)) map = simplifyPackageJsonRelativeExports(map, moduleType);
    }
    while (previous !== map);
    return map;
}
exports.simplifyExportsMap = simplifyExportsMap;

/**
 * @param {import("../resolver/types").PackageJsonRelativeExports} map
 * @param {"commonjs" | "module"} moduleType
 * @returns {import("../resolver/types").PackageJsonExports}
 */
function simplifyPackageJsonRelativeExports(map, moduleType) {
    const entries = Object.entries(map);
    if (entries.length === 1 && entries[0][0] === ".") {
        const simplified = simplifyPackageJsonRelativeExportOrNull(entries[0][1], moduleType);
        if (simplified !== null) return simplified;
    }

    let result;
    for (let i = 0; i < entries.length; i++) {
        const [key, value] = entries[i];
        const simplified = simplifyPackageJsonRelativeExportOrNull(value, moduleType);
        if (result || simplified !== value) {
            result ||= entries.slice(0, i);
            result.push([key, simplified]);
        }
    }
    return result ? Object.fromEntries(result) : map;
}

/**
 * @param {import("../resolver/types").PackageJsonRelativeExport | null} map
 * @param {"commonjs" | "module"} moduleType
 * @returns {import("../resolver/types").PackageJsonRelativeExport | null}
 */
function simplifyPackageJsonRelativeExportOrNull(map, moduleType) {
    return map === null ? null : simplifyPackageJsonRelativeExport(map, moduleType);
}

/**
 * @param {import("../resolver/types").PackageJsonRelativeExport} map
 * @param {"commonjs" | "module"} moduleType
 * @returns {import("../resolver/types").PackageJsonRelativeExport}
 */
function simplifyPackageJsonRelativeExport(map, moduleType) {
    if (Array.isArray(map)) return simplifyPackageJsonRelativeExportArray(map, moduleType);
    return simplifyPackageJsonConditionalExport(map, moduleType);
}

/**
 * @param {import("../resolver/types").PackageJsonRelativeExportArray} map
 * @param {"commonjs" | "module"} moduleType
 * @returns {import("../resolver/types").PackageJsonRelativeExport}
 */
function simplifyPackageJsonRelativeExportArray(map, moduleType) {
    if (map.length === 1) {
        return simplifyPackageJsonRelativeExport(map[0], moduleType);
    }

    let result;
    for (let i = 0; i < map.length; i++) {
        const entry = map[i];
        const simplified = simplifyPackageJsonRelativeExport(entry, moduleType);
        if (result || simplified !== entry) {
            result ||= map.slice(0, i);
            result.push(simplified);
        }
    }
    return result || map;
}

/**
 * @param {import("../resolver/types").PackageJsonConditionalExports | string} map
 * @param {"commonjs" | "module"} moduleType
 * @returns {import("../resolver/types").PackageJsonConditionalExports | string}
 */
function simplifyPackageJsonConditionalExport(map, moduleType) {
    if (typeof map === "string") return map;

    const entries = Object.entries(map);
    if (entries.length === 1 && (entries[0][0] === (moduleType === "commonjs" ? "require" : "import") || entries[0][0] === "default")) {
        return simplifyPackageJsonConditionalExport(entries[0][1], moduleType);
    }

    let result;
    for (let i = 0; i < entries.length; i++) {
        const [key, value] = entries[i];
        const simplified = simplifyPackageJsonConditionalExport(value, moduleType);
        if (result || simplified !== value) {
            result ||= entries.slice(0, i);
            result.push([key, simplified]);
        }
    }
    return result ? Object.fromEntries(result) : map;
}/**
 * @param {import("../resolver/types").PackageJsonExports} map
 */
function createExportsMap(map) {
    if (typeof map === "string") return ts.factory.createStringLiteral(map);
    if (Array.isArray(map)) return createPackageJsonRelativeExportArray(map);
    if (isPackageJsonConditionalExports(map)) return createPackageJsonConditionalExports(map);
    if (isPackageJsonRelativeExports(map)) return createPackageJsonRelativeExports(map);
    throw new Error("Invalid exports map");
}

exports.createExportsMap = createExportsMap;

/**
 * @param {import("../resolver/types").PackageJsonRelativeExportArray} map
 */
function createPackageJsonRelativeExportArray(map) {
    const node = ts.factory.createArrayLiteralExpression(
        map.slice().sort((a, b) => compareRelativeExports(a, b)).map(entry => createPackageJsonRelativeExport(entry)),
        true
    );
    ts.setEmitFlags(node, ts.EmitFlags.Indented);
    return node;
}

/**
 * @param {import("../resolver/types").PackageJsonConditionalExports | string} map
 */
function createPackageJsonConditionalExports(map) {
    if (typeof map === "string") return ts.factory.createStringLiteral(map);
    const node = ts.factory.createObjectLiteralExpression(Object.entries(map).sort((a, b) => compareConditions(a[0], b[0])).map(([key, value]) =>
        ts.factory.createPropertyAssignment(
            ts.factory.createStringLiteral(key),
            createPackageJsonConditionalExports(value)
        )), true);
    ts.setEmitFlags(node, ts.EmitFlags.Indented);
    return node;
}

/**
 * @param {import("../resolver/types").PackageJsonRelativeExports} map
 */
function createPackageJsonRelativeExports(map) {
    const node = ts.factory.createObjectLiteralExpression(Object.entries(map).sort((a, b) => compare(a[0], b[0])).map(([key, value]) =>
        ts.factory.createPropertyAssignment(
            ts.factory.createStringLiteral(key),
            createPackageJsonRelativeExportOrNull(value)
        )), true);
    ts.setEmitFlags(node, ts.EmitFlags.Indented);
    return node;
}

/**
 * @param {import("../resolver/types").PackageJsonRelativeExport | null} map
 */
function createPackageJsonRelativeExportOrNull(map) {
    return map === null ? ts.factory.createNull() :
        createPackageJsonRelativeExport(map);
}

/**
 * @param {import("../resolver/types").PackageJsonRelativeExport} map
 */
function createPackageJsonRelativeExport(map) {
    if (typeof map === "string") return ts.factory.createStringLiteral(map);
    if (Array.isArray(map)) return createPackageJsonRelativeExportArray(map);
    if (isPackageJsonConditionalExports(map)) return createPackageJsonConditionalExports(map);
    throw new Error("Invalid exports map");
}

function compare(a, b) {
    return a < b ? -1 : a > b ? +1 : 0;
}

/**
 *
 * @param {import("../resolver/types").PackageJsonRelativeExport} a
 * @param {import("../resolver/types").PackageJsonRelativeExport} b
 */
function compareRelativeExports(a, b) {
    return typeof a === "string" ? typeof b === "string" ? compare(a, b) : 1 : typeof b === "string" ? +1 : 0;
}

function compareConditions(a, b) {
    return compare(a === "types" ? 0 : a === "require" ? 1 : 2, b === "types" ? 0 : b === "require" ? 1 : 2)
        || compare(a, b);
}

/**
 * @param {import("../resolver/types").PackageJsonExports} map
 */
function getExportsMapCardinality(map) {
    if (!map) return "none";
    if (typeof map === "string" || Array.isArray(map) || isPackageJsonConditionalExports(map)) return "one";
    const entries = Object.entries(map).filter(([key, value]) => value !== null);
    return entries.length === 0 ? "none" :
        entries.length === 1 ? "one" :
        "many";
}
exports.getExportsMapCardinality = getExportsMapCardinality;

class JsonQuote {
    /**
     * @param {ts.JsonObjectExpression} value
     */
    constructor(value) {
        this.value = value;
    }
}
exports.JsonQuote = JsonQuote;

/**
 * @param {ts.Node} node
 * @returns {node is import("./types").JsonArrayLiteralExpression}
 */
function isJsonArrayLiteralExpression(node) {
    return ts.isArrayLiteralExpression(node);
}
exports.isJsonArrayLiteralExpression = isJsonArrayLiteralExpression;

/**
 * @param {ts.Node} node
 * @returns {node is import("./types").JsonObjectLiteralExpression}
 */
function isJsonObjectLiteralExpression(node) {
    return ts.isObjectLiteralExpression(node);
}
exports.isJsonObjectLiteralExpression = isJsonObjectLiteralExpression;

/**
 * @param {unknown} value
 * @returns {ts.JsonObjectExpression | undefined}
 */
function createJsonObjectExpression(value, multiline = true) {
    return createJsonObjectExpression(value, new Set());

    /**
     * @param {unknown} value
     * @param {Set<object>} seen
     * @returns {ts.JsonObjectExpression | undefined}
     */
    function createJsonObjectExpression(value, seen) {
        switch (typeof value) {
            case "string":
                return ts.factory.createStringLiteral(value);
            case "number":
                return !isFinite(value) ? undefined :
                    value >= 0 ? ts.factory.createNumericLiteral(value) :
                    /** @type {ts.JsonMinusNumericLiteral} */(ts.factory.createPrefixMinus(ts.factory.createNumericLiteral(-value)));
            case "boolean":
                return value ? ts.factory.createTrue() : ts.factory.createFalse();
            case "object":
                if (value === null) {
                    return ts.factory.createNull();
                }
                if (value instanceof JsonQuote) {
                    return value.value;
                }
                if (seen.has(value)) {
                    throw new Error("Circular");
                }
                if (Array.isArray(value)) {
                    const elements = [];
                    seen.add(value);
                    for (let i = 0; i < value.length; i++) {
                        elements.push(createJsonObjectExpression(value[i], seen) ?? ts.factory.createNull());
                    }
                    seen.delete(value);
                    return ts.setEmitFlags(ts.factory.createArrayLiteralExpression(elements, multiline), ts.EmitFlags.Indented);
                }
                else {
                    const properties = [];
                    seen.add(value);
                    for (const entry of Object.entries(value)) {
                        const [key, value] = entry;
                        const expression = createJsonObjectExpression(value, seen);
                        if (expression) properties.push(ts.factory.createPropertyAssignment(ts.factory.createStringLiteral(key), expression));
                    }
                    seen.delete(value);
                    return ts.setEmitFlags(ts.factory.createObjectLiteralExpression(properties, multiline), ts.EmitFlags.Indented);
                }
            default:
                return undefined;
        }
    }
}
exports.createJsonObjectExpression = createJsonObjectExpression;


/**
 *
 * @param {ts.JsonObjectExpression} value
 */
function jsonObjectExpressionToJson(value) {
    if (!ts.isObjectLiteralExpression(value)) return;

    /**
     * @param {ts.JsonObjectExpression} node
     */
    function visit(node) {
        switch (node.kind) {
            case ts.SyntaxKind.StringLiteral: return node.text;
            case ts.SyntaxKind.NumericLiteral: return +node.text;
            case ts.SyntaxKind.TrueKeyword: return true;
            case ts.SyntaxKind.FalseKeyword: return false;
            case ts.SyntaxKind.NullKeyword: return null;
            case ts.SyntaxKind.PrefixUnaryExpression: return node.operator === ts.SyntaxKind.MinusToken ? -visit(node.operand) : visit(node.operand);
            case ts.SyntaxKind.ArrayLiteralExpression: return node.elements.map(child => visit(/** @type {ts.JsonObjectExpression} */(child)));
            case ts.SyntaxKind.ObjectLiteralExpression: return Object.fromEntries(
                node.properties.map(prop => {
                    if (!ts.isPropertyAssignment(prop) || !ts.isStringLiteral(prop.name)) throw new Error("Illegal state");
                    return [prop.name.text, visit(/** @type {ts.JsonObjectExpression} */(prop.initializer))]
                })
            );
        }
    }

    return visit(value);
}
exports.jsonObjectExpressionToJson = jsonObjectExpressionToJson;

/**
 * @param {string} key
 */
function isSubpathKey(key) {
    return key.startsWith(".");
}

/**
 * @param {string} key
 */
function isConditionKey(key) {
    if (isSubpathKey(key)) return false;
    const n = +key;
    return !(`${n}` === key && n >= 0 && n <= Number.MAX_SAFE_INTEGER && !key.includes("."));
}

/**
 * @param {string} key
 */
function isImportKey(key) {
    return key.startsWith("#");
}

/**
 * @param {any} value
 */
function isPackageJsonRelativeExportArray(value) {
    return Array.isArray(value) &&
        value.every(isPackageJsonRelativeExport);
}

/**
 * @param {unknown} value
 * @return {value is import("../resolver/types").PackageJsonConditionalExports | string}
 */
function isPackageJsonConditionalExportsOrString(value) {
    return typeof value === "string" || isPackageJsonConditionalExports(value);
}

/**
 * @param {unknown} value
 * @return {value is import("../resolver/types").PackageJsonConditionalExports}
 */
function isPackageJsonConditionalExports(value) {
    return typeof value === "object" && value !== null &&
        !Array.isArray(value) &&
        Object.keys(value).every(isConditionKey) &&
        Object.values(value).every(isPackageJsonConditionalExportsOrString);
}
exports.isPackageJsonConditionalExports = isPackageJsonConditionalExports;

/**
 * @param {unknown} value
 */
function isPackageJsonRelativeExport(value) {
    return typeof value === "string" ||
        isPackageJsonRelativeExportArray(value) ||
        isPackageJsonConditionalExports(value);
}

/**
 * @param {unknown} value
 */
function isPackageJsonRelativeExportOrNull(value) {
    return typeof value === null ||
        isPackageJsonRelativeExport(value);
}

/**
 * @param {unknown} value
 * @return {value is import("../resolver/types").PackageJsonRelativeExports}
 */
function isPackageJsonRelativeExports(value) {
    return typeof value === "object" && value !== null &&
        Object.keys(value).every(isSubpathKey) &&
        Object.values(value).every(isPackageJsonRelativeExportOrNull);
}
exports.isPackageJsonRelativeExports = isPackageJsonRelativeExports;

/**
 * @param {unknown} value
 * @returns {value is import("../resolver/types").PackageJsonExports}
 */
function isPackageJsonExports(value) {
    return isPackageJsonRelativeExport(value) ||
        isPackageJsonRelativeExports(value);
}
exports.isPackageJsonExports = isPackageJsonExports;

/**
 * @param {unknown} value
 * @returns {value is import("../resolver/types").PackageJsonImports}
 */
function isPackageJsonImports(value) {
    return typeof value === "object" && value !== null &&
        Object.keys(value).every(isImportKey) &&
        Object.values(value).every(isPackageJsonRelativeExportOrNull);
}
exports.isPackageJsonImports = isPackageJsonImports;
