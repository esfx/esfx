// @ts-check
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const { formatLocation } = require("./verifier/utils");

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
            const result = ts.transform(inputSourceFile, [transformCjsToEsm], {
                allowJs: true,
                target: ts.ScriptTarget.ESNext,
                module: ts.ModuleKind.CommonJS,
            });
            const [outputSourceFile] = result.transformed;
            const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
            const output = printer.printFile(outputSourceFile);
            try { fs.mkdirSync(outputDir, { recursive: true }); } catch { }
            fs.writeFileSync(outputFile, output, "utf8");
        }
    }
}
exports.convertCjsToEsm = convertCjsToEsm;

/**
 * @param {ts.TransformationContext} context
 * @returns {ts.Transformer<ts.SourceFile>}
 */
function transformCjsToEsm(context) {
    const { factory } = context;

    /** @type {Map<string, boolean>} */
    const tslibBindingNames = new Map();
    let exportsDeclarationDepth = 0;
    /** @type {ts.SourceFile} */
    let currentSourceFile;

    return node => ts.visitNode(node, visitor, ts.isSourceFile);

    /**
     * @param {ts.Node} node
     * @returns {ts.VisitResult<ts.Node>}
     */
    function visitor(node) {
        return ts.isSourceFile(node) ? visitSourceFile(node) :
            ts.isImportDeclaration(node) ? visitImportDeclaration(node) :
            ts.isExportDeclaration(node) ? visitExportDeclaration(node) :
            ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword ? visitImportCall(/** @type {ts.ImportCall} */(node)) :
            ts.isCallExpression(node) ? visitCallExpression(node) :
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
     * @param {ts.SourceFile} sourceFile
     */
    function visitSourceFile(sourceFile) {
        if (sourceFile.isDeclarationFile) return sourceFile;
        tslibBindingNames.clear();
        currentSourceFile = sourceFile;
        sourceFile = visitSourceFileTopLevelPass1(sourceFile);
        sourceFile = ts.visitEachChild(sourceFile, visitor, context);
        sourceFile = visitSourceFileTopLevelPass2(sourceFile);
        return sourceFile;
    }

    /**
     * @param {ts.SourceFile} sourceFile
     */
    function visitSourceFileTopLevelPass1(sourceFile) {
        if (sourceFile.isDeclarationFile) return sourceFile;

        let hasChanges = false;
        let hasSeenESModuleMarker = false;
        let hasSeenHoistedExports = false;
        const seenDeclarations = new Set();

        /** @type {ts.Statement[]} */
        const statements = [];
        for (let i = 0; i < sourceFile.statements.length; i++) {
            const statement = sourceFile.statements[i];
            if (!hasSeenESModuleMarker && isESModuleMarker(statement)) {
                hasChanges = true;
                hasSeenESModuleMarker = true;
                const replacement = factory.createNotEmittedStatement(statement);
                copyComments(statement, replacement, sourceFile);
                ts.setCommentRange(statement, { pos: -1, end: -1 });
                statements.push(replacement);
                continue;
            }

            if (!hasSeenHoistedExports && ts.isExpressionStatement(statement) && isHoistedExport(statement.expression)) {
                hasChanges = true;
                hasSeenHoistedExports = countHoistedExports(statement.expression) < 50;
                statements.push(factory.createNotEmittedStatement(statement));
                continue;
            }

            if (ts.isExpressionStatement(statement) &&
                isExportAssignment(statement.expression)) {
                hasChanges = true;
                const name = getExportBindingName(statement.expression);
                if (!seenDeclarations.has(name)) {
                    seenDeclarations.add(name);
                    const replacement = factory.createVariableStatement(
                        factory.createModifiersFromModifierFlags(ts.ModifierFlags.Export),
                        factory.createVariableDeclarationList([
                            factory.createVariableDeclaration(
                                statement.expression.left.name,
                                undefined,
                                undefined,
                                statement.expression.right
                            )
                        ], ts.NodeFlags.Let)
                    );
                    copyComments(statement, replacement, sourceFile);
                    statements.push(replacement);
                }
                else {
                    const replacement = factory.updateExpressionStatement(
                        statement,
                        factory.updateBinaryExpression(
                            statement.expression,
                            statement.expression.left.name,
                            statement.expression.operatorToken,
                            statement.expression.right
                        )
                    );
                    statements.push(replacement);
                }
                continue;
            }

            if (isImportAssignment(statement) || isImportInteropAssignment(statement)) {
                hasChanges = true;
                const replacement = factory.createImportDeclaration(
                    undefined,
                    undefined,
                    factory.createImportClause(
                        false,
                        undefined,
                        factory.createNamespaceImport(getImportBindingName(statement))
                    ),
                    getImportModuleSpecifier(statement),
                    undefined,
                );
                copyComments(statement, replacement, sourceFile);
                statements.push(replacement);

                if (getImportModuleSpecifier(statement).text === "tslib") {
                    tslibBindingNames.set(ts.idText(getImportBindingName(statement)), false);
                }

                continue;
            }

            const nextStatement = i < sourceFile.statements.length - 1 ? sourceFile.statements[i + 1] : undefined;
            if (nextStatement) {
                if (ts.isFunctionDeclaration(statement) &&
                    ts.isExpressionStatement(nextStatement) &&
                    isExportAssignment(nextStatement.expression) &&
                    getExportBindingName(nextStatement.expression) === getDeclarationName(statement)) {
                    hasChanges = true;
                    seenDeclarations.add(getExportBindingName(nextStatement.expression));
                    statements.push(factory.updateFunctionDeclaration(
                        statement,
                        /*decorators*/ undefined,
                        factory.createModifiersFromModifierFlags(ts.getCombinedModifierFlags(statement) | ts.ModifierFlags.Export),
                        statement.asteriskToken,
                        statement.name,
                        undefined,
                        statement.parameters,
                        undefined,
                        statement.body));
                    i++;
                    continue;
                }

                if (ts.isClassDeclaration(statement) &&
                    ts.isExpressionStatement(nextStatement) &&
                    isExportAssignment(nextStatement.expression) &&
                    getExportBindingName(nextStatement.expression) === getDeclarationName(statement)) {
                    hasChanges = true;
                    seenDeclarations.add(getExportBindingName(nextStatement.expression));
                    statements.push(factory.updateClassDeclaration(
                        statement,
                        /*decorators*/ undefined,
                        factory.createModifiersFromModifierFlags(ts.getCombinedModifierFlags(statement) | ts.ModifierFlags.Export),
                        statement.name,
                        undefined,
                        statement.heritageClauses,
                        statement.members));
                    i++;
                    continue;
                }

                if (isSimpleUninitalizedVar(statement) &&
                    ts.isExpressionStatement(nextStatement) &&
                    isExportNamespaceIIFE(nextStatement.expression) &&
                    getExportBindingName(nextStatement.expression) === getDeclarationName(statement)) {
                    hasChanges = true;
                    seenDeclarations.add(getExportBindingName(nextStatement.expression));
                    statements.push(factory.updateVariableStatement(
                        statement,
                        factory.createModifiersFromModifierFlags(ts.ModifierFlags.Export),
                        statement.declarationList
                    ));
                    statements.push(factory.updateExpressionStatement(
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
                    i++;
                    continue;
                }
            }

            if (ts.isExpressionStatement(statement) &&
                isExportNamespaceIIFE(statement.expression) &&
                seenDeclarations.has(getExportBindingName(statement.expression))) {
                hasChanges = true;
                statements.push(factory.updateExpressionStatement(
                    statement,
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
                        ]
                    )
                ));
                continue;
            }

            if (ts.isExpressionStatement(statement) && isExportAssignment(statement)) {
                throw new Error("Not yet implemented");
            }

            statements.push(statement);
        }

        return hasChanges ? factory.updateSourceFile(sourceFile, statements) : sourceFile;
    }

    /**
     * @param {ts.SourceFile} sourceFile
     */
    function visitSourceFileTopLevelPass2(sourceFile) {
        return ts.visitEachChild(sourceFile, node => {
            if (ts.isImportDeclaration(node) &&
                ts.isStringLiteral(node.moduleSpecifier) &&
                node.moduleSpecifier.text === "tslib" &&
                node.importClause &&
                !node.importClause.name &&
                node.importClause.namedBindings &&
                ts.isNamespaceImport(node.importClause.namedBindings)) {
                const used = tslibBindingNames.get(ts.idText(node.importClause.namedBindings.name));
                if (used === false) {
                    return undefined;
                }
            }
            return node;
        }, context);
    }

    /**
     * @param {ts.ImportDeclaration} node
     */
    function visitImportDeclaration(node) {
        if (ts.isStringLiteral(node.moduleSpecifier) &&
            /^\.\.?[\\/].*\.js$/.test(node.moduleSpecifier.text)) {
            return factory.updateImportDeclaration(
                node,
                node.decorators,
                node.modifiers,
                node.importClause,
                factory.createStringLiteral(
                    node.moduleSpecifier.text.slice(0, -3) + ".mjs"
                ),
                node.assertClause
            );
        }
        return node;
    }

    /**
     * @param {ts.ExportDeclaration} node
     */
    function visitExportDeclaration(node) {
        if (node.moduleSpecifier &&
            ts.isStringLiteral(node.moduleSpecifier) &&
            /^\.\.?[\\/].*\.js$/.test(node.moduleSpecifier.text)) {
            return factory.updateExportDeclaration(
                node,
                node.decorators,
                node.modifiers,
                node.isTypeOnly,
                node.exportClause,
                factory.createStringLiteral(
                    node.moduleSpecifier.text.slice(0, -3) + ".mjs"
                ),
                node.assertClause
            )
        }
        return node;
    }

    /**
     * @param {ts.ImportCall} node
     */
    function visitImportCall(node) {
        if (node.arguments.length >= 1 &&
            ts.isStringLiteral(node.arguments[0]) &&
            /^\.\.?[\\/].*\.js$/.test(node.arguments[0].text)) {
            return factory.updateCallExpression(
                node,
                node.expression,
                undefined, [
                    factory.createStringLiteral(node.arguments[0].text.slice(0, -3) + ".mjs"),
                    ...ts.visitNodes(node.arguments, visitor, undefined, 1)
                ]);
        }
        return node;
    }

    /**
     * @param {ts.CallExpression} node
     */
    function visitCallExpression(node) {
        if (ts.isPropertyAccessExpression(node.expression) &&
            ts.isIdentifier(node.expression.expression)) {
            const name = ts.idText(node.expression.expression);
            if (tslibBindingNames.has(name)) {
                tslibBindingNames.set(name, true);
            }
        }
        return ts.visitEachChild(node, visitor, context);
    }

    /**
     * @param {ExportAssignmentExpression} node
     */
    function visitExportAssignment(node) {
        if (exportsDeclarationDepth) {
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
     * @param {ExportBindingExpression} node
     */
    function visitExportBinding(node) {
        if (exportsDeclarationDepth) {
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
     * @param {ts.Node} node
     */
    function isESModuleMarker(node) {
        return ts.isExpressionStatement(node)
            && ts.isCallExpression(node.expression)
            && ts.isPropertyAccessExpression(node.expression.expression)
            && ts.isIdentifier(node.expression.expression.expression)
            && ts.idText(node.expression.expression.expression) === "Object"
            && ts.idText(node.expression.expression.name) === "defineProperty"
            && node.expression.arguments.length === 3
            && ts.isIdentifier(node.expression.arguments[0])
            && ts.idText(node.expression.arguments[0]) === "exports"
            && ts.isStringLiteral(node.expression.arguments[1])
            && node.expression.arguments[1].text === "__esModule"
            && ts.isObjectLiteralExpression(node.expression.arguments[2])
            && node.expression.arguments[2].properties.length === 1
            && ts.isPropertyAssignment(node.expression.arguments[2].properties[0])
            && ts.isIdentifier(node.expression.arguments[2].properties[0].name)
            && ts.idText(node.expression.arguments[2].properties[0].name) === "value"
            && node.expression.arguments[2].properties[0].initializer.kind === ts.SyntaxKind.TrueKeyword;
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
     * @template {string} [T=string]
     * @typedef {ts.Identifier & { readonly escapedText: ts.__String & (T extends `__${infer R}` ? `___${R}` : T) }} Id
     */

    /**
     * @template {ts.Expression} L
     * @template {string} R
     * @typedef {ts.PropertyAccessExpression & { readonly expression: L extends string ? Id<L> : L, readonly name: Id<R> }} Prop
     */

    /**
     * @template {ts.Expression} L
     * @template {ts.Expression} R
     * @typedef {ts.AssignmentExpression<ts.EqualsToken> & { readonly left: L, readonly right: R }} Assign
     */

    /**
     * @template {ts.Expression} T
     * @typedef {ts.ParenthesizedExpression & { readonly expression: T }} Paren
     */

    /**
     * @template {ts.Expression} L
     * @template {ts.Expression} R
     * @typedef {ts.BinaryExpression & { readonly left: L, readonly operatorToken: ts.Token<ts.SyntaxKind.BarBarToken>, readonly right: R }} Or
     */

    /**
     * @template {ts.Expression} E
     * @template {readonly ts.Expression[]} A
     * @typedef {ts.CallExpression & { readonly expression: E, readonly arguments: A }} Call
     */

    /**
     * @typedef {ts.ObjectLiteralExpression & { readonly properties: readonly [] }} EmptyObj
     */

    /**
     * @template {ts.BindingName} N
     * @template {ts.Expression | undefined} E
     * @typedef {ts.VariableDeclaration & { readonly name: N, readonly initializer: E }} VarDecl
     */

    /**
     * @template {readonly VarDecl<ts.BindingName, ts.Expression | undefined>[]} N
     * @template {"var" | "let" | "const"} [M="var" | "let" | "const"]
     * @typedef {ts.VariableDeclarationList & { readonly declarations: N, readonly __type: M }} VarDecls
     */

    /**
     * @template {readonly VarDecl<ts.BindingName, ts.Expression | undefined>[]} N
     * @template {"var" | "let" | "const"} [M="var" | "let" | "const"]
     * @typedef {ts.VariableStatement & { readonly declarationList: VarDecls<N, M> }} VarStmt
     */

    /**
     * @template {ts.Identifier} N
     * @template {ts.Expression | undefined} E
     * @template {"var" | "let" | "const"} [M="var" | "let" | "const"]
     * @typedef {VarStmt<[VarDecl<N, E>], M>} SimpleVar
     */

    /** @typedef {Id<"exports">} ExportsIdentifier */
    /** @typedef {Prop<ExportsIdentifier, string>} ExportBindingExpression */
    /** @typedef {Assign<ExportBindingExpression, ts.Expression>} ExportAssignmentExpression */
    /** @typedef {Assign<Id, Or<ExportBindingExpression, Paren<Assign<ExportBindingExpression, EmptyObj>>>>} ExportNamespaceBindingExpression */
    /** @typedef {SimpleVar<ts.Identifier, undefined>} SimpleUninitalizedVar */
    /** @typedef {Call<Paren<ts.FunctionExpression>, [ExportNamespaceBindingExpression]>} ExportNamespaceIIFE */
    /** @typedef {SimpleVar<ts.Identifier, Call<Id<"require">, [ts.StringLiteral]>, "const">} ImportAssignment */
    /** @typedef {SimpleVar<ts.Identifier, Call<ts.Expression, [Call<Id<"require">, [ts.StringLiteral]>]>, "const">} ImportInteropAssignment */

    /**
     * @param {ts.Node} node
     * @returns {node is Assign<ts.Expression, ts.Expression>}
     */
    function isAssignment(node) {
        return ts.isBinaryExpression(node)
            && node.operatorToken.kind === ts.SyntaxKind.EqualsToken;
    }

    /**
     * @param {ts.Node} node
     * @returns {node is Or<ts.Expression, ts.Expression>}
     */
    function isLogicalOr(node) {
        return ts.isBinaryExpression(node)
            && node.operatorToken.kind === ts.SyntaxKind.BarBarToken;
    }

    /**
     * @param {ts.Node} node
     * @returns {node is ExportBindingExpression}
     */
    function isExportBinding(node) {
        return ts.isPropertyAccessExpression(node)
            && ts.isIdentifier(node.expression)
            && ts.idText(node.expression) === "exports"
            && ts.isIdentifier(node.name);
    }

    /**
     * @param {ts.Node} node
     * @returns {node is ExportAssignmentExpression}
     */
    function isExportAssignment(node) {
        return isAssignment(node)
            && isExportBinding(node.left);
    }

    /**
     * @param {ExportBindingExpression | ExportAssignmentExpression | ExportNamespaceIIFE | ExportNamespaceBindingExpression} node
     * @return {string | undefined}
     */
    function getExportBindingName(node) {
        return isExportAssignment(node) ? getExportBindingName(node.left) :
            isExportNamespaceIIFE(node) ? getExportBindingName(node.arguments[0]) :
            isExportNamespaceBindingExpression(node) ? getExportBindingName(node.right.left) :
            ts.idText(node.name);
    }

    /**
     * @param {ts.Node} node
     * @returns {node is SimpleUninitalizedVar}
     */
    function isSimpleUninitalizedVar(node) {
        return ts.isVariableStatement(node)
            && (node.declarationList.flags & ts.NodeFlags.BlockScoped) === 0
            && node.declarationList.declarations.length === 1
            && ts.isIdentifier(node.declarationList.declarations[0].name)
            && !node.declarationList.declarations[0].initializer;
    }

    /**
     * @param {ts.FunctionDeclaration | ts.ClassDeclaration | SimpleUninitalizedVar} node
     */
    function getDeclarationName(node) {
        return ts.isFunctionDeclaration(node) ? node.name && ts.idText(node.name) :
            ts.isClassDeclaration(node) ? node.name && ts.idText(node.name) :
            ts.idText(node.declarationList.declarations[0].name);
    }

    /**
     * @param {ts.Node} node
     * @return {node is ExportNamespaceBindingExpression}
     */
    function isExportNamespaceBindingExpression(node) {
        // N = exports.N || (exports.N = {})
        return isAssignment(node)
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
     * @return {node is ExportNamespaceIIFE}
     */
    function isExportNamespaceIIFE(node) {
        return ts.isCallExpression(node)
            && ts.isParenthesizedExpression(node.expression)
            && ts.isFunctionExpression(node.expression.expression)
            && node.arguments.length === 1
            && isExportNamespaceBindingExpression(node.arguments[0]);
    }

    /**
     * @param {ts.Node} node
     * @returns {node is ImportAssignment}
     */
    function isImportAssignment(node) {
        return ts.isVariableStatement(node)
            && (node.declarationList.flags & ts.NodeFlags.BlockScoped) === ts.NodeFlags.Const
            && node.declarationList.declarations.length === 1
            && ts.isIdentifier(node.declarationList.declarations[0].name)
            && !!node.declarationList.declarations[0].initializer
            && ts.isCallExpression(node.declarationList.declarations[0].initializer)
            && ts.isIdentifier(node.declarationList.declarations[0].initializer.expression)
            && ts.idText(node.declarationList.declarations[0].initializer.expression) === "require"
            && node.declarationList.declarations[0].initializer.arguments.length === 1
            && ts.isStringLiteral(node.declarationList.declarations[0].initializer.arguments[0]);
    }

    /**
     * @param {ts.Node} node
     * @param {string} helperName
     * @returns {node is ts.CallExpression}
     */
    function isCallToHelper(node, helperName) {
        return ts.isCallExpression(node) && (
            ts.isIdentifier(node.expression) &&
                ts.idText(node.expression) === helperName ||
            tslibBindingNames.size > 0 &&
                ts.isPropertyAccessExpression(node.expression) &&
                ts.isIdentifier(node.expression.expression) &&
                tslibBindingNames.has(ts.idText(node.expression.expression)) &&
                ts.isIdentifier(node.expression.name) &&
                ts.idText(node.expression.name) === helperName
        );
    }

    /**
     * @param {ts.Node} node
     * @returns {node is ImportInteropAssignment}
     */
    function isImportInteropAssignment(node) {
        return ts.isVariableStatement(node)
            && (node.declarationList.flags & ts.NodeFlags.BlockScoped) === ts.NodeFlags.Const
            && node.declarationList.declarations.length === 1
            && ts.isIdentifier(node.declarationList.declarations[0].name)
            && !!node.declarationList.declarations[0].initializer
            && isCallToHelper(node.declarationList.declarations[0].initializer, "__importDefault")
            && node.declarationList.declarations[0].initializer.arguments.length >= 1
            && ts.isCallExpression(node.declarationList.declarations[0].initializer.arguments[0])
            && ts.isIdentifier(node.declarationList.declarations[0].initializer.arguments[0].expression)
            && ts.idText(node.declarationList.declarations[0].initializer.arguments[0].expression) === "require"
            && node.declarationList.declarations[0].initializer.arguments[0].arguments.length === 1
            && ts.isStringLiteral(node.declarationList.declarations[0].initializer.arguments[0].arguments[0]);
    }

    /**
     * @param {ImportAssignment | ImportInteropAssignment} node
     */
    function getImportBindingName(node) {
        return node.declarationList.declarations[0].name;
    }

    /**
     * @param {ImportAssignment | ImportInteropAssignment} node
     */
    function getImportModuleSpecifier(node) {
        return isImportAssignment(node) ?
            node.declarationList.declarations[0].initializer.arguments[0] :
            node.declarationList.declarations[0].initializer.arguments[0].arguments[0];
    }

    /**
     * @param {ts.Node} from
     * @param {ts.Node} to
     * @param {ts.SourceFile} sourceFile
     */
    function copyComments(from, to, sourceFile) {
        ts.forEachLeadingCommentRange(sourceFile.text, from.pos, onLeadingCommentRange);
        ts.forEachTrailingCommentRange(sourceFile.text, from.end, onTrailingCommentRange);

        /**
         * @param {number} pos
         * @param {number} end
         * @param {ts.CommentKind} kind
         * @param {boolean} hasTrailingNewLine
         */
        function onLeadingCommentRange(pos, end, kind, hasTrailingNewLine) {
            const comment = sourceFile.text.slice(pos + 2, kind === ts.SyntaxKind.MultiLineCommentTrivia ? end - 2 : end);
            ts.addSyntheticLeadingComment(to, kind, comment, hasTrailingNewLine);
        }

        /**
         * @param {number} pos
         * @param {number} end
         * @param {ts.CommentKind} kind
         * @param {boolean} hasTrailingNewLine
         */
        function onTrailingCommentRange(pos, end, kind, hasTrailingNewLine) {
            const comment = sourceFile.text.slice(pos + 2, kind === ts.SyntaxKind.MultiLineCommentTrivia ? end - 2 : end);
            ts.addSyntheticTrailingComment(to, kind, comment, hasTrailingNewLine);
        }
    }
}
