// @ts-check

// run `api-extractor run --local` for each package
// - https://api-extractor.com/pages/setup/invoking/
// run `api-documenter markdown --input-folder temp --output-folder docs` for each package
// - https://api-extractor.com/pages/setup/generating_docs/
// - alternatively use `api-documenter yaml` and DocFX:
//   - https://dotnet.github.io/docfx/

const fs = require("fs");
const os = require("os");
const path = require("path");
const del = require("del");
const { default: chalk } = require("chalk");
require("./docs/patches/tsdoc");
require("./docs/patches/api-extractor");
require("./docs/patches/api-documenter");
const { Extractor, ExtractorConfig, ExtractorMessageCategory, ExtractorLogLevel } = require("@microsoft/api-extractor");
const { ApiModel, ApiDocumentedItem, ApiDeclaredItem, ApiItemContainerMixin, ApiParameterListMixin } = require("@microsoft/api-extractor-model");
const { YamlDocumenter } = require("@microsoft/api-documenter/lib/documenters/YamlDocumenter");
const { exec } = require("./exec");
const { newer } = require("./newer");
const log = require("fancy-log");
const glob = require("glob");
const { pipeline } = require("stream");
const { promisify } = require("util");
const { default: fetch } = require("node-fetch");
const unzip = require("extract-zip");

const { TSDocTagDefinition, TSDocTagSyntaxKind, StandardTags } = require("@microsoft/tsdoc");
const { AedocDefinitions } = require("@microsoft/api-extractor-model/lib/aedoc/AedocDefinitions");

const categoryTag = new TSDocTagDefinition({
    tagName: "@category",
    syntaxKind: TSDocTagSyntaxKind.ModifierTag
});

const seeTag = new TSDocTagDefinition({
    tagName: "@see",
    syntaxKind: TSDocTagSyntaxKind.ModifierTag
});

const typeParamTag = StandardTags.typeParam || new TSDocTagDefinition({
    tagName: "@typeParam",
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
    allowMultiple: true
});

let isTsDocConfigured = false;

function configureTsDoc() {
    if (!isTsDocConfigured) {
        const foundCategoryTag = AedocDefinitions.tsdocConfiguration.tryGetTagDefinition("@category");
        if (!foundCategoryTag) {
            AedocDefinitions.tsdocConfiguration.addTagDefinitions([categoryTag], true);
        }
        else {
            AedocDefinitions.tsdocConfiguration.setSupportForTags([foundCategoryTag], true);
        }

        const foundSeeTag = AedocDefinitions.tsdocConfiguration.tryGetTagDefinition("@see");
        if (!foundSeeTag) {
            AedocDefinitions.tsdocConfiguration.addTagDefinitions([seeTag], true);
        }
        else {
            AedocDefinitions.tsdocConfiguration.setSupportForTags([foundSeeTag], true);
        }

        const foundTypeParamTag = AedocDefinitions.tsdocConfiguration.tryGetTagDefinition("@typeParam");
        if (!foundTypeParamTag) {
            AedocDefinitions.tsdocConfiguration.addTagDefinitions([typeParamTag], true);
        }
        else {
            AedocDefinitions.tsdocConfiguration.setSupportForTags([foundTypeParamTag], true);
        }

        isTsDocConfigured = true;
    }
}

/**
 * @param {string} docPackage
 * @param {object} [options]
 * @param {boolean} [options.verbose]
 * @param {boolean} [options.force]
 */
async function apiExtractor(docPackage, options = {}) {
    configureTsDoc();
    const { verbose, force } = options
    const config = ExtractorConfig.loadFileAndPrepare(path.resolve(docPackage, "api-extractor.json"));
    const inputs = [...glob.sync(`${docPackage}/index.d.ts`), ...glob.sync(`${docPackage}/dist/**/*.d.ts`)];
    if (!force && inputs.length > 0 && !newer(inputs, config.apiJsonFilePath)) {
        if (verbose) {
            log(`API for '${docPackage}' is unchanged, skipping.`);
        }
        return;
    }
    const result = Extractor.invoke(config, {
        localBuild: true,
        messageCallback: message => {
            message.handled = true;
            let messageText;
            if (message.category === "console") {
                messageText = message.text;
            }
            else {
                messageText = message.formatMessageWithLocation(process.cwd());
            }
            switch (message.logLevel) {
                case "error":
                    log.error(chalk.red(messageText));
                    break;
                case "warning":
                    log.warn(chalk.yellow(messageText));
                    break;
                case "info":
                    log(messageText);
                    break;
                case "verbose":
                    if (options.verbose) {
                        log.info(chalk.cyan(messageText));
                    }
                    break;
            }
        }
    });
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
        const documenter = new YamlDocumenter(apiModel, /*newDocfxNamespaces*/ true);
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
                        // @ts-ignore
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

/**
 * @param {boolean} force 
 */
async function installDocFx(force) {
    if (!force && fs.existsSync("./.docfx/bin/docfx.exe")) return;
    await installDocFx();

    async function installDocFx() {
        try { await fs.promises.mkdir("./.docfx/bin", { recursive: true }); } catch { }
        log("Downloading https://github.com/dotnet/docfx/releases/download/v2.57.2/docfx.zip...");
        const response = await fetch("https://github.com/dotnet/docfx/releases/download/v2.57.2/docfx.zip");
        if (response.ok) {
            await del("./.docfx/bin/**/*.*");
            const tmpFile = path.join(os.tmpdir(), "docfx.zip");
            try {
                await promisify(pipeline)(response.body, fs.createWriteStream(tmpFile));
                log("Unzipping docfx.zip...");
                await unzip(tmpFile, { dir: path.resolve("./.docfx/bin") });
            }
            finally {
                await fs.promises.unlink(tmpFile);
            }
        }
        else {
            log(`${response.status}: ${response.statusText}`);
        }
    }
}

exports.installDocFx = installDocFx;

async function docfx(serve = false) {
    await del("docs");
    await exec(path.resolve(".docfx/bin/docfx.exe"), serve ? ["--serve"] : [], { verbose: true });
}
exports.docfx = docfx;