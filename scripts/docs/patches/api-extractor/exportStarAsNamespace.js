// "fixes" https://github.com/microsoft/rushstack/issues/1029

// @ts-check
const { TypeScriptHelpers } = require("@microsoft/api-extractor/lib/analyzer/TypeScriptHelpers");
const ts = require("typescript");

const { AstSymbol } = require("@microsoft/api-extractor/lib/analyzer/AstSymbol");
const { AstDeclaration } = require("@microsoft/api-extractor/lib/analyzer/AstDeclaration");
const { ExportAnalyzer } = require("@microsoft/api-extractor/lib/analyzer/ExportAnalyzer");

// @ts-ignore
const saved_tryMatchImportDeclaration = ExportAnalyzer.prototype._tryMatchImportDeclaration;

// @ts-ignore
ExportAnalyzer.prototype._tryMatchImportDeclaration = function (declaration, declarationSymbol) {
    const importDeclaration = TypeScriptHelpers.findFirstParent(declaration, ts.SyntaxKind.ImportDeclaration);
    if (importDeclaration) {
        // @ts-ignore
        const externalModulePath = this._tryGetExternalModulePath(importDeclaration, declarationSymbol);
        if (declaration.kind === ts.SyntaxKind.NamespaceImport) {
            if (externalModulePath === undefined) {
                /** @type {import("@microsoft/api-extractor/lib/analyzer/AstModule").AstModule} */
                // @ts-ignore
                const specifierAstModule = this._fetchSpecifierAstModule(importDeclaration, declarationSymbol);
                const exportInfo = this.fetchAstModuleExportInfo(specifierAstModule);

                // Create a synthetic local AstSymbol for a synthetic `namespace` declaration
                const astSymbol = new AstSymbol({
                    followedSymbol: declarationSymbol,
                    localName: declarationSymbol.name,
                    isExternal: false,
                    nominalAnalysis: false,
                    parentAstSymbol: undefined,
                    rootAstSymbol: undefined
                });

                // Parse a synthetic `namespace` declaration for the local symbol. We do this to ensure the correct `parent` pointers are set.
                const fakeFile = ts.createSourceFile(specifierAstModule.sourceFile.fileName, `export namespace ${declarationSymbol.name} {}`, ts.ScriptTarget.ESNext, true);
                const fakeNamespace = /** @type {ts.ModuleDeclaration} */(fakeFile.statements[0]);

                // Create a synthetic AstDeclaration for the synthetic namespace.
                const astDeclaration = new AstDeclaration({
                    astSymbol: astSymbol,
                    declaration: fakeNamespace,
                    parent: undefined
                });

                // Attach the exports of the imported source file to this declaration.
                // We do this without calling `_notifyChildAttach` since these symbols
                // are already parented.
                for (const astEntity of exportInfo.exportedLocalEntities.values()) {
                    if (astEntity instanceof AstSymbol) {
                        for (const decl of astEntity.astDeclarations) {
                            // @ts-ignore
                            astDeclaration._analyzedChildren.push(decl);
                        }
                    }
                }

                astSymbol._notifyDeclarationAttach(astDeclaration);
                astSymbol._notifyAnalyzed();
                return astSymbol;
            }
        }
    }

    // Fallback to existing behavior
    return saved_tryMatchImportDeclaration.call(this, declaration, declarationSymbol);
}

