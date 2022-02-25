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

    /** @type {Set<ts.Node>} */
    let elidableImports;

    /** @type {Map<string, ts.Identifier>} */
    let inlinedModules;

    return { transformSourceFile, transformBundle };

    /**
     * @param {ts.SourceFile} node
     */
    function transformSourceFile(node) {
        if (node.isDeclarationFile) return node;

        currentSourceFile = node;
        possibleStarImports = [];
        starImportsBySymbol = new Map();
        elidableImports = new Set();
        inlinedModules = new Map();

        collectInlinedImports(node);

        if (possibleStarImports.length) {
            collectStarImportUses(node);
        }

        if (elidableImports.size) {
            node = ts.visitEachChild(node, visitor, context);
        }

        currentSourceFile = undefined;
        possibleStarImports = undefined;
        starImportsBySymbol = undefined;
        elidableImports = undefined;
        inlinedModules = undefined;
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
                elidableImports.add(node);
            }
        }
        else if (isCommonJSImportStatement(node)) {
            if (mode === "all" || isInlined(node) || isInlined(node.declarationList)) {
                const moduleSpecifier = node.declarationList.declarations[0].initializer.arguments[0].text;
                const moduleReference = resolveModule(moduleSpecifier);
                if (!moduleReference) return;

                collectInlinedImportsOfCommonJSImportStatement(node.declarationList.declarations[0].name, moduleReference);
                elidableImports.add(node);
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
                if (sym) {
                    starImportsBySymbol.set(sym, moduleReference);
                    starImportsBySymbol.set(checker.getExportSymbolOfSymbol(sym), moduleReference);
                }
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

            moduleReference.imports ??= new Set();
            moduleReference.imports.add(importedName);
        }
    }

    /**
     * @param {ts.Node} node
     */
    function collectStarImportUses(node) {
        ts.forEachChild(node, collectStarImportUses);
        if (!ts.isIdentifier(node) || !isExpressionIdentifier(node)) return;

        const sym = checker.getSymbolAtLocation(node);
        if (!sym) return;

        const match = starImportsBySymbol.get(sym) ?? starImportsBySymbol.get(checker.getExportSymbolOfSymbol(sym));
        if (!match) return;

        if (ts.isPropertyAccessExpression(node.parent) && ts.isIdentifier(node.parent.name)) {
            match.imports ??= new Set();
            match.imports.add(ts.idText(node.parent.name));
            return;
        }
        if (ts.isElementAccessExpression(node.parent)) {
            if (ts.isStringLiteral(node.parent.argumentExpression)) {
                match.imports ??= new Set();
                match.imports.add(node.parent.argumentExpression.text);
                return;
            }
        }
        match.importStar = true;
    }

    /**
     * @param {ts.Node} node
     * @returns {ts.VisitResult<ts.Node>}
     */
    function visitor(node) {
        if (ts.isImportDeclaration(node)) return visitImportDeclaration(node);
        if (isCommonJSImportStatement(node)) return visitCommonJSImportStatement(node);
        return node;
    }

    /**
     * @param {ts.ImportDeclaration} node
     */
    function visitImportDeclaration(node) {
        if (!elidableImports.has(node) || !ts.isStringLiteral(node.moduleSpecifier)) return node;
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
        if (!result) {
            console.log("Could not determine source file to inline.");
        }
        return result;
    }

    /**
     * @param {import("./utils").CommonJSImportStatement} node 
     */
    function visitCommonJSImportStatement(node) {
        if (!elidableImports.has(node)) return node;
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
        if (!result) {
            console.log("Could not determine source file to inline.");
        }
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
        if (resolvedModuleIdentifier) {
            id = resolvedModuleIdentifier;
            if (hasNamespaceImport) {
                id = getNamespaceImportName();
                variables.push(factory.createVariableDeclaration(id, undefined, undefined, resolvedModuleIdentifier));
            }
        }
        else {
            const inlinedFile = moduleReference.generated;
            if (!inlinedFile) {
                console.log("Could not determine source file to inline.");
                return;
            }

            const inlinedProgram = ts.createProgram({
                rootNames: [inlinedFile],
                options: { ...moduleReference.projectReference.commandLine.options, allowJs: true },
                projectReferences: moduleReference.projectReference.commandLine.projectReferences
            });

            let inlinedSourceFile = inlinedProgram.getSourceFile(inlinedFile);
            if (!inlinedSourceFile) {
                console.log("Could not determine source file to inline.");
                return;
            }

            // copy any pinned comments of the inlined file
            const pinnedCommentHolder = getPinnedComments(inlinedSourceFile);

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
                if (resolution = findInputsAndOutputs(projectReference, resolvedFileName)) {
                    return cacheResolution(resolution, ...cacheKeys);
                }
            }
        }

        console.log("failed to resolve module reference for", moduleSpecifier);
    }

    /**
     * @param {ts.ResolvedProjectReference} projectReference
     * @param {string} fileName
     * @returns {ModuleResolution | undefined}
     */
    function findInputsAndOutputs(projectReference, fileName) {
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
                return { projectReference, source, generated, outputs };
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
     * @param {readonly string[]} keys
     * @param {ModuleResolution} resolution
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
     */
    function getPinnedComments(sourceFile) {
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
                pinnedCommentHolder ??= factory.createNotEmittedStatement(sourceFile);
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
 * @property {string} source
 * @property {string} generated
 * @property {readonly string[]} outputs
 * @property {Set<string>} [imports]
 * @property {boolean} [importStar]
 */
