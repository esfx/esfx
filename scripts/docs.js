// @ts-check

// run `api-extractor run --local` for each package
// - https://api-extractor.com/pages/setup/invoking/
// run `api-documenter markdown --input-folder temp --output-folder docs` for each package
// - https://api-extractor.com/pages/setup/generating_docs/
// - alternatively use `api-documenter yaml` and DocFX:
//   - https://dotnet.github.io/docfx/

// apply patches
require("./docs/patches/tsdoc")({
    paramTagHyphen: false, // Fixed in @microsoft/tsdoc@0.12.18
    emitSoftBreak: true,
    parseBetaDeclarationReference: true,
    parseSpacingAfterCodeDestination: true,
});

require("./docs/patches/api-extractor")({
    exportStarAsNamespace: false,
    ignoreUnhandledExports: true,
    ambiguousReferences: true
});

require("./docs/patches/api-documenter")({
    emitSoftBreak: true,
    overrideTocRoot: true,
    documentExternals: true,
    inlineTypeAliases: true,
    renameTsSymbolicNames: true,
    disableConvertToSDP: true,
    documentAliases: true,
    documentClassInterfaceSyntax: true,
    documentInheritedMembers: true,
    documentParent: true,
    documentApiNames: true,
    includeTypeParametersInName: true,
    overwriteYamlSchema: true,
    forwardUnresolvedReferences: true
});

require("./docs/patches/api-extractor-model")({
    ambiguousReferences: true,
});

const fs = require("fs");
const os = require("os");
const path = require("path");
const del = require("del");
const { default: chalk } = require("chalk");

const { Extractor, ExtractorConfig, ExtractorMessageCategory, ExtractorLogLevel } = require("@microsoft/api-extractor");
const { ApiModel, ApiDocumentedItem, ApiDeclaredItem, ApiItemContainerMixin, ApiParameterListMixin, ApiPackage } = require("@microsoft/api-extractor-model");
const { YamlDocumenter } = require("@microsoft/api-documenter/lib/documenters/YamlDocumenter");
const { exec } = require("./exec");
const { newer } = require("./newer");
const log = require("fancy-log");
const glob = require("glob");
const { pipeline } = require("stream");
const { promisify } = require("util");
const { default: fetch } = require("node-fetch");
const unzip = require("extract-zip");

const { TSDocConfigFile } = require("@microsoft/tsdoc-config");

/**
 * @param {object} options
 * @param {string} options.projectFolder
 * @param {RegExp} [options.docPackagePattern]
 * @param {boolean} [options.verbose]
 * @param {boolean} [options.force]
 */
async function apiExtractor({ projectFolder, verbose, force, docPackagePattern }) {
    if (docPackagePattern && !docPackagePattern.test(projectFolder)) {
        log(`Project '${projectFolder}' did not match '--docPackagePattern' and was skipped.`);
        return;
    }

    const configObjectFullPath = path.resolve(projectFolder, "api-extractor.json");
    const packageJsonFullPath = path.resolve(projectFolder, "package.json");
    const configObject = ExtractorConfig.loadFile(configObjectFullPath);
    const config = ExtractorConfig.prepare({
        configObject,
        configObjectFullPath,
        packageJsonFullPath,
        tsdocConfigFile: TSDocConfigFile.loadFile(path.resolve("tsdoc.json"))
    });
    const inputs = [...glob.sync(`${projectFolder}/index.d.ts`), ...glob.sync(`${projectFolder}/dist/**/*.d.ts`)];
    if (!force && inputs.length > 0 && !newer(inputs, config.apiJsonFilePath)) {
        if (verbose) {
            log(`API for '${projectFolder}' is unchanged, skipping.`);
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
                    if (verbose) {
                        log.info(chalk.cyan(messageText));
                    }
                    break;
            }
        }
    });
    if (!result.succeeded) {
        throw new Error(`api-extractor failed for ${projectFolder}`);
    }
}
exports.apiExtractor = apiExtractor;

function replaceVars(file, vars) {
    return file.replace(/<([^>]+)>/g, (_, varName) => {
        return typeof vars[varName] === "string" ? vars[varName] : _;
    });
}

/**
 * @param {object} options
 * @param {string[]} options.projectFolders
 * @param {RegExp} [options.docPackagePattern]
 * @param {string} [options.apiDir]
 * @param {string} [options.yamlDir]
 */
async function apiDocumenter({ projectFolders, apiDir = "<projectFolder>/obj/api", yamlDir = "obj/yml", docPackagePattern }) {
    const matchingProjectFolders = docPackagePattern ? projectFolders.filter(projectFolder => docPackagePattern.test(projectFolder)) : projectFolders;
    const matchingProjectFolderSet = new Set(matchingProjectFolders);

    const outputDirs = [...new Set(matchingProjectFolders.map(projectFolder => path.resolve(replaceVars(yamlDir, { projectFolder }))))];
    await del(outputDirs);

    /** @type {Map<string, ApiModel>} */
    const apiModels = new Map();
    /** @type {Set<import("@microsoft/api-extractor-model").ApiPackage>} */
    const matchingProjects = new Set();

    for (const projectFolder of projectFolders) {
        const outputDir = path.resolve(replaceVars(yamlDir, { projectFolder }));
        if (!apiModels.has(outputDir) && matchingProjectFolderSet.has(projectFolder)) {
            apiModels.set(outputDir, new ApiModel());
        }
    }

    for (const projectFolder of projectFolders) {
        const outputDir = path.resolve(replaceVars(yamlDir, { projectFolder }));
        const apiModel = apiModels.get(outputDir);
        if (!apiModel) continue;

        const inputDir = path.resolve(replaceVars(apiDir, { projectFolder }));
        for (const entry of await fs.promises.readdir(inputDir)) {
            if (!entry.endsWith(".api.json")) continue;
            const apiPackage = apiModel.loadPackage(path.resolve(inputDir, entry));
            if (matchingProjectFolderSet.has(projectFolder)) {
                matchingProjects.add(apiPackage);
            }
        }
    }

    for (const apiModel of apiModels.values()) {
        fixupModel(apiModel, apiModel);
    }

    for (const [outputDir, apiModel] of apiModels) {
        const documenter = new YamlDocumenter(apiModel, /*newDocfxNamespaces*/ true);
        
        // Patch documenter to ignore unmatchd projects.
        const prev_visitApiItems = documenter["_visitApiItems"];
        documenter["_visitApiItems"] = function visitApiItems(outputFolder, apiItem, parentYamlFile) {
            this["_visitApiItems"] = prev_visitApiItems;
            try {
                if (apiItem instanceof ApiPackage && !matchingProjects.has(apiItem)) {
                    return;
                }
                return prev_visitApiItems.call(this, outputFolder, apiItem, parentYamlFile);
            }
            finally {
                this["_visitApiItems"] = visitApiItems;
            }
        }
        
        const prev_writeTocFile = documenter["_writeTocFile"];
        documenter["_writeTocFile"] = function (outputFolder, apiItems) {
            return prev_writeTocFile.call(this, outputFolder, apiItems.filter(apiItem => matchingProjects.has(apiItem)));
        };
        
        documenter.generateFiles(outputDir);
    }
}
exports.apiDocumenter = apiDocumenter;

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

/**
 *
 * @param {object} options
 * @param {boolean} [options.serve]
 * @param {boolean} [options.build]
 * @param {boolean} [options.incremental]
 */
async function docfx({ serve = false, build = true, incremental = false } = {}) {
    if (build && !incremental) await del("docs");
    await exec(path.resolve(".docfx/bin/docfx.exe"), serve ? build ? ["--serve"] : ["serve", "docs"] : [], { verbose: true });
}
exports.docfx = docfx;