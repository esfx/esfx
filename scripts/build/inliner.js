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
const { visitNode, visitNodes, visitEachChild, getOriginalNode, getParseTreeNode } = require("typescript");
const ts = require("typescript");
const { treeShaker } = require("./treeShaker");
const { isExpressionIdentifier, isCommonJSImportStatement, isPotentiallyInlinableCallee, tryGetImportDeclarationLikeOfSymbol, getEffectiveModuleSpecifierOfImportDeclarationLike, getDeclarationOfKind, getModuleSymbol, isExternalOrCommonJsModule, cloneNode, isAssignmentTarget } = require("./utils");

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

/**
 * @param {ts.TransformationContext} context
 */
function transformModule(context) {
    const { factory } = context;
    return { transformSourceFile, transformBundle };

    /**
     * @param {ts.SourceFile} node
     */
    function transformSourceFile(node) {
        if (node.isDeclarationFile) return node;
        node = ts.visitEachChild(node, topLevelStatementVisitor, context);
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
     * @returns {ts.VisitResult<ts.Node>}
     */
    function topLevelStatementVisitor(node) {
        if (ts.isFunctionDeclaration(node)) return visitFunctionDeclaration(node);
        if (ts.isClassDeclaration(node)) return visitClassDeclaration(node);
        if (ts.isVariableDeclaration(node)) return visitVariableDeclaration(node);
        if (ts.isImportDeclaration(node)) throw new Error("Not supported");
        if (ts.isExportDeclaration(node)) throw new Error("Not supported");
        return node;
    }

    /**
     * @param {ts.Node} node
     * @returns {ts.VisitResult<ts.Node>}
     */
    function modifierVisitor(node) {
        switch (node.kind) {
            case ts.SyntaxKind.ExportKeyword:
            case ts.SyntaxKind.DefaultKeyword:
                return undefined;
            default:
                return node;
        }
    }

    /**
     * @param {ts.FunctionDeclaration} node
     */
    function visitFunctionDeclaration(node) {
        if (node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)) {
            if (node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.DefaultKeyword)) {
                throw new Error("Not supported");
            }
            if (!node.name) throw new Error();
            if (!node.body) throw new Error();
            const visited = visitEachChild(node, modifierVisitor, context);
            const exporter = factory.createPropertyAccessExpression(factory.createIdentifier("exports"), node.name);
            const exportAssignment = factory.createAssignment(exporter, node.name);
            const statement = factory.createExpressionStatement(exportAssignment);
            return [visited, statement];
        }
        return node;
    }

    /**
     * @param {ts.ClassDeclaration} node
     */
    function visitClassDeclaration(node) {
        if (node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)) {
            if (node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.DefaultKeyword)) {
                throw new Error("Not supported");
            }
            if (!node.name) throw new Error();
            const visited = visitEachChild(node, modifierVisitor, context);
            const exporter = factory.createPropertyAccessExpression(factory.createIdentifier("exports"), node.name);
            const exportAssignment = factory.createAssignment(exporter, node.name);
            const statement = factory.createExpressionStatement(exportAssignment);
            return [visited, statement];
        }
        return node;
    }

    /**
     * @param {ts.VariableDeclaration} node
     */
    function visitVariableDeclaration(node) {
        if (node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)) {
            throw new Error("Not supported");
        }
        return node;
    }
}

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

    /** @type {WeakMap<ts.SourceFile, ts.Program>} */
    const weakProgramCache = new WeakMap();

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

    /** @type {Map<ts.Symbol, FunctionInliningDecision>} */
    let functionInliningDecisionCache;

    /** @type {Map<ts.Symbol, ConstantInliningDecision>} */
    let constantInliningDecisionCache;

    for (const sourceFile of program.getSourceFiles()) {
        const original = ts.getOriginalNode(sourceFile, ts.isSourceFile);
        if (original) weakProgramCache.set(original, program);
    }

    return { transformSourceFile, transformBundle };

    /**
     * @param {ts.SourceFile} node
     */
    function transformSourceFile(node) {
        if (node.isDeclarationFile) return node;

        const saved_currentSourceFile = currentSourceFile;
        const saved_possibleStarImports = possibleStarImports;
        const saved_starImportsBySymbol = starImportsBySymbol;
        const saved_bindingImportsBySymbol = bindingImportsBySymbol;
        const saved_importUses = importUses;
        const saved_elidableImports = elidableImports;
        const saved_inlinedModules = inlinedModules;
        const saved_functionInliningDecisionCache = functionInliningDecisionCache;
        const saved_constantInliningDecisionCache = constantInliningDecisionCache;

        currentSourceFile = node;
        possibleStarImports = [];
        starImportsBySymbol = new Map();
        bindingImportsBySymbol = new Map();
        importUses = new Map();
        elidableImports = new Set();
        inlinedModules = new Map();
        functionInliningDecisionCache = new Map();
        constantInliningDecisionCache = new Map();

        collectInlinedImports(node);
        collectImportUses(node);

        node = ts.visitEachChild(node, expressionInliningVisitor, context);
        markUsedImports();
        node = ts.visitEachChild(node, topLevelStatementVisitor, context);
        node = ts.visitEachChild(node, importReferenceVisitor, context);

        currentSourceFile = saved_currentSourceFile;
        possibleStarImports = saved_possibleStarImports;
        starImportsBySymbol = saved_starImportsBySymbol;
        bindingImportsBySymbol = saved_bindingImportsBySymbol;
        importUses = saved_importUses;
        elidableImports = saved_elidableImports;
        inlinedModules = saved_inlinedModules;
        functionInliningDecisionCache = saved_functionInliningDecisionCache;
        constantInliningDecisionCache = saved_constantInliningDecisionCache;
        return node;
    }

    /**
     * @param {ts.Bundle} bundle
     */
    function transformBundle(bundle) {
        return factory.createBundle(bundle.sourceFiles.map(transformSourceFile), bundle.prepends);
    }

    /**
     * Tests whether a {@link ts.Node} is marked with an inlining comment.
     * @param {ts.Node} node
     */
    function isInlined(node) {
        return ts.forEachLeadingCommentRange(currentSourceFile.text, node.getFullStart(), (pos, end) => inlinedCommentRegExp.test(currentSourceFile.text.slice(pos, end)))
            || ts.forEachTrailingCommentRange(currentSourceFile.text, node.getFullStart(), (pos, end) => inlinedCommentRegExp.test(currentSourceFile.text.slice(pos, end)));
    }

    /**
     * Collects all of the imports marked with an inlining comment.
     * @param {ts.Node} node
     */
    function collectInlinedImports(node) {
        if (ts.isSourceFile(node)) {
            for (const stmt of node.statements) {
                collectInlinedImports(stmt);
            }
        }
        else if (ts.isImportDeclaration(node) && node.importClause && !node.importClause.isTypeOnly && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
            // ^ indicates a valid inlinable import declaration
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
    function expressionInliningVisitor(node) {
        if (ts.isCallExpression(node)) return visitCallExpression(node);
        if (ts.isIdentifier(node)) return visitIdentifier(node);
        return ts.visitEachChild(node, expressionInliningVisitor, context);
    }

    /**
     * @param {ts.CallExpression} node
     */
    function visitCallExpression(node) {
        if (ts.isIdentifier(node.expression) && node.arguments.length === 1 && ts.isIdentifier(node.arguments[0])) {
            const decision = getFunctionInliningDecision(node.expression, { inlinerStack: [], constant: false });
            if (decision.inline) {
                importUses.delete(ts.getOriginalNode(node.expression));
                return decision.inliner(node.arguments[0]);
            }
        }
        return ts.visitEachChild(node, expressionInliningVisitor, context);
    }

    /**
     * @param {ts.Expression} node
     * @param {InlinerState} state
     * @returns {FunctionInliningDecision}
     */
    function getFunctionInliningDecision(node, state) {
        /** @type {FunctionInliningDecision | undefined} */
        let decision;

        if (!isPotentiallyInlinableCallee(node)) return { inline: false };

        const checker = tryGetProgramOfNode(node)?.getTypeChecker();
        if (!checker) return { inline: false };

        const referencedSym = checker.getSymbolAtLocation(node);
        if (!referencedSym) return { inline: false };
        if (decision = functionInliningDecisionCache.get(referencedSym)) return decision;

        const sym = referencedSym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(referencedSym) : referencedSym;
        if (decision = functionInliningDecisionCache.get(sym)) return decision;

        const importLike = tryGetImportDeclarationLikeOfSymbol(referencedSym);
        if (importLike) {
            if (!elidableImports.has(ts.getOriginalNode(importLike))) return cacheFunctionInliningDecision({ inline: false }, referencedSym, sym);
        }
        else if (node.getSourceFile() !== state.contextFile) {
            return cacheFunctionInliningDecision({ inline: false }, referencedSym, sym);
        }

        let sourceFile = state.contextFile ?? currentSourceFile;
        if (sym.flags & ts.SymbolFlags.Value) {
            /** @type {ts.FunctionDeclaration | undefined} */
            let decl = getDeclarationOfKind(sym, ts.SyntaxKind.FunctionDeclaration);
            if (!decl?.body && importLike) {
                // if this is a declaration file, need to find the function in source
                const resolution = resolveModule(getEffectiveModuleSpecifierOfImportDeclarationLike(importLike));
                if (resolution) {
                    const program = getProgramForGeneratedOutput(resolution);
                    const checker = program.getTypeChecker();
                    sourceFile = program.getSourceFile(resolution.generated) ?? (() => { throw new TypeError(); })();
                    ensureExplicitSourceMapRanges(sourceFile);
                    const moduleSymbol = sourceFile && getModuleSymbol(sourceFile, checker);
                    const exportedSymbols = moduleSymbol && checker.getExportsOfModule(moduleSymbol);
                    let exportSymbol = exportedSymbols?.find(exportSymbol => exportSymbol.escapedName === sym.escapedName);
                    if (exportSymbol && exportSymbol.flags & ts.SymbolFlags.Alias) exportSymbol = checker.getAliasedSymbol(exportSymbol);
                    decl = exportSymbol && getDeclarationOfKind(exportSymbol, ts.SyntaxKind.FunctionDeclaration);
                }
            }
            if (decl?.body) {
                const inliner = tryCreateFunctionInliner(decl, { ...state, contextFile: sourceFile });
                if (inliner) return cacheFunctionInliningDecision({ inline: true, inliner }, referencedSym, sym);
            }
        }

        return cacheFunctionInliningDecision({ inline: false }, referencedSym, sym);
    }

    /**
     * @param {ts.FunctionDeclaration} decl
     * @param {InlinerState} state
     */
    function tryCreateFunctionInliner(decl, state) {
        if (decl.parameters.length !== 1) return undefined; // must have exactly one parameter
        if (decl.body?.statements.length !== 1) return undefined; // must have exactly one statement

        const parameter = decl.parameters[0];
        if (!ts.isIdentifier(parameter.name)) return undefined; // parameter name must be an identifier
        if (parameter.initializer) return undefined; // parameter cannot have an initializer
        if (parameter.dotDotDotToken) return undefined; // parameter cannot be a rest parameter
        const parameterName = parameter.name;

        const statement = decl.body.statements[0];
        if (!ts.isReturnStatement(statement) || !statement.expression) return undefined; // statement must be a return statement

        if (state.inlinerStack.lastIndexOf(decl) !== -1) return undefined;
        state.inlinerStack.push(decl);
        const placeholder = factory.createTempVariable(undefined);
        const inlined = tryInlineExpression(statement.expression, state, {
            tryInlineExpressionIdentifier(node, fallback) {
                if (identifierReferencesParameterName(node, parameterName)) return placeholder;
                return fallback?.(node);
            }
        });
        state.inlinerStack.pop();
        if (!inlined) return undefined;

        /** @type {(node: ts.Expression) => ts.Expression} */
        return node => markSynthesized(ts.visitNode(cloneNode(inlined, context), function inliner(n) {
            return ts.getOriginalNode(n) === placeholder ? node : ts.visitEachChild(n, inliner, context);
        }));
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
        /** @type {ts.Node | undefined} */
        let decl = nodeSym.valueDeclaration ?? nodeSym.declarations?.[0];
        if (!decl) return false;
        if (ts.isVariableDeclaration(decl)) decl = decl.parent;
        if (ts.isVariableDeclarationList(decl)) decl = decl.parent;
        if (!ts.isVariableStatement(decl) && !ts.isFunctionDeclaration(decl) && !ts.isClassDeclaration(decl)) return false;
        if (!ts.isSourceFile(decl.parent) || isExternalOrCommonJsModule(decl.parent)) return false;
        return true;
    }

    /**
     * @param {ts.Identifier} node
     */
    function visitIdentifier(node) {
        if (isExpressionIdentifier(node)) {
            const decision = getConstantInliningDecision(node, { inlinerStack: [], constant: true });
            if (decision.inline) {
                importUses.delete(ts.getOriginalNode(node));
                return decision.inliner();
            }
        }
        return node;
    }

    /**
     * @param {ts.Expression} node
     * @param {InlinerState} state
     * @returns {ConstantInliningDecision}
     */
    function getConstantInliningDecision(node, state) {
        /** @type {ConstantInliningDecision | undefined} */
        let decision;

        const checker = tryGetProgramOfNode(node)?.getTypeChecker();
        if (!checker) return { inline: false };

        // get the symbol referenced by this node
        const referencedSym = checker.getSymbolAtLocation(node);
        if (!referencedSym) return { inline: false };
        if (decision = constantInliningDecisionCache.get(referencedSym)) return decision;

        // if the symbol is an alias, resolve it
        const sym = referencedSym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(referencedSym) : referencedSym;
        if (decision = constantInliningDecisionCache.get(sym)) return decision;

        const importLike = tryGetImportDeclarationLikeOfSymbol(referencedSym);
        if (importLike) {
            if (!elidableImports.has(ts.getOriginalNode(importLike))) return cacheConstantInliningDecision({ inline: false }, referencedSym, sym);
        }
        else if (node.getSourceFile() !== state.contextFile) {
            return cacheConstantInliningDecision({ inline: false }, referencedSym, sym);
        }

        let sourceFile = state.contextFile ?? currentSourceFile;
        if (sym.flags & ts.SymbolFlags.Value) {
            /** @type {ts.VariableDeclaration | undefined} */
            let varDecl = getDeclarationOfKind(sym, ts.SyntaxKind.VariableDeclaration);
            let initializer = varDecl?.initializer;
            if (!varDecl) {
                /** @type {ts.PropertyAccessExpression | undefined} */
                const propDecl = getDeclarationOfKind(sym, ts.SyntaxKind.PropertyAccessExpression);
                if (propDecl && ts.isIdentifier(propDecl.expression) && ts.idText(propDecl.expression) === "exports" && isAssignmentTarget(propDecl)) {
                    const varSym = getSymbolInDeclarationOutput(sym);
                    varDecl = varSym && getDeclarationOfKind(varSym, ts.SyntaxKind.VariableDeclaration);
                    initializer = propDecl.parent.right;
                }
            }


            if (varDecl && ts.getCombinedNodeFlags(varDecl) & ts.NodeFlags.Const) {
                if (!initializer && importLike) {
                    // if this is a declaration file, need to find the constant in source
                    const resolution = resolveModule(getEffectiveModuleSpecifierOfImportDeclarationLike(importLike));
                    if (resolution) {
                        const program = getProgramForGeneratedOutput(resolution);
                        const checker = program.getTypeChecker();
                        sourceFile = program.getSourceFile(resolution.generated) ?? (() => { throw new TypeError(); })();
                        ensureExplicitSourceMapRanges(sourceFile);
                        const moduleSymbol = sourceFile && getModuleSymbol(sourceFile, checker);
                        const exportedSymbols = moduleSymbol && checker.getExportsOfModule(moduleSymbol);
                        let exportSymbol = exportedSymbols?.find(exportSymbol => exportSymbol.escapedName === sym.escapedName);
                        if (exportSymbol) {
                            if (exportSymbol.flags & ts.SymbolFlags.Alias) exportSymbol = checker.getAliasedSymbol(exportSymbol);
                            /** @type {ts.VariableDeclaration | ts.PropertyAccessExpression | undefined} */
                            const decl = getDeclarationOfKind(exportSymbol, ts.SyntaxKind.VariableDeclaration) ?? getDeclarationOfKind(exportSymbol, ts.SyntaxKind.PropertyAccessExpression);
                            if (decl) {
                                if (ts.isVariableDeclaration(decl)) {
                                    initializer = decl.initializer;
                                }
                                else if (ts.isPropertyAccessExpression(decl) &&
                                    ts.isBinaryExpression(decl.parent) &&
                                    decl.parent.left === decl &&
                                    decl.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
                                    initializer = decl.parent.right;
                                }
                            }
                        }
                    }
                }
                if (initializer) {
                    const inliner = tryCreateConstantInliner(varDecl, initializer, { ...state, contextFile: sourceFile });
                    if (inliner) return cacheConstantInliningDecision({ inline: true, inliner }, referencedSym, sym);
                }
            }
        }

        return cacheConstantInliningDecision({ inline: false }, referencedSym, sym);
    }

    /**
     * @param {ts.VariableDeclaration} decl
     * @param {ts.Expression} initializer
     * @param {InlinerState} state
     */
    function tryCreateConstantInliner(decl, initializer, state) {
        // preconditions
        if (!ts.isIdentifier(decl.name)) return undefined; // must be an identifier name
        if (!(ts.getCombinedNodeFlags(decl) & ts.NodeFlags.Const)) return undefined; // must be constant

        // recursion check
        if (state.inlinerStack.lastIndexOf(decl) !== -1) return undefined;

        // try inlining
        if (!state.constant) state = { ...state, constant: true };
        state.inlinerStack.push(decl);
        const inlined = tryInlineExpression(initializer, state);
        state.inlinerStack.pop();
        if (!inlined) return undefined;

        const name = ts.idText(decl.name);

        /** @type {() => ts.Expression} */
        return () => {
            const node = markSynthesized(cloneNode(inlined, context));
            ts.addSyntheticLeadingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, ` ${name} `);
            return node;
        };
    }

    /**
     * @param {ts.Expression} node
     * @param {InlinerState} state
     * @param {InlinerHandlers} handlers
     * @returns {ts.Expression | undefined}
     */
    function tryInlineExpression(node, state, handlers = {}) {
        return tryInlineExpression(node);

        /**
         * @param {ts.Expression} node
         * @returns {ts.Expression | undefined}
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
            if (ts.isIdentifier(node)) return tryHandler(node, handlers.tryInlineExpressionIdentifier, tryInlineExpressionIdentifier);
            if (ts.isConditionalExpression(node)) return tryHandler(node, handlers.tryInlineConditionalExpression, tryInlineConditionalExpression);
            if (ts.isBinaryExpression(node)) return tryHandler(node, handlers.tryInlineBinaryExpression, tryInlineBinaryExpression);
            if (ts.isPrefixUnaryExpression(node)) return tryHandler(node, handlers.tryInlinePrefixUnaryExpression, tryInlinePrefixUnaryExpression);
            if (ts.isPostfixUnaryExpression(node)) return tryHandler(node, handlers.tryInlinePostfixUnaryExpression);
            if (ts.isVoidExpression(node)) return tryHandler(node, handlers.tryInlineVoidExpression, tryInlineVoidExpression);
            if (ts.isDeleteExpression(node)) return tryHandler(node, handlers.tryInlineDeleteExpression, tryInlineDeleteExpression);
            if (ts.isTypeOfExpression(node)) return tryHandler(node, handlers.tryInlineTypeOfExpression, tryInlineTypeOfExpression);
            if (ts.isArrayLiteralExpression(node)) return tryHandler(node, handlers.tryInlineArrayLiteralExpression, tryInlineArrayLiteralExpression);
            if (ts.isObjectLiteralExpression(node)) return tryHandler(node, handlers.tryInlineObjectLiteralExpression, tryInlineObjectLiteralExpression);
            if (ts.isParenthesizedExpression(node)) return tryHandler(node, handlers.tryInlineParenthesizedExpression, tryInlineParenthesizedExpression);
            if (ts.isPropertyAccessExpression(node)) return tryHandler(node, handlers.tryInlinePropertyAccessExpression, tryInlinePropertyAccessExpression);
            if (ts.isElementAccessExpression(node)) return tryHandler(node, handlers.tryInlineElementAccessExpression, tryInlineElementAccessExpression);
            if (ts.isCallExpression(node)) return tryHandler(node, handlers.tryInlineCallExpression, tryInlineCallExpression);
            if (ts.isNewExpression(node)) return tryHandler(node, handlers.tryInlineNewExpression, tryInlineNewExpression);
            if (ts.isTemplateExpression(node)) return tryHandler(node, handlers.tryInlineTemplateExpression, tryInlineTemplateExpression);
            if (ts.isTaggedTemplateExpression(node)) return tryHandler(node, handlers.tryInlineTaggedTemplateExpression, tryInlineTaggedTemplateExpression);
            if (ts.isClassExpression(node)) return tryHandler(node, handlers.tryInlineClassExpression);
            if (ts.isFunctionExpression(node)) return tryHandler(node, handlers.tryInlineFunctionExpression);
            if (ts.isArrowFunction(node)) return tryHandler(node, handlers.tryInlineArrowFunction);
            return undefined;
        }

        /**
         * @param {ts.Identifier} node
         */
        function tryInlineExpressionIdentifier(node) {
            if (ts.idText(node) === "undefined") return node;
            const decision = getConstantInliningDecision(node, { ...state, constant: true, contextFile: node.getSourceFile() });
            if (decision.inline) {
                importUses.delete(ts.getOriginalNode(node));
                return decision.inliner();
            }
            if (!state.constant && identifierReferencesGlobal(node)) return node;
        }

        /**
         * @param {ts.ConditionalExpression} node
         */
        function tryInlineConditionalExpression(node) {
            const condition = tryInlineExpression(node.condition);
            const whenTrue = condition && tryInlineExpression(node.whenTrue);
            const whenFalse = whenTrue && tryInlineExpression(node.whenFalse);
            return whenFalse && factory.updateConditionalExpression(node, condition, factory.createToken(ts.SyntaxKind.QuestionToken), whenTrue, factory.createToken(ts.SyntaxKind.ColonToken), whenFalse);
        }

        /**
         * @param {ts.BinaryExpression} node
         */
        function tryInlineBinaryExpression(node) {
            if (state.constant) {
                if (node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
                    node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) {
                    return undefined;
                }
            }
            else {
                if (node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
                    (ts.isObjectLiteralExpression(node.left) ||
                    (ts.isArrayLiteralExpression(node.left)))) {
                    return undefined;
                }
            }

            const left = tryInlineExpression(node.left);
            const right = left && tryInlineExpression(node.right);
            return right && factory.updateBinaryExpression(node, left, node.operatorToken.kind, right);
        }

        /**
         * @param {ts.PrefixUnaryExpression} node
         */
        function tryInlinePrefixUnaryExpression(node) {
            switch (node.operator) {
                case ts.SyntaxKind.PlusPlusToken:
                case ts.SyntaxKind.MinusMinusToken:
                    return undefined;
            }

            const operand = tryInlineExpression(node.operand);
            return operand && factory.updatePrefixUnaryExpression(node, operand);
        }

        /**
         * @param {ts.VoidExpression} node
         */
        function tryInlineVoidExpression(node) {
            const expression = tryInlineExpression(node.expression);
            return expression && factory.updateVoidExpression(node, expression);
        }

        /**
         * @param {ts.DeleteExpression} node
         */
        function tryInlineDeleteExpression(node) {
            const expression = tryInlineExpression(node.expression);
            return expression && factory.updateDeleteExpression(node, expression);
        }

        /**
         * @param {ts.TypeOfExpression} node
         */
        function tryInlineTypeOfExpression(node) {
            const expression = tryInlineExpression(node.expression);
            return expression && factory.updateTypeOfExpression(node, expression);
        }

        /**
         * @param {ts.ArrayLiteralExpression} node
         */
        function tryInlineArrayLiteralExpression(node) {
            const elements = node.elements.map(element => {
                if (ts.isSpreadElement(element)) return tryHandler(element, handlers.tryInlineSpreadElement, tryInlineSpreadElement);
                return tryInlineExpression(element);
            });
            return elements.every(isDefined) ? factory.updateArrayLiteralExpression(node, elements) : undefined;
        }

        /**
         * @param {ts.ObjectLiteralExpression} node
         */
        function tryInlineObjectLiteralExpression(node) {
            const properties = node.properties.map(prop => {
                if (ts.isPropertyAssignment(prop)) return tryHandler(prop, handlers.tryInlinePropertyAssignment, tryInlinePropertyAssignment);
                if (ts.isShorthandPropertyAssignment(prop)) return tryHandler(prop, handlers.tryInlineShorthandPropertyAssignment, tryInlineShorthandPropertyAssignment);
                if (ts.isSpreadAssignment(prop)) return tryHandler(prop, handlers.tryInlineSpreadAssignment, tryInlineSpreadAssignment);
                if (ts.isMethodDeclaration(prop)) return tryHandler(prop, handlers.tryInlineObjectMethodDeclaration);
                if (ts.isGetAccessor(prop)) return tryHandler(prop, handlers.tryInlineObjectGetAccessorDeclaration);
                if (ts.isSetAccessor(prop)) return tryHandler(prop, handlers.tryInlineObjectSetAccessorDeclaration);
            });
            return properties.every(isDefined) ? factory.updateObjectLiteralExpression(node, properties) : undefined;
        }

        /**
         * @param {ts.ParenthesizedExpression} node
         */
        function tryInlineParenthesizedExpression(node) {
            const expression = tryInlineExpression(node.expression);
            return expression && factory.updateParenthesizedExpression(node, expression);
        }

        /**
         * @param {ts.PropertyAccessExpression} node
         */
        function tryInlinePropertyAccessExpression(node) {
            if (ts.isIdentifier(node.expression) && ts.idText(node.expression) === "exports" && !isAssignmentTarget(node)) {
                const decision = getConstantInliningDecision(node, { ...state, constant: true, contextFile: node.getSourceFile() });
                if (decision.inline) {
                    importUses.delete(ts.getOriginalNode(node));
                    return decision.inliner();
                }
            }

            const expression = tryInlineExpression(node.expression);
            return expression && factory.updatePropertyAccessExpression(node, expression, node.name);
        }

        /**
         * @param {ts.ElementAccessExpression} node
         */
        function tryInlineElementAccessExpression(node) {
            const expression = tryInlineExpression(node.expression);
            const argumentExpression = expression && tryInlineExpression(node.argumentExpression);
            return argumentExpression && factory.updateElementAccessExpression(node, expression, argumentExpression);
        }

        /**
         * @param {ts.CallExpression} node
         */
        function tryInlineCallExpression(node) {
            if (ts.isIdentifier(node.expression) && node.arguments.length === 1) {
                const decision = getFunctionInliningDecision(node.expression, { ...state, contextFile: node.getSourceFile() });
                if (decision.inline) {
                    const argument = tryInlineExpression(node.arguments[0]);
                    if (!argument) return undefined;
                    importUses.delete(ts.getOriginalNode(node.expression));
                    return decision.inliner(argument);
                }
            }
            const expression = tryInlineExpression(node.expression);
            const argumentList = expression && node.arguments.map(tryInlineExpression);
            return expression && argumentList?.every(isDefined) ? factory.updateCallExpression(node, expression, undefined, argumentList) : undefined;
        }

        /**
         * @param {ts.NewExpression} node
         */
        function tryInlineNewExpression(node) {
            const expression = tryInlineExpression(node.expression);
            if (!node.arguments) return expression && factory.updateNewExpression(node, expression, undefined, undefined);
            const argumentList = expression && node.arguments.map(tryInlineExpression);
            return expression && argumentList?.every(isDefined) ? factory.updateNewExpression(node, expression, undefined, argumentList) : undefined;
        }

        /**
         * @param {ts.TemplateExpression} node
         */
        function tryInlineTemplateExpression(node) {
            const templateSpans = node.templateSpans.map(span => {
                const expression = tryInlineExpression(span.expression);
                return expression && factory.updateTemplateSpan(span, expression, span.literal);
            });
            return templateSpans.every(isDefined) ? factory.updateTemplateExpression(node, node.head, templateSpans) : undefined;
        }

        /**
         * @param {ts.TaggedTemplateExpression} node
         */
        function tryInlineTaggedTemplateExpression(node) {
            const tag = tryInlineExpression(node.tag);
            const template = tag && tryInlineExpression(node.template);
            return tag && template && ts.isTemplateLiteral(template) ? factory.updateTaggedTemplateExpression(node, tag, undefined, template) : undefined;
        }

        /**
         * @param {ts.SpreadElement} node
         */
        function tryInlineSpreadElement(node) {
            const expression = tryInlineExpression(node.expression);
            return expression && factory.updateSpreadElement(node, expression);
        }

        /**
         * @param {ts.PropertyAssignment} prop
         */
        function tryInlinePropertyAssignment(prop) {
            let name = prop.name;
            if (ts.isComputedPropertyName(name)) {
                const expression = tryInlineExpression(name.expression);
                if (!expression) return undefined;
                name = factory.updateComputedPropertyName(name, expression);
            }
            const initializer = tryInlineExpression(prop.initializer);
            return initializer && factory.updatePropertyAssignment(prop, name, initializer);
        }

        /**
         * @param {ts.ShorthandPropertyAssignment} prop
         */
        function tryInlineShorthandPropertyAssignment(prop) {
            const name = tryInlineExpression(prop.name);
            return name && ts.isIdentifier(name) ? factory.updateShorthandPropertyAssignment(prop, name, undefined) : undefined;
        }

        /**
         * @param {ts.SpreadAssignment} prop
         */
        function tryInlineSpreadAssignment(prop) {
            const expression = tryInlineExpression(prop.expression);
            return expression && factory.updateSpreadAssignment(prop, expression);
        }

        /**
         * @template {TBase} T
         * @template {ts.Node} TBase
         * @param {T} node
         * @param {InlinerHandler<T, TBase> | undefined} handler
         * @param {(node: T) => TBase | undefined} [fallback]
         */
        function tryHandler(node, handler, fallback) {
            return handler ? handler(node, fallback, tryInlineExpression) : fallback?.(node);
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
     * @param {ts.Node} node
     * @returns {ts.VisitResult<ts.Node>}
     */
    function importReferenceVisitor(node) {
        if (ts.isIdentifier(node)) {
            return tryTransformImportReference(node, /*forInvocation*/ false) ?? node;
        }
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
            const importReference = tryTransformImportReference(node.expression, /*forInvocation*/ true);
            if (importReference) {
                const argumentsArray = visitNodes(node.arguments, importReferenceVisitor);
                return factory.updateCallExpression(node, importReference, undefined, argumentsArray);
            }
        }
        else if (ts.isTaggedTemplateExpression(node) && ts.isIdentifier(node.tag)) {
            const importReference = tryTransformImportReference(node.tag, /*forInvocation*/ true);
            if (importReference) {
                const template = ts.visitNode(node.template, importReferenceVisitor);
                return factory.updateTaggedTemplateExpression(node, importReference, undefined, template);
            }
        }
        return visitEachChild(node, importReferenceVisitor, context);
    }

    /**
     * @param {ts.Identifier} node
     * @param {boolean} forInvocation
     */
    function tryTransformImportReference(node, forInvocation) {
        const original = getParseTreeNode(node, ts.isIdentifier);
        if (original && isExpressionIdentifier(original)) {
            const program = tryGetProgramOfNode(node);
            const checker = program?.getTypeChecker();
            const referencedSym = checker?.getSymbolAtLocation(node);
            const importLike = referencedSym && tryGetImportDeclarationLikeOfSymbol(referencedSym);
            if (importLike && elidableImports.has(ts.getOriginalNode(importLike))) {
                const moduleSpecifier = getModuleSpecifierOfImportLike(importLike);
                const moduleReference = typeof moduleSpecifier === "string" ? resolveModule(moduleSpecifier) : undefined;
                const id = moduleReference && inlinedModules.get(moduleReference.source);
                if (id !== null && id !== undefined) {
                    const importReference = factory.createPropertyAccessExpression(id, node);
                    return forInvocation ? factory.createComma(factory.createNumericLiteral(0), importReference) :
                        importReference;
                }
            }
        }
    }

    /**
     * @param {ts.ImportDeclaration | import("./utils").CommonJSImportStatement} node
     */
    function getModuleSpecifierOfImportLike(node) {
        if (ts.isImportDeclaration(node)) {
            if (ts.isStringLiteral(node.moduleSpecifier)) {
                return node.moduleSpecifier.text;
            }
        }
        else {
            return node.declarationList.declarations[0].initializer.arguments[0].text;
        }
    }

    /**
     * @param {ts.ImportDeclaration} node
     */
    function visitImportDeclaration(node) {
        if (!elidableImports.has(ts.getOriginalNode(node)) || !ts.isStringLiteral(node.moduleSpecifier) || !node.importClause) return node;
        const importClause = node.importClause;
        const moduleSpecifier = getModuleSpecifierOfImportLike(node) ?? fail();
        const result = inlineImport(
            moduleSpecifier,
            () => importClause.namedBindings && ts.isNamespaceImport(importClause.namedBindings) ?
                factory.createIdentifier(ts.idText(importClause.namedBindings.name)) :
                factory.getGeneratedNameForNode(node),
            () => factory.createIdentifier(ts.idText(checkDefined(importClause.name))),
            !!importClause.namedBindings,
            !!importClause.name
        );
        return result;
    }

    /**
     * @param {import("./utils").CommonJSImportStatement} node
     */
    function visitCommonJSImportStatement(node) {
        if (!elidableImports.has(ts.getOriginalNode(node))) return node;
        const moduleSpecifier = getModuleSpecifierOfImportLike(node) ?? fail();
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
            const inlinedProgram = createProgram({
                rootNames: [inlinedFile],
                options: {
                    ...moduleReference.projectReference.commandLine.options,
                    module: ts.ModuleKind.CommonJS,
                    allowJs: true
                },
                projectReferences: moduleReference.projectReference.commandLine.projectReferences
            });
            inlinedProgram.getTypeChecker();

            let inlinedSourceFile = inlinedProgram.getSourceFile(inlinedFile);
            if (!inlinedSourceFile) {
                if (!moduleReference.importStar && !moduleReference.imports?.size) {
                    return;
                }

                console.log("Could not determine source file to inline.");
                return;
            }

            ensureExplicitSourceMapRanges(inlinedSourceFile);

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
            inlinedSourceFile = ts.transform(inlinedSourceFile, [
                coerceCustomTransformer(createInliner(inlinedProgram, "all")),
                coerceCustomTransformer(transformModule)
            ]).transformed[0];

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
     * @param {ts.Symbol} sym
     */
    function getSymbolModuleResolution(sym) {
        for (const decl of sym.declarations ?? []) {
            const sourceFile = decl.getSourceFile();
            const module = moduleResolutionCache.get(sourceFile.fileName);
            if (module) return module;
        }
    }

    /**
     * @param {ts.Symbol} sym
     */
    function getSymbolInGeneratedOutput(sym) {
        const resolution = getSymbolModuleResolution(sym);
        if (resolution) {
            const program = getProgramForGeneratedOutput(resolution);
            const checker = program.getTypeChecker();
            const sourceFile = program.getSourceFile(resolution.generated);
            const moduleSymbol = sourceFile && getModuleSymbol(sourceFile, checker);
            const exportedSymbols = moduleSymbol && checker.getExportsOfModule(moduleSymbol);
            return exportedSymbols?.find(exportSymbol => exportSymbol.escapedName === sym.escapedName);
        }
    }

    /**
     * @param {ts.Symbol} sym
     */
    function getSymbolInDeclarationOutput(sym) {
        const resolution = getSymbolModuleResolution(sym);
        if (resolution?.declaration) {
            const program = getProgramForDeclarationOutput(resolution);
            const checker = program?.getTypeChecker();
            const sourceFile = program?.getSourceFile(resolution.declaration);
            const moduleSymbol = sourceFile && checker && getModuleSymbol(sourceFile, checker);
            const exportedSymbols = moduleSymbol && checker?.getExportsOfModule(moduleSymbol);
            return exportedSymbols?.find(exportSymbol => exportSymbol.escapedName === sym.escapedName);
        }
    }

    /**
     * @param {ModuleResolution} moduleReference
     */
    function getProgramForGeneratedOutput(moduleReference) {
        return moduleReference.generatedProgram ??= createProgram({
            rootNames: [moduleReference.generated],
            options: { ...moduleReference.projectReference.commandLine.options, allowJs: true },
            projectReferences: moduleReference.projectReference.commandLine.projectReferences
        });
    }

    /**
     * @param {ModuleResolution} moduleReference
     */
    function getProgramForDeclarationOutput(moduleReference) {
        if (!moduleReference.declaration) return;
        return moduleReference.declarationProgram ??= createProgram({
            rootNames: [moduleReference.declaration],
            options: { ...moduleReference.projectReference.commandLine.options },
            projectReferences: moduleReference.projectReference.commandLine.projectReferences
        });
    }

    /**
     * @template {ts.Node} T
     * @param {T} node
     * @param {object} options
     * @param {ts.SourceMapSource} [options.source]
     * @param {boolean} [options.clearParent]
     * @param {boolean} [options.clearOriginal]
     */
    function markSynthesized(node, { clearParent = true, clearOriginal = true } = {}) {
        ts.forEachChild(node, function markSynthesized(node) {
            // @ts-ignore
            node.flags |= ts.NodeFlags.Synthesized, node.pos = -1, node.end = -1;
            // @ts-ignore
            if (clearParent) node.parent = undefined;
            // @ts-ignore
            if (clearOriginal) node.original = undefined;
            if (!ts.isNotEmittedStatement(node)) {
                ts.setEmitFlags(node, ts.EmitFlags.NoComments);
            }
            ts.forEachChild(node, markSynthesized);
        });
        return node;
    }

    /**
     * @param {ts.SourceFile} sourceFile
     */
    function ensureExplicitSourceMapRanges(sourceFile) {
        ts.forEachChild(sourceFile, function ensure(node) {
            if (ts.getSourceMapRange(node) === node && node.pos !== node.end && node.pos >= 0 && node.end >= 0) {
                ts.setSourceMapRange(node, { pos: node.pos, end: node.end, source: sourceFile });
            }
            ts.forEachChild(node, ensure);
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
                if (resolution = projectReference && moduleReference.packageId && findInputsAndOutputs(projectReference, resolvedFileName, moduleReference.packageId)) {
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
            const declaration = outputs.find(file => file.endsWith(".d.ts"));
            if (generated) {
                return { projectReference, source, generated, declaration, outputs, packageId };
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
     * @param {FunctionInliningDecision} decision
     * @param {ts.Symbol[]} keys
     */
    function cacheFunctionInliningDecision(decision, ...keys) {
        for (const key of keys) {
            functionInliningDecisionCache.set(key, decision);
        }
        return decision;
    }

    /**
     *
     * @param {ConstantInliningDecision} decision
     * @param {ts.Symbol[]} keys
     */
    function cacheConstantInliningDecision(decision, ...keys) {
        for (const key of keys) {
            constantInliningDecisionCache.set(key, decision);
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
        return projectReferences ??= program.getResolvedProjectReferences()?.filter(isDefined) ?? [];
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
                        moduleReference.packageId ? `! The following comments were added due to code inlined from "${moduleReference.packageId.name}": ` : `! The following comments were added due to inlined code:`,
                        true);
                }
                ts.addSyntheticLeadingComment(pinnedCommentHolder, kind, comment, hasTrailingNewLine);
            }
        }
    }

    /**
     * @param {ts.CreateProgramOptions} options
     */
    function createProgram(options) {
        const program = ts.createProgram(options);
        for (const sourceFile of program.getSourceFiles()) {
            const original = ts.getOriginalNode(sourceFile, ts.isSourceFile);
            if (original) weakProgramCache.set(original, program);
        }
        return program;
    }

    /**
     * @param {ts.Node} node
     */
    function tryGetProgramOfNode(node) {
        const sourceFile = ts.getOriginalNode(node).getSourceFile();
        const original = sourceFile && ts.getOriginalNode(sourceFile, ts.isSourceFile);
        return original && weakProgramCache.get(original);
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
 * @template T
 * @param {T} value
 * @returns {value is NonNullable<T>}
 */
function isDefined(value) {
    return value !== null && value !== undefined;
}

/**
 * @template T
 * @param {T} value
 * @returns {NonNullable<T>}
 */
function checkDefined(value) {
    return isDefined(value) ? value : fail(new TypeError());
}

/** @returns {never} */
function fail(error = new TypeError()) { throw error; }

/**
 * @typedef ModuleResolution
 * @property {ts.ResolvedProjectReference} projectReference
 * @property {ts.PackageId} [packageId]
 * @property {string} source
 * @property {string} generated
 * @property {string} [declaration]
 * @property {readonly string[]} outputs
 * @property {Set<string>} [imports]
 * @property {boolean} [importStar]
 * @property {ts.Program} [sourceProgram]
 * @property {ts.Program} [generatedProgram]
 * @property {ts.Program} [declarationProgram]
 */

/**
 * @typedef {{ readonly contextFile?: ts.SourceFile, readonly inlinerStack: ts.Node[], readonly constant: boolean }} InlinerState
 */

/**
 * @typedef InlineFunctionDecision
 * @property {true} inline
 * @property {(node: ts.Expression) => ts.Expression} inliner
 */

/**
 * @typedef InlineConstantDecision
 * @property {true} inline
 * @property {() => ts.Expression} inliner
 */

/**
 * @typedef InlineImportDecision
 * @property {true} inline
 * @property {(node: ts.Identifier) => ts.Expression} inliner
 */

/**
 * @typedef DoNotInlineDecision
 * @property {false} inline
 */

/**
 * @typedef {InlineFunctionDecision | DoNotInlineDecision} FunctionInliningDecision
 */

/**
 * @typedef {InlineConstantDecision | DoNotInlineDecision} ConstantInliningDecision
 */

/**
 * @typedef {InlineImportDecision | DoNotInlineDecision} ImportInliningDecision
 */

/**
 * @template {TBase} T
 * @template {ts.Node} TBase
 * @typedef {(node: T, fallback: ((node: T) => TBase | undefined) | undefined, inliner: (node: ts.Expression) => ts.Expression | undefined) => TBase | undefined} InlinerHandler
 */

/**
 * @typedef InlinerHandlers
 * @property {InlinerHandler<ts.Identifier, ts.Expression>} [tryInlineExpressionIdentifier]
 * @property {InlinerHandler<ts.ConditionalExpression, ts.Expression>} [tryInlineConditionalExpression]
 * @property {InlinerHandler<ts.BinaryExpression, ts.Expression>} [tryInlineBinaryExpression]
 * @property {InlinerHandler<ts.PrefixUnaryExpression, ts.Expression>} [tryInlinePrefixUnaryExpression]
 * @property {InlinerHandler<ts.PostfixUnaryExpression, ts.Expression>} [tryInlinePostfixUnaryExpression]
 * @property {InlinerHandler<ts.VoidExpression, ts.Expression>} [tryInlineVoidExpression]
 * @property {InlinerHandler<ts.DeleteExpression, ts.Expression>} [tryInlineDeleteExpression]
 * @property {InlinerHandler<ts.TypeOfExpression, ts.Expression>} [tryInlineTypeOfExpression]
 * @property {InlinerHandler<ts.ArrayLiteralExpression, ts.Expression>} [tryInlineArrayLiteralExpression]
 * @property {InlinerHandler<ts.ObjectLiteralExpression, ts.Expression>} [tryInlineObjectLiteralExpression]
 * @property {InlinerHandler<ts.ParenthesizedExpression, ts.Expression>} [tryInlineParenthesizedExpression]
 * @property {InlinerHandler<ts.PropertyAccessExpression, ts.Expression>} [tryInlinePropertyAccessExpression]
 * @property {InlinerHandler<ts.ElementAccessExpression, ts.Expression>} [tryInlineElementAccessExpression]
 * @property {InlinerHandler<ts.CallExpression, ts.Expression>} [tryInlineCallExpression]
 * @property {InlinerHandler<ts.NewExpression, ts.Expression>} [tryInlineNewExpression]
 * @property {InlinerHandler<ts.TemplateExpression, ts.Expression>} [tryInlineTemplateExpression]
 * @property {InlinerHandler<ts.TaggedTemplateExpression, ts.Expression>} [tryInlineTaggedTemplateExpression]
 * @property {InlinerHandler<ts.ClassExpression, ts.Expression>} [tryInlineClassExpression]
 * @property {InlinerHandler<ts.FunctionExpression, ts.Expression>} [tryInlineFunctionExpression]
 * @property {InlinerHandler<ts.ArrowFunction, ts.Expression>} [tryInlineArrowFunction]
 * @property {InlinerHandler<ts.SpreadElement, ts.Expression>} [tryInlineSpreadElement]
 * @property {InlinerHandler<ts.PropertyAssignment, ts.ObjectLiteralElementLike>} [tryInlinePropertyAssignment]
 * @property {InlinerHandler<ts.ShorthandPropertyAssignment, ts.ObjectLiteralElementLike>} [tryInlineShorthandPropertyAssignment]
 * @property {InlinerHandler<ts.SpreadAssignment, ts.ObjectLiteralElementLike>} [tryInlineSpreadAssignment]
 * @property {InlinerHandler<ts.MethodDeclaration, ts.ObjectLiteralElementLike>} [tryInlineObjectMethodDeclaration]
 * @property {InlinerHandler<ts.GetAccessorDeclaration, ts.ObjectLiteralElementLike>} [tryInlineObjectGetAccessorDeclaration]
 * @property {InlinerHandler<ts.SetAccessorDeclaration, ts.ObjectLiteralElementLike>} [tryInlineObjectSetAccessorDeclaration]
 * @property {InlinerHandler<ts.ConstructorDeclaration, ts.ClassElement>} [tryInlineConstructorDeclaration]
 * @property {InlinerHandler<ts.ClassStaticBlockDeclaration, ts.ClassElement>} [tryInlineClassStaticBlockDeclaration]
 * @property {InlinerHandler<ts.PropertyDeclaration, ts.ClassElement>} [tryInlinePropertyDeclaration]
 * @property {InlinerHandler<ts.MethodDeclaration, ts.ClassElement>} [tryInlineClassMethodDeclaration]
 * @property {InlinerHandler<ts.GetAccessorDeclaration, ts.ClassElement>} [tryInlineClassGetAccessorDeclaration]
 * @property {InlinerHandler<ts.SetAccessorDeclaration, ts.ClassElement>} [tryInlineClassSetAccessorDeclaration]
 */