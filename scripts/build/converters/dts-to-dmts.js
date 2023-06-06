// @ts-check
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

/**
 * @param {string} inputDir
 * @param {string} outputDir
 */
function convertDtsToDmts(inputDir, outputDir) {
    for (const entry of fs.readdirSync(inputDir, { withFileTypes: true })) {
        const inputFile = path.join(inputDir, entry.name);
        if (entry.isDirectory()) {
            const outputFile = path.join(outputDir, entry.name);
            convertDtsToDmts(inputFile, outputFile);
        }
        else {
            const extname_len =
                entry.name.endsWith(".d.ts") ? 3 :
                entry.name.endsWith(".d.cts") ? 4 :
                undefined;
            if (extname_len) {
                const outputFile = path.join(outputDir, entry.name.slice(0, -extname_len) + ".mts");
                const data = fs.readFileSync(inputFile, { encoding: "utf8" });
                const inputSourceFile = ts.createSourceFile(inputFile, data, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
                /** @type {string[]} */
                const errors = [];
                const result = ts.transform(inputSourceFile, [context => transformDtsToDmts(context, errors)], {
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
}
exports.convertDtsToDmts = convertDtsToDmts;

/**
 * @param {ts.TransformationContext} context
 * @param {string[]} errors
 * @returns {ts.Transformer<ts.SourceFile>}
 */
function transformDtsToDmts(context, errors) {
    const { factory } = context;

    /** @type {Map<string, boolean>} */
    const tslibBindingNames = new Map();
    /** @type {Map<string, boolean>} */
    const potentialHelperReferences = new Map();
    /** @type {ts.SourceFile} */
    let currentSourceFile;

    return visitSourceFile;

    /**
     * @param {ts.SourceFile} sourceFile
     */
    function visitSourceFile(sourceFile) {
        if (!sourceFile.isDeclarationFile) return sourceFile;
        currentSourceFile = sourceFile;
        tslibBindingNames.clear();
        potentialHelperReferences.clear();
        sourceFile = ts.visitEachChild(sourceFile, visitor, context);
        return sourceFile;
    }

    /**
     * @param {ts.Node} node
     * @returns {ts.VisitResult<ts.Node>}
     */
    function visitor(node) {
        return ts.isImportDeclaration(node) ? visitImportDeclaration(node) :
            ts.isImportTypeNode(node) ? visitImportTypeNode(node) :
            ts.isExportDeclaration(node) ? visitExportDeclaration(node) :
            ts.isImportEqualsDeclaration(node) ? visitImportEqualsDeclaration(node) :
            ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword ? visitImportCall(/** @type {ts.ImportCall} */(node)) :
            ts.visitEachChild(node, visitor, context);
    }

    /**
     * @param {string} moduleSpecifier 
     */
    function rewriteModuleSpecifier(moduleSpecifier) {
        if (/^\./.test(moduleSpecifier)) {
            if (/^\.\.[\\/]?$/.test(moduleSpecifier)) return "../index.mjs";
            if (/^\.[\\/]?$/.test(moduleSpecifier)) return "./index.mjs";
            if (path.extname(moduleSpecifier) === ".js") return moduleSpecifier.slice(0, -3) + ".mjs";
            if (path.extname(moduleSpecifier) === ".cjs") return moduleSpecifier.slice(0, -4) + ".mjs";
            const resolved = path.resolve(path.dirname(currentSourceFile.fileName), moduleSpecifier);
            if (isFile(resolved)) return moduleSpecifier;
            if (isFile(resolved + ".js")) return moduleSpecifier + ".mjs";
            if (isFile(resolved + ".cjs")) return moduleSpecifier + ".mjs";
            if (isFile(path.join(resolved, "index.js"))) return path.posix.join(moduleSpecifier, "index.mjs");
            if (isFile(path.join(resolved, "index.cjs"))) return path.posix.join(moduleSpecifier, "index.mjs");
        }
        return moduleSpecifier;
    }

    /**
     * @param {ts.ImportDeclaration} node
     */
    function visitImportDeclaration(node) {
        if (ts.isStringLiteral(node.moduleSpecifier)) {
            const moduleSpecifier = rewriteModuleSpecifier(node.moduleSpecifier.text);
            if (moduleSpecifier !== node.moduleSpecifier.text) {
                return factory.updateImportDeclaration(
                    node,
                    node.decorators,
                    node.modifiers,
                    node.importClause,
                    factory.createStringLiteral(
                        moduleSpecifier
                    ),
                    node.assertClause
                );
            }
        }
        return node;
    }

    /**
     * @param {ts.ImportTypeNode} node
     */
    function visitImportTypeNode(node) {
        if (ts.isLiteralTypeNode(node.argument) &&
            ts.isStringLiteral(node.argument.literal)) {
            const moduleSpecifier = rewriteModuleSpecifier(node.argument.literal.text);
            if (moduleSpecifier !== node.argument.literal.text) {
                return factory.updateImportTypeNode(
                    node,
                    factory.updateLiteralTypeNode(node.argument,
                        factory.createStringLiteral(
                            moduleSpecifier
                        )
                    ),
                    node.qualifier,
                    ts.visitNodes(node.typeArguments, visitor, ts.isTypeNode),
                    node.isTypeOf
                );
            }
        }
        return node;
    }

    /**
     * @param {ts.ImportEqualsDeclaration} node
     */
    function visitImportEqualsDeclaration(node) {
        if (ts.isExternalModuleReference(node.moduleReference) &&
            ts.isStringLiteral(node.moduleReference.expression)) {
            const moduleSpecifier = rewriteModuleSpecifier(node.moduleReference.expression.text);
            if (moduleSpecifier !== node.moduleReference.expression.text) {
                return factory.updateImportEqualsDeclaration(
                    node,
                    node.decorators,
                    node.modifiers,
                    node.isTypeOnly,
                    node.name,
                    factory.updateExternalModuleReference(
                        node.moduleReference,
                        factory.createStringLiteral(
                            moduleSpecifier
                        )
                    )
                );
            }
        }
        return node;
    }

    /**
     * @param {ts.ImportCall} node
     */
    function visitImportCall(node) {
        if (node.arguments.length >= 1 && ts.isStringLiteral(node.arguments[0])) {
            const moduleSpecifier = rewriteModuleSpecifier(node.arguments[0].text);
            if (moduleSpecifier !== node.arguments[0].text) {
                return factory.updateCallExpression(
                    node,
                    node.expression,
                    undefined, [
                        factory.createStringLiteral(moduleSpecifier),
                        ...ts.visitNodes(node.arguments, visitor, undefined, 1)
                    ]);
            }
        }
        return node;
    }

    /**
     * @param {ts.ExportDeclaration} node
     */
    function visitExportDeclaration(node) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
            const moduleSpecifier = rewriteModuleSpecifier(node.moduleSpecifier.text);
            if (moduleSpecifier !== node.moduleSpecifier.text) {
                return factory.updateExportDeclaration(
                    node,
                    node.decorators,
                    node.modifiers,
                    node.isTypeOnly,
                    node.exportClause,
                    factory.createStringLiteral(moduleSpecifier),
                    node.assertClause
                )
            }
        }
        return node;
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
