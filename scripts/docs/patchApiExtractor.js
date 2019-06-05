// @ts-check
const { AstSymbolTable } = require("@microsoft/api-extractor/lib/analyzer/AstSymbolTable");
const { AstDeclaration } = require("@microsoft/api-extractor/lib/analyzer/AstDeclaration");
const { AstSymbol } = require("@microsoft/api-extractor/lib/analyzer/AstSymbol");
const { ExportAnalyzer } = require("@microsoft/api-extractor/lib/analyzer/ExportAnalyzer");
const { TypeScriptMessageFormatter } = require("@microsoft/api-extractor/lib/analyzer/TypeScriptMessageFormatter");
const { TypeScriptHelpers } = require("@microsoft/api-extractor/lib/analyzer/TypeScriptHelpers");
const { TypeScriptInternals } = require("@microsoft/api-extractor/lib/analyzer/TypeScriptInternals");
const { InternalError } = require("@microsoft/node-core-library");
const ts = require("typescript");

// @ts-ignore
if (!(TypeScriptHelpers._wellKnownSymbolNameRegExp)) {
    console.log("Patching '@microsoft/api-extractor' with https://github.com/microsoft/web-build-tools/pull/1305");
    // https://github.com/microsoft/web-build-tools/pull/1305/files#diff-4a383fa702c38facbf40cc9bbd0cf0dfR307
    // @ts-ignore
    AstSymbolTable.prototype._fetchAstDeclaration = function(node, isExternal) {
        if (!AstDeclaration.isSupportedSyntaxKind(node.kind)) {
            return undefined;
        }
        // @ts-ignore
        const symbol = TypeScriptHelpers.getSymbolForDeclaration(node, this._typeChecker);
        if (!symbol) {
            throw new InternalError('Unable to find symbol for node');
        }
        // @ts-ignore
        const astSymbol = this._fetchAstSymbol({
            followedSymbol: symbol,
            isExternal: isExternal,
            includeNominalAnalysis: true,
            addIfMissing: true
        });
        if (!astSymbol) {
            return undefined;
        }
        // @ts-ignore
        const astDeclaration = this._astDeclarationsByDeclaration.get(node);
        if (!astDeclaration) {
            throw new InternalError('Unable to find constructed AstDeclaration');
        }
        return astDeclaration;
    };

    // https://github.com/microsoft/web-build-tools/pull/1305/files#diff-4a383fa702c38facbf40cc9bbd0cf0dfR344
    // https://github.com/microsoft/web-build-tools/pull/1305/files#diff-4a383fa702c38facbf40cc9bbd0cf0dfR412
    // https://github.com/microsoft/web-build-tools/pull/1305/files#diff-4a383fa702c38facbf40cc9bbd0cf0dfR435
    // @ts-ignore
    AstSymbolTable.prototype._fetchAstSymbol = function(options) {
        const followedSymbol = options.followedSymbol;
        // Filter out symbols representing constructs that we don't care about
        if (!TypeScriptHelpers.hasAnyDeclarations(followedSymbol)) {
            return undefined;
        }
        const arbitraryDeclaration = followedSymbol.declarations[0];
        // tslint:disable-next-line:no-bitwise
        if (followedSymbol.flags & (ts.SymbolFlags.TypeParameter | ts.SymbolFlags.TypeLiteral | ts.SymbolFlags.Transient)
            // @ts-ignore
            && !TypeScriptInternals.isLateBoundSymbol(followedSymbol)) {
            return undefined;
        }
        // API Extractor doesn't analyze ambient declarations at all
        // @ts-ignore
        if (TypeScriptHelpers.isAmbient(followedSymbol, this._typeChecker)) {
            // We make a special exemption for ambient declarations that appear in a source file containing
            // an "export=" declaration that allows them to be imported as non-ambient.
            // @ts-ignore
            if (!this._exportAnalyzer.isImportableAmbientSourceFile(arbitraryDeclaration.getSourceFile())) {
                return undefined;
            }
        }
        // Make sure followedSymbol isn't an alias for something else
        // @ts-ignore
        if (TypeScriptHelpers.isFollowableAlias(followedSymbol, this._typeChecker)) {
            // We expect the caller to have already followed any aliases
            throw new InternalError('AstSymbolTable._fetchAstSymbol() cannot be called with a symbol alias');
        }
        // @ts-ignore
        let astSymbol = this._astSymbolsBySymbol.get(followedSymbol);
        if (!astSymbol) {
            // None of the above lookups worked, so create a new entry...
            let nominalAnalysis = false;
            if (options.isExternal) {
                // If the file is from an external package that does not support AEDoc, normally we ignore it completely.
                // But in some cases (e.g. checking star exports of an external package) we need an AstSymbol to
                // represent it, but we don't need to analyze its sibling/children.
                const followedSymbolSourceFileName = arbitraryDeclaration.getSourceFile().fileName;
                // @ts-ignore
                if (!this._packageMetadataManager.isAedocSupportedFor(followedSymbolSourceFileName)) {
                    nominalAnalysis = true;
                    if (!options.includeNominalAnalysis) {
                        return undefined;
                    }
                }
            }
            let parentAstSymbol = undefined;
            if (!nominalAnalysis) {
                for (const declaration of followedSymbol.declarations || []) {
                    if (!AstDeclaration.isSupportedSyntaxKind(declaration.kind)) {
                        throw new InternalError(`The "${followedSymbol.name}" symbol has a`
                            + ` ts.SyntaxKind.${ts.SyntaxKind[declaration.kind]} declaration which is not (yet?)`
                            + ` supported by API Extractor`);
                    }
                }
                // We always fetch the entire chain of parents for each declaration.
                // (Children/siblings are only analyzed on demand.)
                // Key assumptions behind this squirrely logic:
                //
                // IF a given symbol has two declarations D1 and D2; AND
                // If D1 has a parent P1, then
                // - D2 will also have a parent P2; AND
                // - P1 and P2's symbol will be the same
                // - but P1 and P2 may be different (e.g. merged namespaces containing merged interfaces)
                // Is there a parent AstSymbol?  First we check to see if there is a parent declaration:
                // @ts-ignore
                const arbitraryParentDeclaration = this._tryFindFirstAstDeclarationParent(followedSymbol.declarations[0]);
                if (arbitraryParentDeclaration) {
                    // @ts-ignore
                    const parentSymbol = TypeScriptHelpers.getSymbolForDeclaration(arbitraryParentDeclaration, this._typeChecker);
                    // @ts-ignore
                    parentAstSymbol = this._fetchAstSymbol({
                        followedSymbol: parentSymbol,
                        isExternal: options.isExternal,
                        includeNominalAnalysis: false,
                        addIfMissing: true
                    });
                    if (!parentAstSymbol) {
                        throw new InternalError('Unable to construct a parent AstSymbol for '
                            + followedSymbol.name);
                    }
                }
            }
            let localName = options.localName;
            if (localName === undefined) {
                // We will try to obtain the name from a declaration; otherwise we'll fall back to the symbol name
                // This handles cases such as "export default class X { }" where the symbol name is "default"
                // but the declaration name is "X".
                localName = followedSymbol.name;
                // @ts-ignore
                if (TypeScriptHelpers.isWellKnownSymbolName(localName)) {
                    // TypeScript binds well-known ECMAScript symbols like "Symbol.iterator" as "__@iterator".
                    // This converts a string like "__@iterator" into the property name "[Symbol.iterator]".
                    localName = `[Symbol.${localName.slice(3)}]`;
                }
                else {
                    // @ts-ignore
                    const isUniqueSymbol = TypeScriptHelpers.isUniqueSymbolName(localName);
                    for (const declaration of followedSymbol.declarations || []) {
                        const declarationName = ts.getNameOfDeclaration(declaration);
                        if (declarationName && ts.isIdentifier(declarationName)) {
                            localName = declarationName.getText().trim();
                            break;
                        }
                        if (isUniqueSymbol && declarationName && ts.isComputedPropertyName(declarationName)) {
                            // @ts-ignore
                            const lateBoundName = TypeScriptHelpers.tryGetLateBoundName(declarationName);
                            if (lateBoundName) {
                                localName = lateBoundName;
                                break;
                            }
                        }
                    }
                }
            }
            astSymbol = new AstSymbol({
                followedSymbol: followedSymbol,
                localName: localName,
                isExternal: options.isExternal,
                nominalAnalysis: nominalAnalysis,
                parentAstSymbol: parentAstSymbol,
                rootAstSymbol: parentAstSymbol ? parentAstSymbol.rootAstSymbol : undefined
            });
            // @ts-ignore
            this._astSymbolsBySymbol.set(followedSymbol, astSymbol);
            // Okay, now while creating the declarations we will wire them up to the
            // their corresponding parent declarations
            for (const declaration of followedSymbol.declarations || []) {
                let parentAstDeclaration = undefined;
                if (parentAstSymbol) {
                    // @ts-ignore
                    const parentDeclaration = this._tryFindFirstAstDeclarationParent(declaration);
                    if (!parentDeclaration) {
                        throw new InternalError('Missing parent declaration');
                    }
                    // @ts-ignore
                    parentAstDeclaration = this._astDeclarationsByDeclaration.get(parentDeclaration);
                    if (!parentAstDeclaration) {
                        throw new InternalError('Missing parent AstDeclaration');
                    }
                }
                const astDeclaration = new AstDeclaration({
                    declaration, astSymbol, parent: parentAstDeclaration
                });
                // @ts-ignore
                this._astDeclarationsByDeclaration.set(declaration, astDeclaration);
            }
        }
        if (options.isExternal !== astSymbol.isExternal) {
            throw new InternalError(`Cannot assign isExternal=${options.isExternal} for`
                + ` the symbol ${astSymbol.localName} because it was previously registered`
                + ` with isExternal=${astSymbol.isExternal}`);
        }
        return astSymbol;
    };

    // https://github.com/microsoft/web-build-tools/pull/1305/files#diff-b700218171d1635ddd27bdb65d4525d0R174
    // @ts-ignore
    ExportAnalyzer.prototype._getModuleSymbolFromSourceFile = function(sourceFile, moduleReference) {
        // @ts-ignore
        const moduleSymbol = TypeScriptInternals.tryGetSymbolForDeclaration(sourceFile, this._typeChecker);
        if (moduleSymbol !== undefined) {
            return moduleSymbol;
        }
        if (moduleReference !== undefined) {
            if ((moduleReference.moduleSpecifierSymbol.flags & ts.SymbolFlags.Alias) !== 0) {
                // @ts-ignore
                let followedSymbol = TypeScriptInternals.getImmediateAliasedSymbol(moduleReference.moduleSpecifierSymbol, this._typeChecker);
                if (followedSymbol === undefined) {
                    // @ts-ignore
                    followedSymbol = this._typeChecker.getAliasedSymbol(moduleReference.moduleSpecifierSymbol);
                }
                if (followedSymbol !== undefined && followedSymbol !== moduleReference.moduleSpecifierSymbol) {
                    const parent = TypeScriptInternals.getSymbolParent(followedSymbol);
                    if (parent !== undefined) {
                        if ((parent.flags & ts.SymbolFlags.ValueModule) !== 0) {
                            // @ts-ignore
                            this._importableAmbientSourceFiles.add(sourceFile);
                            return parent;
                        }
                    }
                }
            }
        }
        throw new InternalError('Unable to determine module for: ' + sourceFile.fileName);
    };

    // https://github.com/microsoft/web-build-tools/pull/1305/files#diff-fc67304481f1baeb338fc5d6b06eaf7aR99
    TypeScriptHelpers.getSymbolForDeclaration = (declaration, checker) => {
        // @ts-ignore
        const symbol = TypeScriptInternals.tryGetSymbolForDeclaration(declaration, checker);
        if (!symbol) {
            throw new Error(TypeScriptMessageFormatter.formatFileAndLineNumber(declaration) + ': '
                + 'Unable to determine semantic information for this declaration');
        }
        return symbol;
    };

    // https://github.com/microsoft/web-build-tools/pull/1305/files#diff-fc67304481f1baeb338fc5d6b06eaf7aR215
    // @ts-ignore
    TypeScriptHelpers._wellKnownSymbolNameRegExp = /^__@\w+$/;

    // https://github.com/microsoft/web-build-tools/pull/1305/files#diff-fc67304481f1baeb338fc5d6b06eaf7aR220
    // @ts-ignore
    TypeScriptHelpers.isWellKnownSymbolName = (name) => {
        // @ts-ignore
        return TypeScriptHelpers._wellKnownSymbolNameRegExp.test(name);
    };

    // https://github.com/microsoft/web-build-tools/pull/1305/files#diff-fc67304481f1baeb338fc5d6b06eaf7aR226
    // @ts-ignore
    TypeScriptHelpers._uniqueSymbolNameRegExp = /^__@.*@\d+$/;

    // https://github.com/microsoft/web-build-tools/pull/1305/files#diff-fc67304481f1baeb338fc5d6b06eaf7aR231
    // @ts-ignore
    TypeScriptHelpers.isUniqueSymbolName = (name) => {
        // @ts-ignore
        return TypeScriptHelpers._uniqueSymbolNameRegExp.test(name);
    };

    // https://github.com/microsoft/web-build-tools/pull/1305/files#diff-fc67304481f1baeb338fc5d6b06eaf7aR238
    // @ts-ignore
    TypeScriptHelpers.tryGetLateBoundName = (declarationName) => {
        const printer = ts.createPrinter({ removeComments: true }, {
            onEmitNode(hint, node, emit) {
                if (node) {
                    ts.setEmitFlags(node, ts.EmitFlags.NoIndentation | ts.EmitFlags.SingleLine);
                }
                emit(hint, node);
            }
        });
        const sourceFile = declarationName.getSourceFile();
        const text = printer.printNode(ts.EmitHint.Unspecified, declarationName, sourceFile);
        ts.disposeEmitNodes(sourceFile);
        return text;
    };

    // https://github.com/microsoft/web-build-tools/pull/1305/files#diff-7e291b832d504cad43930cb05bb44b81R24
    TypeScriptInternals.tryGetSymbolForDeclaration = (declaration, checker) => {
        let symbol = declaration.symbol;
        if (symbol && symbol.escapedName === ts.InternalSymbolName.Computed) {
            const name = ts.getNameOfDeclaration(declaration);
            symbol = name && checker.getSymbolAtLocation(name) || symbol;
        }
        return symbol;
    };

    // https://github.com/microsoft/web-build-tools/pull/1305/files#diff-7e291b832d504cad43930cb05bb44b81R38
    // @ts-ignore
    TypeScriptInternals.isLateBoundSymbol = (symbol) => {
        if (symbol.flags & ts.SymbolFlags.Transient &&
            // @ts-ignore
            symbol.checkFlags === ts.CheckFlags.Late) {
            return true;
        }
        return false;
    };
}
