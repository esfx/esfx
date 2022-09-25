// @ts-check
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const { COMMONJS_RESOLVE } = require("../resolver/cjsResolver");
const { normalizeSlashes } = require("../resolver/utils");
const types = require("./types");

/**
 * @param {string} inputDir
 * @param {string} outputDir
 */
function convertCjsToCjsLegacy(inputDir, outputDir) {
    for (const entry of fs.readdirSync(inputDir, { withFileTypes: true })) {
        const inputFile = path.join(inputDir, entry.name);
        if (entry.isDirectory()) {
            const outputFile = path.join(outputDir, entry.name);
            convertCjsToCjsLegacy(inputFile, outputFile);
        }
        else if (entry.name.endsWith(".js")) {
            const outputFile = path.join(outputDir, entry.name);
            const data = fs.readFileSync(inputFile, { encoding: "utf8" });
            const inputSourceFile = ts.createSourceFile(inputFile, data, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
            /** @type {string[]} */
            const errors = [];
            const result = ts.transform(inputSourceFile, [context => transformCjsToCjsLegacy(context, errors)], {
                allowJs: true,
                target: ts.ScriptTarget.ESNext,
                module: ts.ModuleKind.CommonJS,
            });
            const [outputSourceFile] = result.transformed;
            const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
            const output = printer.printFile(outputSourceFile);
            try { fs.mkdirSync(outputDir, { recursive: true }); } catch { }
            fs.writeFileSync(outputFile, output, "utf8");
            if (errors.length) {
                throw new Error(`Failed to convert file.\n  input: ${inputFile}\n  output: ${outputFile}\n  errors:\n    ${errors.join("\n    ")}`);
            }
        }
    }
}
exports.convertCjsToCjsLegacy = convertCjsToCjsLegacy;

/**
 * @param {ts.TransformationContext} context
 * @param {string[]} errors
 * @returns {ts.Transformer<ts.SourceFile>}
 */
function transformCjsToCjsLegacy(context, errors) {
    const { factory } = context;

    /** @type {ts.SourceFile} */
    let currentSourceFile;

    return visitSourceFile;

    /**
     * @param {ts.SourceFile} sourceFile
     */
    function visitSourceFile(sourceFile) {
        if (sourceFile.isDeclarationFile) return sourceFile;
        currentSourceFile = sourceFile;
        sourceFile = ts.visitEachChild(sourceFile, visitor, context);
        return sourceFile;
    }

    /**
     * @param {ts.Node} node
     * @returns {ts.VisitResult<ts.Node>}
     */
    function visitor(node) {
        return ts.isCallExpression(node) ? visitCallExpression(node) :
            ts.visitEachChild(node, visitor, context);
    }

    /**
     * @param {ts.CallExpression} node
     */
    function visitCallExpression(node) {
        if (isRequireCall(node) && node.arguments[0].text.startsWith("#")) {
            const moduleSpecifier = node.arguments[0].text;
            const newModuleSpecifier = rewriteModuleSpecifier(moduleSpecifier);
            if (newModuleSpecifier !== moduleSpecifier) {
                return factory.updateCallExpression(
                    node,
                    node.expression,
                    undefined,
                    [factory.createStringLiteral(newModuleSpecifier)]);
            }
            return node;
        }
        return ts.visitEachChild(node, visitor, context);
    }

    /**
     * @param {string} moduleSpecifier
     */
    function rewriteModuleSpecifier(moduleSpecifier) {
        // rewrite subpath imports to a relative import.
        if (moduleSpecifier.startsWith("#")) {
            try {
                const dirname = path.dirname(currentSourceFile.fileName);
                /** @type {import("../resolver/types").ResolverOpts} */
                const opts = {
                    basedir: dirname,
                    filename: currentSourceFile.fileName,
                    conditions: ["node", "require", "default"],
                    defaultResolver: () => { throw new Error(); }
                };
                const resolved = COMMONJS_RESOLVE(moduleSpecifier, currentSourceFile.fileName, opts);
                if (isFile(resolved)) {
                    const relative = normalizeSlashes(path.relative(dirname, resolved));
                    return relative.startsWith(".") ? relative : `./${relative}`;
                }
            }
            catch {
            }
        }
        return moduleSpecifier;
    }

    /**
     * @template {string} T
     * @param {ts.Node} node
     * @param {T} [name]
     * @returns {node is types.Id<T>}
     */
    function isId(node, name) {
        return ts.isIdentifier(node)
            && (name === undefined || ts.idText(node) === name);
    }

    /**
     * @param {ts.Node} node
     * @returns {node is types.RequireCall}
     */
    function isRequireCall(node) {
        return ts.isCallExpression(node)
            && isId(node.expression, "require")
            && node.arguments.length === 1
            && ts.isStringLiteral(node.arguments[0]);
    }

    /**
     * @param {string} file
     */
    function isFile(file) {
        try {
            return fs.statSync(file).isFile();
        }
        catch {
            return false;
        }
    }
}
