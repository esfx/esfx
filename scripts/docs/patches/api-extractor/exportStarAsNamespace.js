// "fixes" https://github.com/microsoft/rushstack/issues/1029

// @ts-check
let ts = require("typescript");
ts = tryRequire("@microsoft/api-extractor/node_modules/typescript") || ts;

const { TypeScriptHelpers } = require("@microsoft/api-extractor/lib/analyzer/TypeScriptHelpers");
const { AstSymbol } = require("@microsoft/api-extractor/lib/analyzer/AstSymbol");
const { AstDeclaration } = require("@microsoft/api-extractor/lib/analyzer/AstDeclaration");
const { ExportAnalyzer } = require("@microsoft/api-extractor/lib/analyzer/ExportAnalyzer");
const { Collector } = require("@microsoft/api-extractor/lib/collector/Collector");
const { InternalDeclarationMetadata } = require("@microsoft/api-extractor/lib/collector/DeclarationMetadata");
// const { InternalError } = require("@rushstack/node-core-library");

// // @ts-ignore
// const saved_tryGetExternalModulePath = ExportAnalyzer.prototype._tryGetExternalModulePath;
// // @ts-ignore
// ExportAnalyzer.prototype._tryGetExternalModulePath = function (importOrExportDeclaration, exportSymbol) {
//     const moduleSpecifier = TypeScriptHelpers.getModuleSpecifier(importOrExportDeclaration);
//     if (!moduleSpecifier) {
//         console.log(importOrExportDeclaration.kind === ts.SyntaxKind.ImportDeclaration);
//         console.log(importOrExportDeclaration.parent.getText());
//         throw new InternalError('Unable to parse module specifier');
//     }
//     return saved_tryGetExternalModulePath.call(this, importOrExportDeclaration, exportSymbol);
// }

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

// @ts-ignore
Collector.prototype._calculateDeclarationMetadataForDeclarations = function(astSymbol) {
    // Initialize DeclarationMetadata for each declaration
    for (const astDeclaration of astSymbol.astDeclarations) {
        const metadata = new InternalDeclarationMetadata();
        // @ts-ignore
        metadata.tsdocParserContext = this._parseTsdocForAstDeclaration(astDeclaration);
        astDeclaration.declarationMetadata = metadata;
    }
    // Detect ancillary declarations
    for (const astDeclaration of astSymbol.astDeclarations) {
        // For a getter/setter pair, make the setter ancillary to the getter
        if (astDeclaration.declaration.kind === ts.SyntaxKind.SetAccessor) {
            let foundGetter = false;
            for (const getterAstDeclaration of astDeclaration.astSymbol.astDeclarations) {
                if (getterAstDeclaration.declaration.kind === ts.SyntaxKind.GetAccessor) {
                    // Associate it with the getter
                    // @ts-ignore
                    this._addAncillaryDeclaration(getterAstDeclaration, astDeclaration);
                    foundGetter = true;
                }
            }
            if (!foundGetter) {
                // @ts-ignore
                this.messageRouter.addAnalyzerIssue("ae-missing-getter" /* MissingGetter */, `The property "${astDeclaration.astSymbol.localName}" has a setter but no getter.`, astDeclaration);
            }
        }
    }
};

function tryRequire(id) {
    try { return require(id); } catch { return undefined; }
}