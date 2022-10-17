// @ts-check
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const { formatLocation } = require("../verifier/utils");
const types = require("./types");

/**
 * @param {string} inputDir
 * @param {string} outputDir
 */
function convertCjsToEsm(inputDir, outputDir) {
    for (const entry of fs.readdirSync(inputDir, { withFileTypes: true })) {
        const inputFile = path.join(inputDir, entry.name);
        if (entry.isDirectory()) {
            const outputFile = path.join(outputDir, entry.name);
            convertCjsToEsm(inputFile, outputFile);
        }
        else if (entry.name.endsWith(".js")) {
            const outputFile = path.join(outputDir, entry.name.slice(0, -3) + ".mjs");
            const data = fs.readFileSync(inputFile, { encoding: "utf8" });
            const inputSourceFile = ts.createSourceFile(inputFile, data, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
            /** @type {string[]} */
            const errors = [];
            const result = ts.transform(inputSourceFile, [context => transformCjsToEsm(context, errors)], {
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
exports.convertCjsToEsm = convertCjsToEsm;

/**
 * @param {ts.TransformationContext} context
 * @param {string[]} errors
 * @returns {ts.Transformer<ts.SourceFile>}
 */
function transformCjsToEsm(context, errors) {
    const { factory } = context;

    /** @type {Map<string, boolean>} */
    const tslibBindingNames = new Map();
    /** @type {Map<string, boolean>} */
    const potentialHelperReferences = new Map();
    // known import/export related helpers we should potentially elide
    const knownHelperNames = new Set([
        "__importDefault",
        "__createBinding",
        "__exportStar",
        "__importStar",
        "__setModuleDefault",
    ]);
    const safeExportBindings = new Set();
    let exportsDeclarationDepth = 0;
    /** @type {ts.SourceFile} */
    let currentSourceFile;

    return visitSourceFile;

    /**
     * @param {ts.SourceFile} sourceFile
     */
    function visitSourceFile(sourceFile) {
        if (sourceFile.isDeclarationFile) return sourceFile;
        currentSourceFile = sourceFile;
        tslibBindingNames.clear();
        potentialHelperReferences.clear();
        sourceFile = visitSourceFileTopLevelPass1(sourceFile);
        sourceFile = ts.visitEachChild(sourceFile, visitor, context);
        sourceFile = treeShakeUnusedHelpers(sourceFile);
        
        ts.forEachChild(sourceFile, function validate(node) {
            if (isRequireCall(node) || isExportBinding(node) && !safeExportBindings.has(node)) {
                const original = ts.getOriginalNode(node);
                if (original.pos !== -1 && original.end !== -1) {
                    const location = formatLocation(process.cwd(), currentSourceFile, original);
                    errors.push(`${location}: untransformed require call or export binding.`);
                }
                else {
                    errors.push(`untransformed require call or export binding.`);
                }
            }
            ts.forEachChild(node, validate);
        });
        return sourceFile;
    }

    /**
     * @param {ts.Node} node
     * @returns {ts.VisitResult<ts.Node>}
     */
    function visitor(node) {
        return ts.isImportDeclaration(node) ? visitImportDeclaration(node) :
            ts.isExportDeclaration(node) ? visitExportDeclaration(node) :
            ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword ? visitImportCall(/** @type {ts.ImportCall} */(node)) :
            isExportAssignment(node) ? visitExportAssignment(node) :
            isExportBinding(node) ? visitExportBinding(node) :
            ts.isClassDeclaration(node) ? visitClassDeclaration(node) :
            ts.isClassExpression(node) ? visitClassExpression(node) :
            ts.isFunctionDeclaration(node) ? visitFunctionDeclaration(node) :
            ts.isFunctionExpression(node) ? visitFunctionExpression(node) :
            ts.isArrowFunction(node) ? visitArrowFunction(node) :
            ts.isMethodDeclaration(node) ? visitMethodDeclaration(node) :
            ts.isConstructorDeclaration(node) ? visitConstructorDeclaration(node) :
            ts.isGetAccessorDeclaration(node) ? visitGetAccessorDeclaration(node) :
            ts.isSetAccessorDeclaration(node) ? visitSetAccessorDeclaration(node) :
            ts.isForStatement(node) ? visitForStatement(node) :
            ts.isForInStatement(node) ? visitForInStatement(node) :
            ts.isForOfStatement(node) ? visitForOfStatement(node) :
            ts.isBlock(node) ? visitBlock(node) :
            ts.visitEachChild(node, visitor, context);
    }

    /**
     * The first pass converts CommonJS-style imports and exports into `import` and `export` declarations.
     * @param {ts.SourceFile} sourceFile
     */
    function visitSourceFileTopLevelPass1(sourceFile) {
        if (sourceFile.isDeclarationFile) return sourceFile;

        /** @type {"bof" | "past-prologue" | "past-helpers" | "past-esmodule-marker" | "past-hoisted-exports"} */
        let state = "bof";
        let hasChanges = false;

        /** @type {Map<string, "var" | "let" | "const">} */
        const seenDeclarations = new Map();

        /** @type {ts.Statement[]} */
        const statements = [];

        let lastI = -1;
        let i = 0;
        while (i < sourceFile.statements.length) {
            if (i === lastI) throw new Error("did not advance");
            lastI = i;

            const statement = sourceFile.statements[i];

            if (state === "bof") {
                /// "use strict";
                if (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression)) {
                    // es modules are strict by default
                    if (statement.expression.text === "use strict") {
                        elide(statement);
                    }
                    else {
                        accept(statement);
                    }
                    continue;
                }

                /// var _a, _b;
                if (isTempVars(statement)) {
                    accept(statement);
                    continue;
                }

                state = "past-prologue";
            }

            if (state === "past-prologue") {
                /// var __importStar = ...;
                if (isPotentialHelper(statement)) {
                    const helperName = ts.idText(statement.declarationList.declarations[0].name);

                    // track import/export related helpers
                    if (knownHelperNames.has(helperName)) {
                        potentialHelperReferences.set(helperName, false);
                    }

                    accept(statement);
                    continue;
                }

                /// var _a, _b;
                if (isTempVars(statement)) {
                    accept(statement);
                    continue;
                }

                state = "past-helpers";
            }

            if (state === "past-helpers") {
                /// Object.defineProperty(exports, "__esModule", { value: true });
                if (ts.isExpressionStatement(statement) && isESModuleMarker(statement.expression)) {
                    elide(statement);

                    state = "past-esmodule-marker";
                    continue;
                }

                /// var _a, _b;
                if (isTempVars(statement)) {
                    accept(statement);
                    continue;
                }

                state = "past-hoisted-exports";
            }

            if (state === "past-esmodule-marker") {
                /// exports.x = exports.y = void 0;
                if (ts.isExpressionStatement(statement) && isHoistedExport(statement.expression)) {
                    elide(statement);

                    if (countHoistedExports(statement.expression) < 50) {
                        state = "past-hoisted-exports";
                    }
                    continue;
                }

                if (isTempVars(statement)) {
                    accept(statement);
                    continue;
                }

                state = "past-hoisted-exports";
            }

            /// exports.x = ...;
            if (ts.isExpressionStatement(statement) && isExportAssignment(statement.expression)) {
                const propertyName = getExportBindingName(statement.expression);
                const kind = seenDeclarations.get(propertyName);
                if ((kind === "let" || kind === "const") && ts.isIdentifier(statement.expression.right)) {
                    const name = ts.idText(statement.expression.right);
                    replace(statement, factory.createExportDeclaration(
                        undefined,
                        undefined,
                        false,
                        factory.createNamedExports([
                            factory.createExportSpecifier(
                                false,
                                propertyName === name ? undefined : propertyName,
                                name
                            )
                        ]),
                        undefined,
                        undefined
                    ));
                }
                else if (propertyName === "default") {
                    replace(statement, factory.createExportDefault(statement.expression.right));
                }
                else {
                    seenDeclarations.set(propertyName, "var");
                    replace(statement, factory.createVariableStatement(
                        factory.createModifiersFromModifierFlags(ts.ModifierFlags.Export),
                        factory.createVariableDeclarationList([
                            factory.createVariableDeclaration(
                                statement.expression.left.name,
                                undefined,
                                undefined,
                                statement.expression.right
                            )
                        ])
                    ));
                }
                continue;
            }

            /// __exportStar(require("..."), exports);
            if (ts.isExpressionStatement(statement) && isExportStar(statement.expression)) {
                replace(statement, factory.createExportDeclaration(
                    undefined,
                    undefined,
                    false,
                    undefined,
                    factory.createStringLiteral(getExportModuleSpecifier(statement.expression)),
                    undefined
                ));
                continue;
            }

            /// var x = require("...");
            /// var x = __importDefault(require("..."));
            /// var x = __importStar(require("..."));
            /// const x = require("...");
            /// const x = __importDefault(require("..."));
            /// const x = __importStar(require("..."));
            if (isImportAssignment(statement) || isImportInteropAssignment(statement) || isImportStar(statement)) {
                const name = ts.idText(getImportBindingName(statement));
                if (getImportModuleSpecifier(statement).text === "tslib") {
                    tslibBindingNames.set(name, false);
                }
                seenDeclarations.set(name, "const");

                if (isImportAssignment(statement) || isImportInteropAssignment(statement)) {
                    const exportSpecifiers = [];
                    while (i + exportSpecifiers.length + 1 < sourceFile.statements.length) {
                        const nextStatement = sourceFile.statements[i + exportSpecifiers.length + 1];
                        let reexport;
                        let prop;
                        if (ts.isExpressionStatement(nextStatement) &&
                            isReexport(reexport = nextStatement.expression) &&
                            ts.idText((prop = reexport.arguments[2].properties[1].initializer.body.statements[0].expression).expression) === name) {
                            const propertyName = reexport.arguments[1].text;
                            const name = ts.idText(prop.name);
                            exportSpecifiers.push(
                                factory.createExportSpecifier(
                                    false,
                                    propertyName === name ? undefined : propertyName,
                                    name
                                )
                            );
                            continue;
                        }
                        break;
                    }

                    if (exportSpecifiers.length) {
                        replace(statement, factory.createExportDeclaration(
                            undefined,
                            undefined,
                            false,
                            factory.createNamedExports(exportSpecifiers),
                            getImportModuleSpecifier(statement),
                            undefined
                        ));
                        for (const _ of exportSpecifiers) {
                            elide(sourceFile.statements[i]);
                        }
                        continue;
                    }
                }

                replace(statement, factory.createImportDeclaration(
                    undefined,
                    undefined,
                    factory.createImportClause(
                        false,
                        undefined,
                        factory.createNamespaceImport(getImportBindingName(statement))
                    ),
                    getImportModuleSpecifier(statement),
                    undefined,
                ));

                continue;
            }

            /// require("...");
            if (ts.isExpressionStatement(statement) && isRequireCall(statement.expression)) {
                replace(statement, factory.createImportDeclaration(
                    undefined,
                    undefined,
                    undefined,
                    statement.expression.arguments[0],
                    undefined,
                ));
                continue;
            }

            // namespace merges with previous declaration
            if (ts.isExpressionStatement(statement) &&
                isExportNamespaceIIFE(statement.expression) &&
                seenDeclarations.has(getExportBindingName(statement.expression))
            ) {
                replace(statement, factory.updateExpressionStatement(
                    statement,
                    ts.setEmitFlags(
                        factory.updateCallExpression(
                            statement.expression,
                            statement.expression.expression,
                            undefined, [
                            factory.createLogicalOr(
                                statement.expression.arguments[0].left,
                                factory.createAssignment(
                                    statement.expression.arguments[0].left,
                                    factory.createObjectLiteralExpression()
                                )
                            )
                        ]),
                        ts.EmitFlags.NoLeadingComments)
                ));
                continue;
            }

            const nextStatement = i < sourceFile.statements.length - 1 ? sourceFile.statements[i + 1] : undefined;
            if (nextStatement) {
                /// function f(...) { ... }
                /// exports.f = f;
                if (ts.isFunctionDeclaration(statement) &&
                    ts.isExpressionStatement(nextStatement) &&
                    isExportAssignment(nextStatement.expression) &&
                    getExportBindingName(nextStatement.expression) === getDeclarationName(statement)
                ) {
                    seenDeclarations.set(getExportBindingName(nextStatement.expression), "var");
                    elide(statement);
                    replace(nextStatement, factory.updateFunctionDeclaration(
                        statement,
                        /*decorators*/ undefined,
                        factory.createModifiersFromModifierFlags(ts.getCombinedModifierFlags(statement) | ts.ModifierFlags.Export),
                        statement.asteriskToken,
                        statement.name,
                        undefined,
                        statement.parameters,
                        undefined,
                        statement.body));
                    continue;
                }

                /// class C ... { ... }
                /// exports.C = C;
                if (ts.isClassDeclaration(statement) &&
                    ts.isExpressionStatement(nextStatement) &&
                    isExportAssignment(nextStatement.expression) &&
                    getExportBindingName(nextStatement.expression) === getDeclarationName(statement)
                ) {
                    seenDeclarations.set(getExportBindingName(nextStatement.expression), "let");
                    elide(statement);
                    replace(nextStatement, factory.updateClassDeclaration(
                        statement,
                        /*decorators*/ undefined,
                        factory.createModifiersFromModifierFlags(ts.getCombinedModifierFlags(statement) | ts.ModifierFlags.Export),
                        statement.name,
                        undefined,
                        statement.heritageClauses,
                        statement.members));
                    continue;
                }

                if (isSimpleUninitalizedVar(statement) &&
                    ts.isExpressionStatement(nextStatement) &&
                    isExportNamespaceIIFE(nextStatement.expression) &&
                    getExportBindingName(nextStatement.expression) === getDeclarationName(statement)
                ) {
                    seenDeclarations.set(getExportBindingName(nextStatement.expression), "var");
                    replace(statement, factory.updateVariableStatement(
                        statement,
                        factory.createModifiersFromModifierFlags(ts.ModifierFlags.Export),
                        statement.declarationList
                    ));
                    ts.setEmitFlags(statement.declarationList, ts.EmitFlags.NoLeadingComments);

                    replace(nextStatement, factory.updateExpressionStatement(
                        nextStatement,
                        factory.updateCallExpression(
                            nextStatement.expression,
                            nextStatement.expression.expression,
                            undefined, [
                                factory.createLogicalOr(
                                    nextStatement.expression.arguments[0].left,
                                    factory.createAssignment(
                                        nextStatement.expression.arguments[0].left,
                                        factory.createObjectLiteralExpression()
                                    )
                                )
                            ]
                        )
                    ));
                    continue;
                }

                // const x = ...;
                // exports.x = x;
                if (ts.isVariableStatement(statement) &&
                    statement.declarationList.flags & ts.NodeFlags.Const &&
                    statement.declarationList.declarations.length === 1 &&
                    ts.isIdentifier(statement.declarationList.declarations[0].name) &&
                    ts.isExpressionStatement(nextStatement) &&
                    isExportAssignment(nextStatement.expression) &&
                    getExportBindingName(nextStatement.expression) === ts.idText(statement.declarationList.declarations[0].name)) {
                    seenDeclarations.set(getExportBindingName(nextStatement.expression), "const");
                    replace(statement, factory.updateVariableStatement(
                        statement,
                        factory.createModifiersFromModifierFlags(ts.ModifierFlags.Export),
                        statement.declarationList
                    ));
                    ts.setEmitFlags(statement.declarationList, ts.EmitFlags.NoLeadingComments);
                    elide(nextStatement);
                    continue;
                }
            }

            if (ts.isExpressionStatement(statement) && isExportAssignment(statement)) {
                throw new Error("Not yet implemented");
            }

            accept(statement);
        }

        return hasChanges ? factory.updateSourceFile(sourceFile, statements) : sourceFile;

        /**
         * @param {ts.Statement} oldStatement
         */
        function elide(oldStatement) {
            replace(oldStatement, factory.createNotEmittedStatement(oldStatement));
        }

        /**
         * @param {ts.Statement} oldStatement
         * @param {ts.Statement} newStatement
         */
        function replace(oldStatement, newStatement) {
            hasChanges = true;
            ts.setOriginalNode(newStatement, oldStatement);
            copyComments(oldStatement, newStatement);
            ts.setCommentRange(newStatement, { pos: -1, end: -1 });
            accept(newStatement);
        }

        /**
         * @param {ts.Statement} statement
         */
         function accept(statement) {
            statements.push(statement);
            i++;
        }
    }

    /**
     * @param {ts.SourceFile} sourceFile
     */
    function treeShakeUnusedHelpers(sourceFile) {
        while (true) {
            for (const key of tslibBindingNames.keys()) {
                tslibBindingNames.set(key, false);
            }

            for (const key of potentialHelperReferences.keys()) {
                potentialHelperReferences.set(key, false);
            }

            ts.forEachChild(sourceFile, function collectHelperReferences(node) {
                if (ts.isCallExpression(node)) {
                    if (ts.isPropertyAccessExpression(node.expression) &&
                        ts.isIdentifier(node.expression.expression)) {
                        const name = ts.idText(node.expression.expression);
                        if (tslibBindingNames.has(name)) {
                            tslibBindingNames.set(name, true);
                        }
                    }
                    if (ts.isIdentifier(node.expression)) {
                        const name = ts.idText(node.expression);
                        if (potentialHelperReferences.has(name)) {
                            potentialHelperReferences.set(name, true);
                        }
                    }
                }
    
                ts.forEachChild(node, collectHelperReferences);
            });

            const visited = ts.visitEachChild(sourceFile, node => {
                if (ts.isImportDeclaration(node) &&
                    ts.isStringLiteral(node.moduleSpecifier) &&
                    node.moduleSpecifier.text === "tslib" &&
                    node.importClause &&
                    !node.importClause.name &&
                    node.importClause.namedBindings &&
                    ts.isNamespaceImport(node.importClause.namedBindings)) {
                    const used = tslibBindingNames.get(ts.idText(node.importClause.namedBindings.name));
                    if (used === false) {
                        const replacement = factory.createNotEmittedStatement(node);
                        copyComments(node, replacement);
                        return replacement;
                    }
                }
                else if (isPotentialHelper(node)) {
                    const used = potentialHelperReferences.get(ts.idText(node.declarationList.declarations[0].name));
                    if (used === false) {
                        const replacement = factory.createNotEmittedStatement(node);
                        copyComments(node, replacement);
                        return replacement;
                    }
                }
                return node;
            }, context);

            if (visited === sourceFile) {
                return sourceFile;
            }

            sourceFile = visited;
        }
    }

    /**
     * @param {string} moduleSpecifier 
     */
    function rewriteModuleSpecifier(moduleSpecifier) {
        if (/^\./.test(moduleSpecifier)) {
            if (/^\.\.[\\/]?$/.test(moduleSpecifier)) return "../index.mjs";
            if (/^\.[\\/]?$/.test(moduleSpecifier)) return "./index.mjs";
            if (path.extname(moduleSpecifier) === ".js") return moduleSpecifier.slice(0, -3) + ".mjs";
            const resolved = path.resolve(path.dirname(currentSourceFile.fileName), moduleSpecifier);
            if (isFile(resolved)) return moduleSpecifier;
            if (isFile(resolved + ".js")) return moduleSpecifier + ".mjs";
            if (isFile(path.join(resolved, "index.js"))) return path.posix.join(moduleSpecifier, "index.mjs");
        }
        return moduleSpecifier;

        // if (/^\.\.?[\\/].*\.js$/.test(moduleSpecifier)) return moduleSpecifier.slice(0, -3) + ".mjs";
        // if (/^\.\.?[\\/].*\.[cm]js$/.test(moduleSpecifier)) return moduleSpecifier;
        // if (/^\.\.?[\\/].*\.[cm]js$/.test(moduleSpecifier)) return moduleSpecifier;
        // return /^\.\.?[\\/].*\.js$/.test(moduleSpecifier) ? moduleSpecifier.slice(0, -3) + ".mjs" :
        //     /^\.\.?[\\/].*[\\/]$/.test(moduleSpecifier) ? moduleSpecifier + "index.mjs" :
        //     /^\.\.?[\\/]/.test(moduleSpecifier) ? moduleSpecifier + "/index.mjs" :
        //     moduleSpecifier === ".." ? "../index.mjs" :
        //     moduleSpecifier === "." ? "./index.mjs" :
        //     moduleSpecifier;
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
     * @param {types.ExportAssignmentExpression} node
     */
    function visitExportAssignment(node) {
        if (exportsDeclarationDepth) {
            safeExportBindings.add(node.left);
            return ts.visitEachChild(node, visitor, context);
        }

        console.warn(`Warning: Visiting export assignment '${getExportBindingName(node)}' in '${currentSourceFile && formatLocation(process.cwd(), currentSourceFile, node)}'. Verify this is correct.`);
        return factory.updateBinaryExpression(
            node,
            ts.visitNode(node.left, visitor),
            node.operatorToken,
            ts.visitNode(node.right, visitor));
    }

    /**
     * @param {types.ExportBindingExpression} node
     */
    function visitExportBinding(node) {
        if (exportsDeclarationDepth) {
            safeExportBindings.add(node);
            return ts.visitEachChild(node, visitor, context);
        }

        return node.name;
    }

    /**
     * @param {ts.Node} node
     */
    function varDeclaredNames(node) {
        /** @type {Set<string>} */
        const names = new Set();
        if (ts.isFunctionDeclaration(node) ||
            ts.isFunctionExpression(node)) {
            if (node.name) names.add(ts.idText(node.name));
            node.parameters.forEach(collectVarDeclaredNames);
            if (node.body) collectVarDeclaredNames(node.body);
        }
        else if (ts.isArrowFunction(node) ||
            ts.isConstructorDeclaration(node) ||
            ts.isMethodDeclaration(node) ||
            ts.isAccessor(node)) {
            node.parameters.forEach(collectVarDeclaredNames);
            if (node.body) collectVarDeclaredNames(node.body);
        }
        else {
            collectVarDeclaredNames(node);
        }
        return names;

        /**
         * @param {ts.Node} node
         */
        function collectVarDeclaredNames(node) {
            if (ts.isBlock(node)) {
                ts.forEachChild(node, collectVarDeclaredNames);
            }
            else if (ts.isIfStatement(node)) {
                ts.forEachChild(node.thenStatement, collectVarDeclaredNames);
                if (node.elseStatement) ts.forEachChild(node.elseStatement, collectVarDeclaredNames);
            }
            else if (ts.isSwitchStatement(node)) {
                ts.forEachChild(node, collectVarDeclaredNames);
            }
            else if (ts.isCaseClause(node) || ts.isDefaultClause(node)) {
                node.statements.forEach(collectVarDeclaredNames);
            }
            else if (ts.isTryStatement(node)) {
                ts.forEachChild(node.tryBlock, collectVarDeclaredNames);
                if (node.catchClause) ts.forEachChild(node.catchClause.block, collectVarDeclaredNames);
                if (node.finallyBlock) ts.forEachChild(node.finallyBlock, collectVarDeclaredNames);
            }
            else if (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) {
                if (node.initializer && ts.isVariableDeclarationList(node.initializer)) ts.forEachChild(node.initializer, collectVarDeclaredNames);
                ts.forEachChild(node.statement, collectVarDeclaredNames);
            }
            else if (ts.isDoStatement(node) || ts.isWhileStatement(node) || ts.isWithStatement(node) || ts.isLabeledStatement(node)) {
                ts.forEachChild(node.statement, collectVarDeclaredNames);
            }
            else if (ts.isFunctionDeclaration(node)) {
                if (node.name) {
                    names.add(ts.idText(node.name));
                }
            }
            else if (ts.isVariableStatement(node)) {
                if ((node.declarationList.flags & ts.NodeFlags.BlockScoped) === 0) {
                    node.declarationList.declarations.forEach(collectVarDeclaredNames);
                }
            }
            else if (ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isBindingElement(node)) {
                if (ts.isIdentifier(node.name)) {
                    names.add(ts.idText(node.name));
                }
                else {
                    ts.forEachChild(node.name, collectVarDeclaredNames);
                }
            }
            else if (ts.isParameter(node)) {
                if (ts.isIdentifier(node.name)) {
                    names.add(ts.idText(node.name));
                }
                else {
                    ts.forEachChild(node.name, collectVarDeclaredNames);
                }
            }
        }
    }

    /**
     * @param {ts.Node} node
     */
    function lexicallyDeclaredNames(node) {
        /** @type {Set<string>} */
        const names = new Set();
        if (ts.isBlock(node)) {
            node.statements.forEach(collectLexicallyDeclaredNames);
        }
        else if (ts.isCatchClause(node)) {
            if (node.variableDeclaration) collectLexicallyDeclaredNames(node.variableDeclaration);
        }
        else if (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) {
            if (node.initializer && ts.isVariableDeclarationList(node.initializer)) {
                collectLexicallyDeclaredNames(node.initializer);
            }
        }
        else if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
            if (node.name) {
                names.add(ts.idText(node.name));
            }
        }
        return names;

        /**
         * @param {ts.Node} node
         */
        function collectLexicallyDeclaredNames(node) {
            if (ts.isCaseClause(node) || ts.isDefaultClause(node)) {
                node.statements.forEach(collectLexicallyDeclaredNames);
            }
            else if (ts.isClassDeclaration(node)) {
                if (node.name) {
                    names.add(ts.idText(node.name));
                }
            }
            else if (ts.isVariableStatement(node)) {
                if ((node.declarationList.flags & ts.NodeFlags.BlockScoped) === 0) {
                    node.declarationList.declarations.forEach(collectLexicallyDeclaredNames);
                }
            }
            else if (ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isBindingElement(node)) {
                if (ts.isIdentifier(node.name)) {
                    names.add(ts.idText(node.name));
                }
                else {
                    ts.forEachChild(node.name, collectLexicallyDeclaredNames);
                }
            }
            else if (ts.isParameter(node)) {
                if (ts.isIdentifier(node.name)) {
                    names.add(ts.idText(node.name));
                }
                else {
                    ts.forEachChild(node.name, collectLexicallyDeclaredNames);
                }
            }
        }
    }

    /**
     * @param {ts.ClassDeclaration} node
     */
    function visitClassDeclaration(node) {
        if (lexicallyDeclaredNames(node).has("exports")) {
            exportsDeclarationDepth++;
            node = ts.visitEachChild(node, visitor, context);
            exportsDeclarationDepth--;
            return node;
        }
        return ts.visitEachChild(node, visitor, context);
    }

    /**
     * @param {ts.ClassExpression} node
     */
    function visitClassExpression(node) {
        if (lexicallyDeclaredNames(node).has("exports")) {
            exportsDeclarationDepth++;
            node = ts.visitEachChild(node, visitor, context);
            exportsDeclarationDepth--;
            return node;
        }
        return ts.visitEachChild(node, visitor, context);
    }

    /**
     * @param {ts.FunctionDeclaration} node
     */
    function visitFunctionDeclaration(node) {
        if (varDeclaredNames(node).has("exports") ||
            lexicallyDeclaredNames(node).has("exports")) {
            exportsDeclarationDepth++;
            node = ts.visitEachChild(node, visitor, context);
            exportsDeclarationDepth--;
            return node;
        }
        return ts.visitEachChild(node, visitor, context);
    }

    /**
     * @param {ts.FunctionExpression} node
     */
    function visitFunctionExpression(node) {
        if (varDeclaredNames(node).has("exports") ||
            lexicallyDeclaredNames(node).has("exports")) {
            exportsDeclarationDepth++;
            node = ts.visitEachChild(node, visitor, context);
            exportsDeclarationDepth--;
            return node;
        }
        return ts.visitEachChild(node, visitor, context);
    }

    /**
     * @param {ts.ArrowFunction} node
     */
    function visitArrowFunction(node) {
        if (varDeclaredNames(node).has("exports") ||
            lexicallyDeclaredNames(node).has("exports")) {
            exportsDeclarationDepth++;
            node = ts.visitEachChild(node, visitor, context);
            exportsDeclarationDepth--;
            return node;
        }
        return ts.visitEachChild(node, visitor, context);
    }

    /**
     * @param {ts.MethodDeclaration} node
     */
    function visitMethodDeclaration(node) {
        if (varDeclaredNames(node).has("exports") ||
            lexicallyDeclaredNames(node).has("exports")) {
            exportsDeclarationDepth++;
            node = ts.visitEachChild(node, visitor, context);
            exportsDeclarationDepth--;
            return node;
        }
        return ts.visitEachChild(node, visitor, context);
    }

    /**
     * @param {ts.ConstructorDeclaration} node
     */
    function visitConstructorDeclaration(node) {
        if (varDeclaredNames(node).has("exports") ||
            lexicallyDeclaredNames(node).has("exports")) {
            exportsDeclarationDepth++;
            node = ts.visitEachChild(node, visitor, context);
            exportsDeclarationDepth--;
            return node;
        }
        return ts.visitEachChild(node, visitor, context);
    }

    /**
     * @param {ts.GetAccessorDeclaration} node
     */
    function visitGetAccessorDeclaration(node) {
        if (varDeclaredNames(node).has("exports") ||
            lexicallyDeclaredNames(node).has("exports")) {
            exportsDeclarationDepth++;
            node = ts.visitEachChild(node, visitor, context);
            exportsDeclarationDepth--;
            return node;
        }
        return ts.visitEachChild(node, visitor, context);
    }

    /**
     * @param {ts.SetAccessorDeclaration} node
     */
    function visitSetAccessorDeclaration(node) {
        if (varDeclaredNames(node).has("exports") ||
            lexicallyDeclaredNames(node).has("exports")) {
            exportsDeclarationDepth++;
            node = ts.visitEachChild(node, visitor, context);
            exportsDeclarationDepth--;
            return node;
        }
        return ts.visitEachChild(node, visitor, context);
    }

    /**
     * @param {ts.ForStatement} node
     */
    function visitForStatement(node) {
        if (lexicallyDeclaredNames(node).has("exports")) {
            exportsDeclarationDepth++;
            node = ts.visitEachChild(node, visitor, context);
            exportsDeclarationDepth--;
            return node;
        }
        return ts.visitEachChild(node, visitor, context);
    }

    /**
     * @param {ts.ForInStatement} node
     */
    function visitForInStatement(node) {
        if (lexicallyDeclaredNames(node).has("exports")) {
            exportsDeclarationDepth++;
            node = ts.visitEachChild(node, visitor, context);
            exportsDeclarationDepth--;
            return node;
        }
        return ts.visitEachChild(node, visitor, context);
    }

    /**
     * @param {ts.ForOfStatement} node
     */
    function visitForOfStatement(node) {
        if (lexicallyDeclaredNames(node).has("exports")) {
            exportsDeclarationDepth++;
            node = ts.visitEachChild(node, visitor, context);
            exportsDeclarationDepth--;
            return node;
        }
        return ts.visitEachChild(node, visitor, context);
    }

    /**
     * @param {ts.Block} node
     */
    function visitBlock(node) {
        if (lexicallyDeclaredNames(node).has("exports")) {
            exportsDeclarationDepth++;
            node = ts.visitEachChild(node, visitor, context);
            exportsDeclarationDepth--;
            return node;
        }
        return ts.visitEachChild(node, visitor, context);
    }

    /**
     * @param {ts.Expression} node
     */
    function isESModuleMarker(node) {
        return ts.isCallExpression(node)
            && ts.isPropertyAccessExpression(node.expression)
            && ts.isIdentifier(node.expression.expression)
            && ts.idText(node.expression.expression) === "Object"
            && ts.idText(node.expression.name) === "defineProperty"
            && node.arguments.length === 3
            && ts.isIdentifier(node.arguments[0])
            && ts.idText(node.arguments[0]) === "exports"
            && ts.isStringLiteral(node.arguments[1])
            && node.arguments[1].text === "__esModule"
            && ts.isObjectLiteralExpression(node.arguments[2])
            && node.arguments[2].properties.length === 1
            && ts.isPropertyAssignment(node.arguments[2].properties[0])
            && ts.isIdentifier(node.arguments[2].properties[0].name)
            && ts.idText(node.arguments[2].properties[0].name) === "value"
            && node.arguments[2].properties[0].initializer.kind === ts.SyntaxKind.TrueKeyword;
    }

    /**
     * @param {ts.Expression} node
     * @returns {boolean}
     */
    function isVoidZero(node) {
        return ts.isVoidExpression(node) && ts.isNumericLiteral(node.expression) && node.expression.text === "0";
    }

    /**
     * @param {ts.Expression} node
     * @returns {boolean}
     */
    function isHoistedExport(node) {
        return isExportAssignment(node)
            && (isVoidZero(node.right) || isHoistedExport(node.right));
    }

    /**
     * @param {ts.Expression} node
     */
    function countHoistedExports(node) {
        return isExportAssignment(node) ? 1 + countHoistedExports(node.right) : 0;
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
     * @returns {node is types.Assign}
     */
    function isAssign(node) {
        return ts.isBinaryExpression(node)
            && node.operatorToken.kind === ts.SyntaxKind.EqualsToken;
    }

    /**
     * @param {ts.Node} node
     * @returns {node is types.LogicalOr}
     */
    function isLogicalOr(node) {
        return ts.isBinaryExpression(node)
            && node.operatorToken.kind === ts.SyntaxKind.BarBarToken;
    }

    /**
     * @param {ts.Node} node
     * @returns {node is types.ExportsId}
     */
    function isExportsId(node) {
        return isId(node, "exports");
    }

    /**
     * @param {ts.Node} node
     * @returns {node is types.ExportBindingExpression}
     */
    function isExportBinding(node) {
        return ts.isPropertyAccessExpression(node)
            && ts.isIdentifier(node.name)
            && isExportsId(node.expression);
    }

    /**
     * @param {ts.Node} node
     * @returns {node is types.ExportAssignmentExpression}
     */
    function isExportAssignment(node) {
        return isAssign(node)
            && isExportBinding(node.left);
    }

    /**
     * @param {ts.Expression} node
     * @returns {node is types.Reexport}
     */
    function isReexport(node) {
        let prop;
        let args;
        let obj;
        let props;
        let enumerableProp;
        let getProp;
        let func;
        let ret;
        let retProp;
        return ts.isCallExpression(node)
                && ts.isPropertyAccessExpression(prop = node.expression)
                    && isId(prop.expression, "Object")
                    && isId(prop.name, "defineProperty")
                && (args = node.arguments).length === 3
                && isExportsId(args[0])
                && ts.isStringLiteral(args[1])
                && ts.isObjectLiteralExpression(obj = args[2])
                    && (props = obj.properties).length === 2
                    && ts.isPropertyAssignment(enumerableProp = props[0])
                        && isId(enumerableProp.name, "enumerable")
                        && enumerableProp.initializer.kind === ts.SyntaxKind.TrueKeyword
                    && ts.isPropertyAssignment(getProp = props[1])
                        && isId(getProp.name, "get")
                        && ts.isFunctionExpression(func = getProp.initializer)
                            && func.parameters.length === 0
                            && func.body?.statements.length === 1
                            && ts.isReturnStatement(ret = func.body.statements[0])
                                && !!ret.expression
                                && ts.isPropertyAccessExpression(retProp = ret.expression)
                                    && ts.isIdentifier(retProp.expression)
                                    && ts.isIdentifier(retProp.name);
    }

    /**
     * @param {types.ExportBindingExpression | types.ExportAssignmentExpression | types.ExportNamespaceIIFE | types.ExportNamespaceBindingExpression} node
     * @return {string}
     */
    function getExportBindingName(node) {
        return isExportAssignment(node) ? getExportBindingName(node.left) :
            isExportNamespaceIIFE(node) ? getExportBindingName(node.arguments[0]) :
            isExportNamespaceBindingExpression(node) ? getExportBindingName(node.right.left) :
            ts.idText(node.name);
    }

    /**
     * @param {types.ExportStar} node
     */
    function getExportModuleSpecifier(node) {
        return node.arguments[0].arguments[0].text;
    }

    /**
     * @param {ts.Node} node
     * @returns {node is types.SimpleVar<ts.Identifier, ts.Expression>}
     */
    function isPotentialHelper(node) {
        return ts.isVariableStatement(node)
            && (node.declarationList.flags & ts.NodeFlags.BlockScoped) === 0
            && node.declarationList.declarations.length === 1
            && ts.isIdentifier(node.declarationList.declarations[0].name)
            && ts.idText(node.declarationList.declarations[0].name).startsWith("__")
            && !!node.declarationList.declarations[0].initializer;
    }

    /**
     * @param {ts.Node} node
     * @returns {node is types.SimpleUninitalizedVar}
     */
    function isSimpleUninitalizedVar(node) {
        return ts.isVariableStatement(node)
            && (node.declarationList.flags & ts.NodeFlags.BlockScoped) === 0
            && node.declarationList.declarations.length === 1
            && ts.isIdentifier(node.declarationList.declarations[0].name)
            && !node.declarationList.declarations[0].initializer;
    }

    /**
     * @param {ts.Node} node
     * @returns {node is types.VarStmt<types.VarDecl<ts.Identifier, undefined>[]>}
     */
    function isTempVars(node) {
        return ts.isVariableStatement(node)
            && (node.declarationList.flags & ts.NodeFlags.BlockScoped) === 0
            && node.declarationList.declarations.every(decl => ts.isIdentifier(decl.name) && !decl.initializer);
    }

    /**
     * @param {ts.FunctionDeclaration | ts.ClassDeclaration | types.SimpleUninitalizedVar} node
     */
    function getDeclarationName(node) {
        return ts.isFunctionDeclaration(node) ? node.name && ts.idText(node.name) :
            ts.isClassDeclaration(node) ? node.name && ts.idText(node.name) :
            ts.idText(node.declarationList.declarations[0].name);
    }

    /**
     * @param {ts.Node} node
     * @return {node is types.ExportNamespaceBindingExpression}
     */
    function isExportNamespaceBindingExpression(node) {
        // N = exports.N || (exports.N = {})
        return isAssign(node)
            && ts.isIdentifier(node.left)
            && isLogicalOr(node.right)
            && isExportBinding(node.right.left)
            && getExportBindingName(node.right.left) === ts.idText(node.left)
            && ts.isParenthesizedExpression(node.right.right)
            && isExportAssignment(node.right.right.expression)
            && getExportBindingName(node.right.right.expression) === ts.idText(node.left)
            && ts.isObjectLiteralExpression(node.right.right.expression.right)
            && node.right.right.expression.right.properties.length === 0;
    }

    /**
     * @param {ts.Node} node
     * @return {node is types.ExportNamespaceIIFE}
     */
    function isExportNamespaceIIFE(node) {
        return ts.isCallExpression(node)
            && ts.isParenthesizedExpression(node.expression)
            && ts.isFunctionExpression(node.expression.expression)
            && node.arguments.length === 1
            && isExportNamespaceBindingExpression(node.arguments[0]);
    }

    /**
     * @param {ts.Expression} node
     * @returns {node is types.ExportStar}
     */
    function isExportStar(node) {
        return isHelperCall(node, "__exportStar")
            && node.arguments.length === 2
            && isRequireCall(node.arguments[0])
            && isExportsId(node.arguments[1]);
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
     * @template {string} H
     * @param {ts.Node} node
     * @param {H} helperName
     * @returns {node is types.HelperCall<H>}
     */
    function isHelperCall(node, helperName) {
        return ts.isCallExpression(node) && (
            ts.isIdentifier(node.expression) &&
                ts.idText(node.expression) === helperName ||
            tslibBindingNames.size > 0 &&
                ts.isPropertyAccessExpression(node.expression) &&
                ts.isIdentifier(node.expression.expression) &&
                tslibBindingNames.has(ts.idText(node.expression.expression)) &&
                isId(node.expression.name, helperName)
        );
    }

    /**
     * @param {ts.Node} node
     * @returns {node is types.ImportAssignment}
     */
    function isImportAssignment(node) {
        return ts.isVariableStatement(node)
            && ((node.declarationList.flags & ts.NodeFlags.BlockScoped) === ts.NodeFlags.Const ||
                (node.declarationList.flags & ts.NodeFlags.BlockScoped) === 0)
            && node.declarationList.declarations.length === 1
            && ts.isIdentifier(node.declarationList.declarations[0].name)
            && !!node.declarationList.declarations[0].initializer
            && isRequireCall(node.declarationList.declarations[0].initializer);
    }

    /**
     * @param {ts.Node} node
     * @returns {node is types.ImportInteropAssignment}
     */
    function isImportInteropAssignment(node) {
        return ts.isVariableStatement(node)
            && ((node.declarationList.flags & ts.NodeFlags.BlockScoped) === ts.NodeFlags.Const ||
                (node.declarationList.flags & ts.NodeFlags.BlockScoped) === 0)
            && node.declarationList.declarations.length === 1
            && ts.isIdentifier(node.declarationList.declarations[0].name)
            && !!node.declarationList.declarations[0].initializer
            && isHelperCall(node.declarationList.declarations[0].initializer, "__importDefault")
            && node.declarationList.declarations[0].initializer.arguments.length >= 1
            && isRequireCall(node.declarationList.declarations[0].initializer.arguments[0]);
    }

    /**
     * @param {ts.Node} node
     * @returns {node is types.ImportStar}
     */
    function isImportStar(node) {
        return ts.isVariableStatement(node)
            && ((node.declarationList.flags & ts.NodeFlags.BlockScoped) === ts.NodeFlags.Const ||
                (node.declarationList.flags & ts.NodeFlags.BlockScoped) === 0)
            && node.declarationList.declarations.length === 1
            && ts.isIdentifier(node.declarationList.declarations[0].name)
            && !!node.declarationList.declarations[0].initializer
            && isHelperCall(node.declarationList.declarations[0].initializer, "__importStar")
            && node.declarationList.declarations[0].initializer.arguments.length >= 1
            && isRequireCall(node.declarationList.declarations[0].initializer.arguments[0]);
    }

    /**
     * @param {types.ImportAssignment | types.ImportStar | types.ImportInteropAssignment} node
     */
    function getImportBindingName(node) {
        return node.declarationList.declarations[0].name;
    }

    /**
     * @param {types.ImportAssignment | types.ImportInteropAssignment | types.ImportStar} node
     */
    function getImportModuleSpecifier(node) {
        return isImportAssignment(node) ?
            node.declarationList.declarations[0].initializer.arguments[0] :
            node.declarationList.declarations[0].initializer.arguments[0].arguments[0];
    }

    /**
     * @param {ts.Node} from
     * @param {ts.Node} to
     */
    function copyLeadingComments(from, to) {
        ts.forEachLeadingCommentRange(currentSourceFile.text, from.pos, onLeadingCommentRange);

        /**
         * @param {number} pos
         * @param {number} end
         * @param {ts.CommentKind} kind
         * @param {boolean} hasTrailingNewLine
         */
        function onLeadingCommentRange(pos, end, kind, hasTrailingNewLine) {
            const comment = currentSourceFile.text.slice(pos + 2, kind === ts.SyntaxKind.MultiLineCommentTrivia ? end - 2 : end);
            ts.addSyntheticLeadingComment(to, kind, comment, hasTrailingNewLine);
        }
    }

    /**
     * @param {ts.Node} from
     * @param {ts.Node} to
     */
    function copyTrailingComments(from, to) {
        ts.forEachTrailingCommentRange(currentSourceFile.text, from.end, onTrailingCommentRange);

        /**
         * @param {number} pos
         * @param {number} end
         * @param {ts.CommentKind} kind
         * @param {boolean} hasTrailingNewLine
         */
        function onTrailingCommentRange(pos, end, kind, hasTrailingNewLine) {
            const comment = currentSourceFile.text.slice(pos + 2, kind === ts.SyntaxKind.MultiLineCommentTrivia ? end - 2 : end);
            ts.addSyntheticTrailingComment(to, kind, comment, hasTrailingNewLine);
        }
    }

    /**
     * @param {ts.Node} from
     * @param {ts.Node} to
     */
    function copyComments(from, to) {
        copyLeadingComments(from, to);
        copyTrailingComments(from, to);
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
