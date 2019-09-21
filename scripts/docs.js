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
// require("./docs/patchApiExtractor");
const { Extractor, ExtractorConfig } = require("@microsoft/api-extractor");
const { ApiModel, ApiDocumentedItem, ApiDeclaredItem, ApiItemContainerMixin, ApiParameterListMixin } = require("@microsoft/api-extractor-model");
const { CustomYamlDocumenter } = require("./docs/yamlDocumenter");
const { exec } = require("./exec");
const { newer } = require("./newer");
const log = require("fancy-log");
const glob = require("glob");

/**
 * @param {string} docPackage
 * @param {object} [options]
 * @param {boolean} [options.verbose]
 * @param {boolean} [options.force]
 */
async function apiExtractor(docPackage, options = {}) {
    const { verbose, force } = options
    const config = ExtractorConfig.loadFileAndPrepare(path.resolve(docPackage, "api-extractor.json"));
    const inputs = glob.sync(`@(${docPackage}/index.d.ts|${docPackage}/dist/**/*.d.ts)`);
    if (!force && !newer(inputs, config.apiJsonFilePath)) {
        if (verbose) {
            log(`API for '${docPackage}' is unchanged, skipping.`);
        }
        return;
    }
    const result = Extractor.invoke(config, { localBuild: true });
    if (!result.succeeded) {
        throw new Error(`api-extractor failed for ${docPackage}`);
    }
}
exports.apiExtractor = apiExtractor;

function replaceVars(file, vars) {
    return file.replace(/<([^>]+)>/g, (_, varName) => {
        return typeof vars[varName] === "string" ? vars[varName] : _;
    });
}

/**
 * @param {string[]} projectFolders
 */
async function apiDocumenter(projectFolders, apiDir = "<projectFolder>/obj/api", yamlDir = "obj/yml") {
    const outputDirs = [...new Set(projectFolders.map(projectFolder => path.resolve(replaceVars(yamlDir, { projectFolder }))))];
    await del(outputDirs);

    /** @type {Map<string, ApiModel>} */
    const apiModels = new Map();

    for (const projectFolder of projectFolders) {
        const inputDir = path.resolve(replaceVars(apiDir, { projectFolder }));
        const outputDir = path.resolve(replaceVars(yamlDir, { projectFolder }));
        let apiModel = apiModels.get(outputDir);
        if (!apiModel) apiModels.set(outputDir, apiModel = new ApiModel());
        for (const entry of await fs.promises.readdir(inputDir)) {
            if (!entry.endsWith(".api.json")) continue;
            apiModel.loadPackage(path.resolve(inputDir, entry));
        }
        fixupModel(apiModel, apiModel);
    }

    for (const [outputDir, apiModel] of apiModels) {
        const documenter = new CustomYamlDocumenter(apiModel);
        documenter.generateFiles(outputDir);
    }
}
exports.apiDocumenter = apiDocumenter;

// let nameSymbol;

// function getNameSymbol(apiItem) {
//     if (nameSymbol === undefined) {
//         const symbols = Object.getOwnPropertySymbols(apiItem);
//         nameSymbol = symbols.find(sym => sym.toString() === "Symbol(ApiNameMixin._name)");
//     }
//     return nameSymbol;
// }

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

    // if (apiItem.displayName === "__computed" && apiItem instanceof ApiDeclaredItem) {
    //     const match = /\[[^\[\]]+\]/.exec(apiItem.excerpt.text);
    //     if (match) {
    //         const nameSymbol = getNameSymbol(apiItem);
    //         if (nameSymbol) {
    //             apiItem[nameSymbol] = match[0];
    //         }
    //     }
    // }

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

async function docfx(serve = false) {
    await del("docs");
    await exec("docfx", serve ? ["--serve"] : []);
}
exports.docfx = docfx;