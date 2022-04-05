// @ts-check
let ts = require("typescript");
// @ts-ignore
ts = tryRequire("@microsoft/api-extractor/node_modules/typescript") || ts;

const { TypeScriptHelpers } = require("@microsoft/api-extractor/lib/analyzer/TypeScriptHelpers");
const { AstSymbol } = require("@microsoft/api-extractor/lib/analyzer/AstSymbol");
const { AstDeclaration } = require("@microsoft/api-extractor/lib/analyzer/AstDeclaration");
const { ExportAnalyzer } = require("@microsoft/api-extractor/lib/analyzer/ExportAnalyzer");
const { Collector } = require("@microsoft/api-extractor/lib/collector/Collector");
const { InternalDeclarationMetadata } = require("@microsoft/api-extractor/lib/collector/DeclarationMetadata");
const { AstNamespaceImport } = require("@microsoft/api-extractor/lib/analyzer/AstNamespaceImport");

// @ts-ignore
const saved_collectAllExportsRecursive = ExportAnalyzer.prototype._collectAllExportsRecursive;

// @ts-ignore
ExportAnalyzer.prototype._collectAllExportsRecursive = function (astModuleExportInfo, astModule, visitedAstModules) {
    if (visitedAstModules.has(astModule)) {
        return;
    }
    visitedAstModules.add(astModule);
    if (astModule.isExternal) {
        astModuleExportInfo.starExportedExternalModules.add(astModule);
    }
    else {
        // Fetch each of the explicit exports for this module
        if (astModule.moduleSymbol.exports) {
            astModule.moduleSymbol.exports.forEach((exportSymbol, exportName) => {
                switch (exportName) {
                    case ts.InternalSymbolName.ExportStar:
                    case ts.InternalSymbolName.ExportEquals:
                        break;
                    default:
                        // Don't collect the "export default" symbol unless this is the entry point module
                        if (exportName !== ts.InternalSymbolName.Default || visitedAstModules.size === 1) {
                            if (!astModuleExportInfo.exportedLocalEntities.has(exportSymbol.name)) {
                                // @ts-ignore
                                const astEntity = this._tryGetExportOfAstModule(exportSymbol.name, astModule, new Set());
                                if (astEntity) {
                                    if (astEntity instanceof AstSymbol && !astEntity.isExternal) {
                                        // @ts-ignore
                                        this._astSymbolTable.analyze(astEntity);
                                    }
                                    if (astEntity instanceof AstNamespaceImport && !astEntity.astModule.isExternal) {
                                        // @ts-ignore
                                        this._astSymbolTable.analyze(astEntity);
                                    }
                                    astModuleExportInfo.exportedLocalEntities.set(exportSymbol.name, astEntity);
                                }
                                else {
                                    // TODO: report this via `this.messageRouter.addAnalyzerIssue`
                                }
                            }
                        }
                        break;
                }
            });
        }
        for (const starExportedModule of astModule.starExportedModules) {
            // @ts-ignore
            this._collectAllExportsRecursive(astModuleExportInfo, starExportedModule, visitedAstModules);
        }
    }
}


function tryRequire(id) {
    try { return require(id); } catch { return undefined; }
}