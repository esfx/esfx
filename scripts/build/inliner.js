/*!
   Copyright 2022 Ron Buckton

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

// @ts-check
const ts = require("typescript");
const { treeShaker } = require("./treeShaker");
const { isExpressionIdentifier, isCommonJSImportStatement } = require("./utils");

/**
 * Creates a custom transformer that can be used to perform rudimentary module inlining.
 * @param {ts.Program} program
 * @param {"marked" | "all"} mode
 */
function createInliner(program, mode = "marked") {
    /**
     * @param {ts.TransformationContext} context
     */
    return context => inliner(program, context, mode);
}

exports.createInliner = createInliner;

const inlinedCommentRegExp = /\/\*{1,2}\s*[#@]__INLINE__\s*\*\/|\/\/\s*[#@]__INLINE__\s*$/i;

/**
 * @param {ts.Program} program
 * @param {ts.TransformationContext} context
 * @param {"marked" | "all"} mode
 */
function inliner(program, context, mode) {
    const { factory } = context;

    const checker = program.getTypeChecker();
    const ignoreCase = !ts.sys.useCaseSensitiveFileNames;

    /** @type {ts.ResolvedProjectReference[] | undefined} */
    let projectReferences;

    /** @type {Map<string, readonly string[]>} */
    const outputFileNamesMap = new Map();

    /** @type {Map<string, ModuleResolution>} */
    const moduleResolutionCache = new Map();

    /** @type {ts.SourceFile} */
    let currentSourceFile;

    /** @type {ModuleResolution[]} */
    let possibleStarImports;

    /** @type {Map<ts.Symbol, ModuleResolution>} */
    let starImportsBySymbol;

    /** @type {Map<ts.Symbol, ModuleResolution>} */
    let bindingImportsBySymbol;

    /** @type {Map<ts.Node, [ModuleResolution, string | null]>} */
    let importUses;

    /** @type {Set<ts.Node>} */
    let elidableImports;

    /** @type {Map<string, ts.Identifier | null>} */
    let inlinedModules;

    /** @type {Map<ts.Symbol, InliningDecision>} */
    let inliningDecisionCache;

    /** @type {Map<ModuleResolution, ts.Program>} */
    let programCache;

    return { transformSourceFile, transformBundle };

    /**
     * @param {ts.SourceFile} node
     */
    function transformSourceFile(node) {
        if (node.isDeclarationFile) return node;

        currentSourceFile = node;
        possibleStarImports = [];
        starImportsBySymbol = new Map();
        bindingImportsBySymbol = new Map();
        importUses = new Map();
        elidableImports = new Set();
        inlinedModules = new Map();
        inliningDecisionCache = new Map();
        programCache = new Map();

        collectInlinedImports(node);
        collectImportUses(node);

        node = ts.visitEachChild(node, functionInliningVisitor, context);
        markUsedImports();
        node = ts.visitEachChild(node, topLevelStatementVisitor, context);

        currentSourceFile = undefined;
        possibleStarImports = undefined;
        starImportsBySymbol = undefined;
        bindingImportsBySymbol = undefined;
        importUses = undefined;
        elidableImports = undefined;
        inlinedModules = undefined;
        inliningDecisionCache = undefined;
        programCache = undefined;
        return node;
    }

    /**
     * @param {ts.Bundle} bundle
     */
    function transformBundle(bundle) {
        return factory.createBundle(bundle.sourceFiles.map(transformSourceFile), bundle.prepends);
    }

    /**
     * @param {ts.Node} node
     */
    function isInlined(node) {
        return ts.forEachLeadingCommentRange(currentSourceFile.text, node.getFullStart(), (pos, end) => inlinedCommentRegExp.test(currentSourceFile.text.slice(pos, end)))
            || ts.forEachTrailingCommentRange(currentSourceFile.text, node.getFullStart(), (pos, end) => inlinedCommentRegExp.test(currentSourceFile.text.slice(pos, end)));
    }

    /**
     * @param {ts.Node} node
     */
    function collectInlinedImports(node) {
        if (ts.isSourceFile(node)) {
            for (const stmt of node.statements) {
                collectInlinedImports(stmt);
            }
        }
        else if (ts.isImportDeclaration(node)) {
            if (!node.importClause || !ts.isStringLiteral(node.moduleSpecifier)) return;
            if (mode === "all" || isInlined(node) || isInlined(node.importClause)) {
                const moduleSpecifier = node.moduleSpecifier.text;
                const moduleReference = resolveModule(moduleSpecifier);
                if (!moduleReference) return;

                collectInlinedImportsOfImportDeclaration(node.importClause, moduleReference);
                elidableImports.add(ts.getOriginalNode(node));
            }
        }
        else if (isCommonJSImportStatement(node)) {
            if (mode === "all" || isInlined(node) || isInlined(node.declarationList)) {
                const moduleSpecifier = node.declarationList.declarations[0].initializer.arguments[0].text;
                const moduleReference = resolveModule(moduleSpecifier);
                if (!moduleReference) return;

                collectInlinedImportsOfCommonJSImportStatement(node.declarationList.declarations[0].name, moduleReference);
                elidableImports.add(ts.getOriginalNode(node));
            }
        }
    }

    /**
     * @param {ts.Node} node
     * @param {ModuleResolution} moduleReference
     */
    function collectInlinedImportsOfImportDeclaration(node, moduleReference) {
        if (ts.isImportClause(node)) {
            if (node.name) recordInlinedImport(moduleReference, node.name, "default");
            if (node.namedBindings) collectInlinedImportsOfImportDeclaration(node.namedBindings, moduleReference);
        }
        else if (ts.isNamespaceImport(node)) {
            recordInlinedImport(moduleReference, node.name, null);
        }
        else if (ts.isNamedImports(node)) {
            for (const element of node.elements) {
                collectInlinedImportsOfImportDeclaration(element, moduleReference);
            }
        }
        else if (ts.isImportSpecifier(node)) {
            recordInlinedImport(moduleReference, node.name, ts.idText(node.propertyName ?? node.name));
        }
    }

    /**
     * @param {ts.BindingName} node
     * @param {ModuleResolution} moduleReference
     */
    function collectInlinedImportsOfCommonJSImportStatement(node, moduleReference) {
        if (ts.isIdentifier(node)) {
            recordInlinedImport(moduleReference, node, null);
        }
        else if (ts.isObjectBindingPattern(node)) {
            for (const element of node.elements) {
                if (element.dotDotDotToken) {
                    collectInlinedImportsOfCommonJSImportStatement(element.name, moduleReference);
                }
                else {
                    recordInlinedImport(moduleReference, element.name, element.propertyName);
                }
            }
        }
    }

    /**
     * @param {ModuleResolution} moduleReference
     * @param {ts.BindingName} localName
     * @param {ts.BindingName | ts.PropertyName | string | null} importedName
     */
    function recordInlinedImport(moduleReference, localName, importedName = localName) {
        if (importedName === null) {
            if (!moduleReference.importStar) {
                possibleStarImports.push(moduleReference);
                const sym = checker.getSymbolAtLocation(localName);
                if (sym) starImportsBySymbol.set(sym, moduleReference);
            }
        }
        else {
            if (typeof importedName !== "string") {
                if (ts.isIdentifier(importedName)) importedName = ts.idText(importedName);
                else if (ts.isStringLiteral(importedName) || ts.isNumericLiteral(importedName)) importedName = importedName.text;
                else {
                    moduleReference.importStar = true;
                    return;
                }
            }

            const sym = checker.getSymbolAtLocation(localName);
            if (sym) bindingImportsBySymbol.set(sym, moduleReference);
        }
    }

    /**
     * @param {ts.Node} node
     */
    function collectImportUses(node) {
        ts.forEachChild(node, collectImportUses);
        if (!ts.isIdentifier(node) || !isExpressionIdentifier(node)) return;

        const sym = checker.getSymbolAtLocation(node);
        if (!sym) return;

        const starMatch = starImportsBySymbol.get(sym);
        if (starMatch) {
            if (ts.isPropertyAccessExpression(node.parent) && ts.isIdentifier(node.parent.name)) {
                importUses.set(ts.getOriginalNode(node.parent), [starMatch, ts.idText(node.parent.name)]);
            }
            else if (ts.isElementAccessExpression(node.parent) && ts.isStringLiteral(node.parent.argumentExpression)) {
                importUses.set(ts.getOriginalNode(node.parent), [starMatch, node.parent.argumentExpression.text]);
            }
            else {
                importUses.set(ts.getOriginalNode(node.parent), [starMatch, null]);
            }
        }

        const bindingMatch = bindingImportsBySymbol.get(sym);
        if (bindingMatch) {
            importUses.set(ts.getOriginalNode(node), [bindingMatch, ts.idText(node)]);
        }
    }

    function markUsedImports() {
        for (const [reference, bindingName] of importUses.values()) {
            if (bindingName === null) {
                reference.importStar = true;
            }
            else {
                reference.imports ??= new Set();
                reference.imports.add(bindingName);
            }
        }
    }

    /**
     * @param {ts.Node} node
     * @returns {ts.VisitResult<ts.Node>}
     */
    function topLevelStatementVisitor(node) {
        if (ts.isImportDeclaration(node)) return visitImportDeclaration(node);
        if (isCommonJSImportStatement(node)) return visitCommonJSImportStatement(node);
        return node;
    }

    /**
     * @param {ts.ImportDeclaration} node
     */
    function visitImportDeclaration(node) {
        if (!elidableImports.has(ts.getOriginalNode(node)) || !ts.isStringLiteral(node.moduleSpecifier)) return node;
        const moduleSpecifier = node.moduleSpecifier.text;
        const result = inlineImport(
            moduleSpecifier,
            () => node.importClause.namedBindings && ts.isNamespaceImport(node.importClause.namedBindings) ?
                factory.createIdentifier(ts.idText(node.importClause.namedBindings.name)) :
                factory.getGeneratedNameForNode(node),
            () => factory.createIdentifier(ts.idText(node.importClause.name)),
            !!node.importClause.namedBindings,
            !!node.importClause.name
        );
        return result;
    }

    /**
     * @param {import("./utils").CommonJSImportStatement} node
     */
    function visitCommonJSImportStatement(node) {
        if (!elidableImports.has(ts.getOriginalNode(node))) return node;
        const moduleSpecifier = node.declarationList.declarations[0].initializer.arguments[0].text;
        const result = inlineImport(
            moduleSpecifier,
            () => ts.isIdentifier(node.declarationList.declarations[0].name) ?
                factory.createIdentifier(ts.idText(node.declarationList.declarations[0].name)) :
                factory.getGeneratedNameForNode(node.declarationList.declarations[0]),
            /*getDefaultImportName*/ undefined,
            /*hasNamespaceImport*/ true,
            /*hasDefaultImport*/ false,
            id => {
                /** @type {ts.VariableDeclaration[]} */
                const variables = [];
                if (ts.isObjectBindingPattern(node.declarationList.declarations[0].name)) {
                    variables.push(factory.createVariableDeclaration(
                        node.declarationList.declarations[0].name,
                        undefined,
                        undefined,
                        id
                    ));
                }
                return variables;
            }
        );
        return result;
    }

    /**
     * @param {string} moduleSpecifier
     * @param {() => ts.Identifier} getNamespaceImportName
     * @param {(() => ts.Identifier) | undefined} getDefaultImportName
     * @param {boolean} hasNamespaceImport
     * @param {boolean} hasDefaultImport
     * @param {(id: ts.Identifier) => readonly ts.VariableDeclaration[]} [extraVariables]
     */
    function inlineImport(moduleSpecifier, getNamespaceImportName, getDefaultImportName, hasNamespaceImport, hasDefaultImport, extraVariables) {
        const moduleReference = resolveModule(moduleSpecifier);
        if (!moduleReference) {
            console.log("Could not determine source file to inline.");
            return;
        }

        const variables = [];
        const resolvedModuleIdentifier = inlinedModules.get(moduleReference.source);

        /** @type {ts.Identifier} */
        let id;
        if (resolvedModuleIdentifier === null) {
            return;
        }

        if (resolvedModuleIdentifier) {
            id = resolvedModuleIdentifier;
            if (hasNamespaceImport) {
                id = getNamespaceImportName();
                variables.push(factory.createVariableDeclaration(id, undefined, undefined, resolvedModuleIdentifier));
            }
        }
        else {
            const inlinedFile = moduleReference.generated;
            const inlinedProgram = ts.createProgram({
                rootNames: [inlinedFile],
                options: { ...moduleReference.projectReference.commandLine.options, allowJs: true },
                projectReferences: moduleReference.projectReference.commandLine.projectReferences
            });

            let inlinedSourceFile = inlinedProgram.getSourceFile(inlinedFile);
            if (!inlinedSourceFile) {
                if (!moduleReference.importStar && !moduleReference.imports?.size) {
                    return;
                }

                console.log("Could not determine source file to inline.");
                return;
            }

            // copy any pinned comments of the inlined file
            const pinnedCommentHolder = getPinnedComments(inlinedSourceFile, moduleReference);
            if (!moduleReference.importStar && !moduleReference.imports?.size) {
                if (pinnedCommentHolder) {
                    inlinedModules.set(moduleReference.source, null);
                    return pinnedCommentHolder;
                }
                return;
            }

            // if the module reference is not `import *`, use the tree shaker to remove unused exports.
            // we do this before any further inlining to ensure we don't inline modules we don't end up using.
            if (!moduleReference.importStar) {
                inlinedSourceFile = treeShaker(inlinedSourceFile, inlinedProgram.getTypeChecker(), moduleReference.imports ?? []);
            }

            // do additional inlining on the new source file.
            inlinedSourceFile = ts.transform(inlinedSourceFile, [coerceCustomTransformer(createInliner(inlinedProgram, "all"))]).transformed[0];

            // mark all nodes as synthesized. this causes the TypeScript emitter to emit the nodes verbatim.
            markSynthesized(inlinedSourceFile);

            // add the pinned comments of the file, if present
            const statements = inlinedSourceFile.statements.slice();
            if (pinnedCommentHolder) statements.unshift(pinnedCommentHolder);

            const moduleDefinitionFunction = factory.createFunctionExpression(
                /*modifiers*/ undefined,
                /*asteriskToken*/ undefined,
                /*name*/ undefined,
                /*typeParameters*/ undefined,
                /*parameters*/ [
                    factory.createParameterDeclaration(undefined, undefined, undefined, "module"),
                    factory.createParameterDeclaration(undefined, undefined, undefined, "exports"),
                    factory.createParameterDeclaration(undefined, undefined, undefined, "require"),
                ],
                /*type*/ undefined,
                /*body*/ factory.createBlock(statements, true)
            );

            const moduleEvaluationFunction = factory.createFunctionExpression(
                /*modifiers*/ undefined,
                /*asteriskToken*/ undefined,
                /*name*/ undefined,
                /*typeParameters*/ undefined,
                /*parameters*/ [],
                /*type*/ undefined,
                /*body*/ factory.createBlock([
                    factory.createVariableStatement(undefined, [
                        factory.createVariableDeclaration("module", undefined, undefined, factory.createObjectLiteralExpression([
                            factory.createPropertyAssignment("exports", factory.createObjectLiteralExpression())
                        ]))
                    ]),
                    factory.createExpressionStatement(
                        factory.createCallExpression(
                            moduleDefinitionFunction,
                            undefined,
                            [
                                factory.createIdentifier("module"),
                                factory.createPropertyAccessExpression(factory.createIdentifier("module"), "exports"),
                                factory.createNull()
                            ]
                        )
                    ),
                    factory.createReturnStatement(
                        factory.createPropertyAccessExpression(factory.createIdentifier("module"), "exports")
                    )
                ], true)
            );

            id = getNamespaceImportName();
            inlinedModules.set(moduleReference.source, id);
            variables.push(factory.createVariableDeclaration(id, undefined, undefined, factory.createCallExpression(moduleEvaluationFunction, undefined, [])));
        }

        if (hasDefaultImport && getDefaultImportName) {
            // default import
            variables.push(factory.createVariableDeclaration(getDefaultImportName(), undefined, undefined, factory.createPropertyAccessExpression(id, "default")));
        }

        if (extraVariables) {
            variables.push(...extraVariables(id));
        }

        return factory.createVariableStatement(undefined, factory.createVariableDeclarationList(variables, ts.NodeFlags.Const));
    }

    /**
     * @param {ts.Node} node
     * @returns {ts.VisitResult<ts.Node>}
     */
    function functionInliningVisitor(node) {
        if (ts.isCallExpression(node)) return visitCallExpression(node);
        return ts.visitEachChild(node, functionInliningVisitor, context);
    }

    /**
     * @param {ts.CallExpression} node
     */
    function visitCallExpression(node) {
        if (ts.isIdentifier(node.expression) && node.arguments.length === 1 && ts.isIdentifier(node.arguments[0])) {
            const decision = getFunctionInliningDecision(node.expression);
            if (decision.inline) {
                importUses.delete(ts.getOriginalNode(node.expression));
                return decision.inliner(node.arguments[0]);
            }
        }
        return ts.visitEachChild(node, functionInliningVisitor, context);
    }

    /**
     * @param {ts.Identifier} node
     */
    function getFunctionInliningDecision(node) {
        /** @type {InliningDecision | undefined} */
        let decision;

        const referencedSym = checker.getSymbolAtLocation(node);
        if (decision = inliningDecisionCache.get(referencedSym)) return decision;

        let sym = referencedSym;
        if (sym.flags & ts.SymbolFlags.Alias) sym = checker.getAliasedSymbol(sym);
        if (decision = inliningDecisionCache.get(sym)) return decision;

        /** @type {ts.Node} */
        let importDecl = referencedSym.valueDeclaration ?? referencedSym.declarations?.[0];
        if (!importDecl) return cacheInliningDecision({ inline: false }, referencedSym, sym);
        if (ts.isImportSpecifier(importDecl)) importDecl = importDecl.parent;
        if (ts.isNamedImports(importDecl)) importDecl = importDecl.parent;
        if (ts.isNamespaceImport(importDecl)) importDecl = importDecl.parent;
        if (ts.isImportClause(importDecl)) importDecl = importDecl.parent;
        // todo: commonjs imports
        if (!ts.isImportDeclaration(importDecl) || !ts.isStringLiteral(importDecl.moduleSpecifier)) return cacheInliningDecision({ inline: false }, referencedSym, sym);
        if (!elidableImports.has(ts.getOriginalNode(importDecl))) return cacheInliningDecision({ inline: false }, referencedSym, sym);

        if (sym.flags & ts.SymbolFlags.Value) {
            const decl = sym.declarations?.find(decl => ts.isFunctionDeclaration(decl) && decl.body) ?? sym.valueDeclaration;
            if (decl) {
                if (ts.isFunctionDeclaration(decl) && decl.body) {
                    const inliner = tryCreateFunctionInliner(decl);
                    if (inliner) {
                        decision = { inline: true, inliner };
                    }
                }
                else {
                    // if this is a declaration file, need to find the function in source
                    const resolution = resolveModule(importDecl.moduleSpecifier.text);
                    if (resolution) {
                        const program = getProgramForGeneratedOutput(resolution);
                        const sourceFile = program.getSourceFile(resolution.generated);
                        if (sourceFile) {
                            // find this export
                            const checker = program.getTypeChecker();
                            // @ts-ignore
                            const moduleSymbol = sourceFile.symbol;
                            const exportedSymbols = checker.getExportsOfModule(moduleSymbol);
                            let exportSymbol = exportedSymbols.find(exportSymbol => exportSymbol.escapedName === sym.escapedName);
                            if (exportSymbol) {
                                if (exportSymbol.flags & ts.SymbolFlags.Alias) exportSymbol = checker.getAliasedSymbol(exportSymbol);
                                const decl = exportSymbol.declarations?.find(decl => ts.isFunctionDeclaration(decl) && decl.body) ?? exportSymbol.valueDeclaration;
                                if (decl && ts.isFunctionDeclaration(decl) && decl.body) {
                                    const inliner = tryCreateFunctionInliner(decl);
                                    if (inliner) {
                                        decision = { inline: true, inliner };
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return cacheInliningDecision(decision ?? { inline: false }, referencedSym, sym);
    }

    /**
     * @param {ts.FunctionDeclaration} decl
     */
    function tryCreateFunctionInliner(decl) {
        if (decl.parameters.length !== 1) return undefined; // must have exactly one parameter
        if (decl.body?.statements.length !== 1) return undefined; // must have exactly one statement

        const parameter = decl.parameters[0];
        if (!ts.isIdentifier(parameter.name)) return undefined; // parameter name must be an identifier
        if (parameter.initializer) return undefined; // parameter cannot have an initializer
        if (parameter.dotDotDotToken) return undefined; // parameter cannot be a rest parameter
        const parameterName = parameter.name;


        const statement = decl.body.statements[0];
        if (!ts.isReturnStatement(statement) || !statement.expression) return undefined; // statement must be a return statement

        const placeholder = factory.createTempVariable(undefined);
        const inlined = tryInlineExpression(statement.expression);
        if (!inlined) return undefined;

        /** @type {(node: ts.Identifier) => ts.Expression} */
        return node => ts.visitNode(inlined, function inliner(n) {
            if (n === placeholder) return ts.setSourceMapRange(factory.createIdentifier(ts.idText(node)), { pos: node.pos, end: node.end, source: node.getSourceFile() });
            if (ts.isIdentifier(n)) return ts.setSourceMapRange(factory.createIdentifier(ts.idText(n)), { pos: n.pos, end: n.end, source: n.getSourceFile() });
            if (ts.isStringLiteral(n)) return ts.setSourceMapRange(factory.createStringLiteral(n.text), { pos: n.pos, end: n.end, source: n.getSourceFile() });
            if (ts.isNumericLiteral(n)) return ts.setSourceMapRange(factory.createNumericLiteral(n.text), { pos: n.pos, end: n.end, source: n.getSourceFile() });
            if (ts.isRegularExpressionLiteral(n)) return ts.setSourceMapRange(factory.createRegularExpressionLiteral(n.text), { pos: n.pos, end: n.end, source: n.getSourceFile() });
            if (ts.isNoSubstitutionTemplateLiteral(n)) return ts.setSourceMapRange(factory.createNoSubstitutionTemplateLiteral(n.text, n.rawText), { pos: n.pos, end: n.end, source: n.getSourceFile() });
            if (ts.isTemplateHead(n)) return ts.setSourceMapRange(factory.createTemplateHead(n.text, n.rawText), { pos: n.pos, end: n.end, source: n.getSourceFile() });
            if (ts.isTemplateMiddle(n)) return ts.setSourceMapRange(factory.createTemplateMiddle(n.text, n.rawText), { pos: n.pos, end: n.end, source: n.getSourceFile() });
            if (ts.isTemplateTail(n)) return ts.setSourceMapRange(factory.createTemplateTail(n.text, n.rawText), { pos: n.pos, end: n.end, source: n.getSourceFile() });
            return ts.visitEachChild(n, inliner, context);
        });

        /**
         * @param {ts.Node} node
         */
        function tryInlineExpression(node) {
            switch (node.kind) {
                case ts.SyntaxKind.StringLiteral:
                case ts.SyntaxKind.NumericLiteral:
                case ts.SyntaxKind.BigIntLiteral:
                case ts.SyntaxKind.RegularExpressionLiteral:
                case ts.SyntaxKind.TrueKeyword:
                case ts.SyntaxKind.FalseKeyword:
                case ts.SyntaxKind.NullKeyword:
                case ts.SyntaxKind.OmittedExpression:
                case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                    return node;
            }
            if (ts.isIdentifier(node)) return tryInlineIdentifier(node);
            if (ts.isConditionalExpression(node)) {
                const condition = tryInlineExpression(node.condition);
                const whenTrue = condition && tryInlineExpression(node.whenTrue);
                const whenFalse = whenTrue && tryInlineExpression(node.whenFalse);
                return whenFalse && factory.updateConditionalExpression(node, condition, factory.createToken(ts.SyntaxKind.QuestionToken), whenTrue, factory.createToken(ts.SyntaxKind.ColonToken), whenFalse);
            }
            if (ts.isBinaryExpression(node)) {
                const left = tryInlineExpression(node.left);
                const right = left && tryInlineExpression(node.right);
                return right && factory.updateBinaryExpression(node, left, node.operatorToken.kind, right);
            }
            if (ts.isPrefixUnaryExpression(node)) {
                switch (node.operator) {
                    case ts.SyntaxKind.PlusPlusToken:
                    case ts.SyntaxKind.MinusMinusToken:
                        return undefined;
                }
                const operand = tryInlineExpression(node.operand);
                return operand && factory.updatePrefixUnaryExpression(node, operand);
            }
            if (ts.isVoidExpression(node)) {
                const expression = tryInlineExpression(node.expression);
                return expression && factory.updateVoidExpression(node, expression);
            }
            if (ts.isDeleteExpression(node)) {
                const expression = tryInlineExpression(node.expression);
                return expression && factory.updateDeleteExpression(node, expression);
            }
            if (ts.isTypeOfExpression(node)) {
                const expression = tryInlineExpression(node.expression);
                return expression && factory.updateTypeOfExpression(node, expression);
            }
            if (ts.isArrayLiteralExpression(node)) {
                const elements = node.elements.map(tryInlineExpression);
                if (elements.some(e => !e)) return undefined;
                return factory.updateArrayLiteralExpression(node, elements);
            }
            if (ts.isParenthesizedExpression(node)) {
                const expression = tryInlineExpression(node.expression);
                return expression && factory.updateParenthesizedExpression(node, expression);
            }
            if (ts.isPropertyAccessExpression(node)) {
                const expression = tryInlineExpression(node.expression);
                return expression && factory.updatePropertyAccessExpression(node, expression, node.name);
            }
            if (ts.isElementAccessExpression(node)) {
                const expression = tryInlineExpression(node.expression);
                const argumentExpression = expression && tryInlineExpression(node.argumentExpression);
                return argumentExpression && factory.updateElementAccessExpression(node, expression, argumentExpression);
            }
            if (ts.isCallExpression(node)) {
                if (ts.isIdentifier(node.expression) && node.arguments.length === 1 && ts.isIdentifier(node.arguments[0])) {
                    const decision = getFunctionInliningDecision(node.expression);
                    if (decision.inline) {
                        importUses.delete(ts.getOriginalNode(node.expression));
                        return decision.inliner(node.arguments[0]);
                    }
                }
                const expression = tryInlineExpression(node.expression);
                const argumentList = expression && node.arguments.map(tryInlineExpression);
                if (!argumentList?.every(e => !!e)) return undefined;
                return factory.updateCallExpression(node, expression, undefined, argumentList);
            }
            if (ts.isNewExpression(node)) {
                const expression = tryInlineExpression(node.expression);
                if (!node.arguments) return expression && factory.updateNewExpression(node, expression, undefined, undefined);
                const argumentList = expression && node.arguments.map(tryInlineExpression);
                if (!argumentList?.every(e => !!e)) return undefined;
                return factory.updateNewExpression(node, expression, undefined, argumentList);
            }
            // if (ts.isTemplateExpression(node)) {}
            // if (ts.isTaggedTemplateExpression(node)) {}
            // if (ts.isArrowFunction(node)) {}
            return undefined;
        }

        /**
         * @param {ts.Identifier} node
         */
        function tryInlineIdentifier(node) {
            if (ts.idText(node) === "undefined") return node;
            if (identifierReferencesParameterName(node, parameterName)) return placeholder;
            if (identifierReferencesGlobal(node)) return node;
        }
    }

    /**
     * @param {ts.Identifier} node
     * @param {ts.Identifier} parameterName
     */
    function identifierReferencesParameterName(node, parameterName) {
        const nodeSym = checker.getSymbolAtLocation(node);
        const paramSym = checker.getSymbolAtLocation(parameterName);
        return !!nodeSym && nodeSym === paramSym;
    }

    /**
     * @param {ts.Identifier} node
     */
    function identifierReferencesGlobal(node) {
        const nodeSym = checker.getSymbolAtLocation(node);
        if (!nodeSym) return false;
        /** @type {ts.Node} */
        let decl = nodeSym.valueDeclaration ?? nodeSym.declarations[0];
        if (!decl) return false;
        if (ts.isVariableDeclaration(decl)) decl = decl.parent;
        if (ts.isVariableDeclarationList(decl)) decl = decl.parent;
        if (!ts.isVariableStatement(decl) && !ts.isFunctionDeclaration(decl) && !ts.isClassDeclaration(decl)) return false;
        if (!ts.isSourceFile(decl.parent) || ts.isExternalModule(decl.parent)) return false;
        // @ts-ignore
        if (ts.isExternalOrCommonJsModule(decl.parent)) return false;
        return true;
    }

    /**
     * @param {ModuleResolution} moduleReference
     */
    function getProgramForGeneratedOutput(moduleReference) {
        let program = programCache.get(moduleReference);
        if (!program) {
            program = ts.createProgram({
                rootNames: [moduleReference.generated],
                options: { ...moduleReference.projectReference.commandLine.options, allowJs: true },
                projectReferences: moduleReference.projectReference.commandLine.projectReferences
            });
            programCache.set(moduleReference, program);
        }
        return program;
    }

    /**
     * @param {ts.SourceFile} sourceFile
     */
    function markSynthesized(sourceFile) {
        ts.forEachChild(sourceFile, function markSynthesized(node) {
            const { pos, end } = node;
            // @ts-ignore
            node.flags |= ts.NodeFlags.Synthesized, node.pos = -1, node.end = -1, node.parent = undefined, node.original = undefined;
            if (!ts.isNotEmittedStatement(node)) {
                ts.setEmitFlags(node, ts.EmitFlags.NoComments);
            }
            ts.setSourceMapRange(node, { source: sourceFile, pos, end });
            ts.forEachChild(node, markSynthesized);
        });
    }

    /**
     * @param {string} moduleSpecifier
     */
    function resolveModule(moduleSpecifier) {
        /** @type {string[]} */
        const cacheKeys = [];

        /** @type {ModuleResolution | undefined} */
        let resolution;
        if (resolution = moduleResolutionCache.get(moduleSpecifier)) {
            return resolution;
        }

        cacheKeys.push(moduleSpecifier);

        const moduleReference = ts.resolveModuleName(moduleSpecifier, currentSourceFile.fileName, program.getCompilerOptions(), {
            fileExists: ts.sys.fileExists.bind(ts.sys),
            readFile: ts.sys.readFile.bind(ts.sys),
            directoryExists: ts.sys.directoryExists.bind(ts.sys),
            getDirectories: ts.sys.getDirectories.bind(ts.sys),
            realpath: ts.sys.realpath?.bind(ts.sys),
            getCurrentDirectory: program.getCurrentDirectory.bind(program),
            useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames
        }).resolvedModule;
        if (moduleReference) {
            const resolvedFileName = moduleReference.resolvedFileName;
            if (resolution = moduleResolutionCache.get(resolvedFileName)) {
                return cacheResolution(resolution, ...cacheKeys);
            }

            cacheKeys.push(resolvedFileName);

            // try to determine if this belongs to a project reference
            for (const projectReference of getProjectReferences()) {
                if (resolution = findInputsAndOutputs(projectReference, resolvedFileName, moduleReference.packageId)) {
                    return cacheResolution(resolution, ...cacheKeys);
                }
            }
        }

        console.log("failed to resolve module reference for", moduleSpecifier);
    }

    /**
     * @param {ts.ResolvedProjectReference} projectReference
     * @param {string} fileName
     * @param {ts.PackageId} packageId
     * @returns {ModuleResolution | undefined}
     */
    function findInputsAndOutputs(projectReference, fileName, packageId) {
        let source;
        let outputs;
        if (projectReference.commandLine.fileNames.includes(fileName)) {
            source = fileName;
            outputs = getOutputFiles(projectReference, source);
        }
        else {
            for (const inputFileName of projectReference.commandLine.fileNames) {
                const outputsFiles = getOutputFiles(projectReference, inputFileName);
                if (outputsFiles.includes(fileName)) {
                    source = inputFileName;
                    outputs = outputsFiles;
                    break;
                }
            }
        }
        if (source && outputs) {
            const generated = outputs.find(file => file.endsWith(".js"));
            if (generated) {
                return { projectReference, source, generated, outputs, packageId };
            }
        }
    }

    /**
     * @param {ts.ResolvedProjectReference} projectReference
     * @param {string} fileName
     */
    function getOutputFiles(projectReference, fileName) {
        let outputFiles = outputFileNamesMap.get(fileName);
        if (!outputFiles) outputFileNamesMap.set(fileName, outputFiles = ts.getOutputFileNames(projectReference.commandLine, fileName, ignoreCase));
        return outputFiles;
    }

    /**
     *
     * @param {InliningDecision} decision
     * @param {ts.Symbol[]} keys
     */
    function cacheInliningDecision(decision, ...keys) {
        for (const key of keys) {
            inliningDecisionCache.set(key, decision);
        }
        return decision;
    }

    /**
     * @param {ModuleResolution} resolution
     * @param {readonly string[]} keys
     */
    function cacheResolution(resolution, ...keys) {
        for (const key of keys) {
            moduleResolutionCache.set(key, resolution);
        }
        moduleResolutionCache.set(resolution.source, resolution);
        for (const fileName of resolution.outputs) {
            moduleResolutionCache.set(fileName, resolution);
        }
        return resolution;
    }

    function getProjectReferences() {
        return projectReferences ??= program.getResolvedProjectReferences()?.filter(ref => !!ref) ?? [];
    }

    /**
     * @param {ts.SourceFile} sourceFile
     * @param {ModuleResolution} moduleReference
     */
    function getPinnedComments(sourceFile, moduleReference) {
        /** @type {ts.Statement | undefined} */
        let pinnedCommentHolder;
        for (const statement of sourceFile.statements) {
            ts.forEachLeadingCommentRange(sourceFile.text, statement.pos, onCommentRange);
        }
        return pinnedCommentHolder;

        /**
         * @param {number} pos
         * @param {number} end
         * @param {ts.CommentKind} kind
         * @param {boolean} hasTrailingNewLine
         */
        function onCommentRange(pos, end, kind, hasTrailingNewLine) {
            if (sourceFile.text.charAt(pos + 2) === "!") {
                const comment = sourceFile.text.slice(pos + 2, kind === ts.SyntaxKind.MultiLineCommentTrivia ? end - 2 : end);
                if (!pinnedCommentHolder) {
                    pinnedCommentHolder = factory.createNotEmittedStatement(sourceFile);
                    ts.addSyntheticLeadingComment(
                        pinnedCommentHolder,
                        ts.SyntaxKind.MultiLineCommentTrivia,
                        moduleReference.packageId ? `! the following was inlined from "${moduleReference.packageId.name}/${moduleReference.packageId.subModuleName}": ` : `! the following was inlined:`,
                        true);
                }
                ts.addSyntheticLeadingComment(pinnedCommentHolder, kind, comment, hasTrailingNewLine);
            }
        }
    }
}

/**
 * @param {ts.CustomTransformerFactory} transformer
 * @returns {ts.TransformerFactory<ts.SourceFile>}
 */
function coerceCustomTransformer(transformer) {
    return context => {
        const tx = transformer(context);
        return node => tx.transformSourceFile(node);
    };
}

/**
 * @typedef ModuleResolution
 * @property {ts.ResolvedProjectReference} projectReference
 * @property {ts.PackageId} [packageId]
 * @property {string} source
 * @property {string} generated
 * @property {readonly string[]} outputs
 * @property {Set<string>} [imports]
 * @property {boolean} [importStar]
 */

/**
 * @typedef InlineFunctionDecision
 * @property {true} inline
 * @property {(node: ts.Identifier) => ts.Expression} inliner
 */

/**
 * @typedef DoNotInlineDecision
 * @property {false} inline
 */

/**
 * @typedef {InlineFunctionDecision | DoNotInlineDecision} InliningDecision
 */