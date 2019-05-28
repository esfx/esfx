// @ts-check

// run `api-extractor run --local` for each package
// - https://api-extractor.com/pages/setup/invoking/
// run `api-documenter markdown --input-folder temp --output-folder docs` for each package
// - https://api-extractor.com/pages/setup/generating_docs/
// - alternatively use `api-documenter yaml` and DocFX:
//   - https://dotnet.github.io/docfx/

const fs = require("fs");
const path = require("path");
const del = require("del");
const { Extractor } = require("@microsoft/api-extractor");
const { ApiModel, ApiDocumentedItem, ApiDeclaredItem, ApiItemContainerMixin, ApiParameterListMixin } = require("@microsoft/api-extractor-model");
const { YamlDocumenter } = require("@microsoft/api-documenter/lib/documenters/YamlDocumenter");
const { PackageName } = require("@microsoft/node-core-library");
const { exec } = require("./exec");

/**
 * @param {string} docPackage
 */
async function apiExtractor(docPackage) {
    const result = Extractor.loadConfigAndInvoke(path.resolve(docPackage, "api-extractor.json"), {
        localBuild: true,
    });
    if (!result.succeeded) {
        throw new Error(`api-extractor failed for ${docPackage}`);
    }
}
exports.apiExtractor = apiExtractor;

const safeNames = Symbol();

// @ts-ignore
class CustomYamlDocumenter extends YamlDocumenter {
    constructor(apiModel) {
        super(apiModel);
        /** @type {Map<import("@microsoft/api-extractor-model").ApiItem, string>} */
        this[safeNames] = new Map();
    }

    onGetTocRoot() {
        let text = fs.readFileSync("README.md", "utf8");
        text = text.replace(/packages\/([^\/]+)#readme/g, "xref:$1");
        fs.writeFileSync("obj/docs/index.md", text, "utf8");
        return {
            name: "@esfx reference",
            href: "../index.md",
            items: []
        }
    }

    onCustomizeYamlItem(yamlItem) {
        if (yamlItem.type === "package" && !yamlItem.summary) {
            try {
                let text = fs.readFileSync(`packages/${yamlItem.uid}/README.md`, "utf8");
                text = text.replace(/\.\.\/([^\/]+)#readme/g, "./$1.yml");
                yamlItem.summary = text;
            }
            catch (_) {
            }
        }
    }

    /**
     * @param {import("@microsoft/api-extractor-model").ApiItem} apiItem
     */
    _getSafeName(apiItem) {
        let safeName = this[safeNames].get(apiItem);
        if (!safeName) {
            safeName = apiItem.displayName;
            if (safeName === "__computed" && apiItem instanceof ApiDeclaredItem) {
                const match = /\[[^\[\]]+\]/.exec(apiItem.excerpt.text);
                if (match) {
                    safeName = match[0];
                }
            }
            if (apiItem.kind === "Class" ||
                apiItem.kind === "Interface" ||
                apiItem.kind === "Function" ||
                apiItem.kind === "Namespace") {
                const same = apiItem.parent.members.filter(m => m.displayName === apiItem.displayName);
                if (same.length > 1) {
                    safeName += `_${apiItem.kind}`;
                }
            }
            // For overloaded methods, add a suffix such as "MyClass.myMethod_2".
            if (ApiParameterListMixin.isBaseClassOf(apiItem)) {
                if (apiItem.overloadIndex > 0) {
                    safeName += `_${apiItem.overloadIndex}`;
                }
            }
            this[safeNames].set(apiItem, safeName);
        }
        return safeName;
    }
    /**
     * @param {import("@microsoft/api-extractor-model").ApiItem} apiItem
     */
    _getUid(apiItem) {
        let result = '';
        for (const hierarchyItem of apiItem.getHierarchy()) {
            switch (hierarchyItem.kind) {
                case "Model" /* Model */:
                case "EntryPoint" /* EntryPoint */:
                    break;
                case "Package" /* Package */:
                    result += PackageName.getUnscopedName(hierarchyItem.displayName);
                    break;
                default:
                    result += '.';
                    result += this._getSafeName(hierarchyItem);
                    break;
            }
        }
        return result;
    }
    /**
     * @param {import("@microsoft/api-extractor-model").ApiItem} apiItem
     */
    _getYamlFilePath(apiItem) {
        let result = '';
        for (const current of apiItem.getHierarchy()) {
            switch (current.kind) {
                case "Model" /* Model */:
                case "EntryPoint" /* EntryPoint */:
                    break;
                case "Package" /* Package */:
                    result += PackageName.getUnscopedName(current.displayName);
                    break;
                default:
                    if (current.parent && current.parent.kind === "EntryPoint" /* EntryPoint */) {
                        result += '/';
                    }
                    else {
                        result += '.';
                    }
                    result += this._getSafeName(current);
                    break;
            }
        }
        // @ts-ignore
        return path.join(this._outputFolder, result.toLowerCase() + '.yml');
    }
}

async function apiDocumenter(inputDir = "obj/api", outputDir = "obj/docs/api") {
    await del(outputDir);
    const apiModel = new ApiModel();
    for (const entry of await fs.promises.readdir(inputDir)) {
        if (!entry.endsWith(".api.json")) continue;
        apiModel.loadPackage(path.resolve(inputDir, entry));
    }

    fixupModel(apiModel, apiModel);

    const documenter = new CustomYamlDocumenter(apiModel);
    documenter.generateFiles(outputDir);
}
exports.apiDocumenter = apiDocumenter;

let nameSymbol;

function getNameSymbol(apiItem) {
    if (nameSymbol === undefined) {
        const symbols = Object.getOwnPropertySymbols(apiItem);
        nameSymbol = symbols.find(sym => sym.toString() === "Symbol(ApiNameMixin._name)");
    }
    return nameSymbol;
}

/**
 * @param {import("@microsoft/api-extractor-model").ApiItem} apiItem
 * @param {import("@microsoft/api-extractor-model").ApiModel} apiModel
 */
function fixupModel(apiItem, apiModel) {
    if (apiItem instanceof ApiDocumentedItem) {
        if (apiItem.tsdocComment) {
            const inheritDocTag = apiItem.tsdocComment.inheritDocTag;
            if (inheritDocTag && inheritDocTag.declarationReference) {
                // Attempt to resolve the declaration reference
                const result = apiModel.resolveDeclarationReference(inheritDocTag.declarationReference, apiItem);
                if (result.errorMessage) {
                    console.log(`Warning: Unresolved @inheritDoc tag for ${apiItem.displayName}: ` + result.errorMessage);
                } else {
                    if (result.resolvedApiItem instanceof ApiDocumentedItem
                        && result.resolvedApiItem.tsdocComment
                        && result.resolvedApiItem !== apiItem) {
                        copyInheritedDocs(apiItem.tsdocComment, result.resolvedApiItem.tsdocComment);
                    }
                }
            }
        }
    }

    if (apiItem.displayName === "__computed" && apiItem instanceof ApiDeclaredItem) {
        const match = /\[[^\[\]]+\]/.exec(apiItem.excerpt.text);
        if (match) {
            const nameSymbol = getNameSymbol(apiItem);
            if (nameSymbol) {
                apiItem[nameSymbol] = match[0];
            }
        }
    }

    // Recurse members
    if (ApiItemContainerMixin.isBaseClassOf(apiItem)) {
        for (const member of apiItem.members) {
            fixupModel(member, apiModel);
        }
    }
}

/**
 * @param {import("@microsoft/tsdoc").DocComment} targetDocComment
 * @param {import("@microsoft/tsdoc").DocComment} sourceDocComment
 */
function copyInheritedDocs(targetDocComment, sourceDocComment) {
    targetDocComment.summarySection = sourceDocComment.summarySection;
    targetDocComment.remarksBlock = sourceDocComment.remarksBlock;
    targetDocComment.params.clear();
    for (const param of sourceDocComment.params) {
        targetDocComment.params.add(param);
    }
    for (const typeParam of sourceDocComment.typeParams) {
        targetDocComment.typeParams.add(typeParam);
    }
    targetDocComment.returnsBlock = sourceDocComment.returnsBlock;
    targetDocComment.inheritDocTag = undefined;
}

async function docfx() {
    await del("docs");
    await exec("docfx");
}
exports.docfx = docfx;