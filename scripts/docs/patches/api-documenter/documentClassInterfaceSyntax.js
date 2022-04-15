// @ts-check
const { YamlDocumenter } = require("@microsoft/api-documenter/lib/documenters/YamlDocumenter");
const { ApiItemKind } = require("@microsoft/api-extractor-model");

const prev_generateYamlItem = YamlDocumenter.prototype["_generateYamlItem"];

/**
 * @param {import("@microsoft/api-extractor-model").ApiItem} apiItem
 * @returns {import("@microsoft/api-documenter/lib/yaml/IYamlApiFile").IYamlItem}
 */
// @ts-ignore
YamlDocumenter.prototype._generateYamlItem = function (apiItem) {
    /** @type {import("@microsoft/api-documenter/lib/yaml/IYamlApiFile").IYamlItem} */
    const yamlItem = prev_generateYamlItem.call(this, apiItem);
    switch (apiItem.kind) {
        case ApiItemKind.Class:
        case ApiItemKind.Interface:
            yamlItem.syntax ??= {};
            yamlItem.syntax.content ??= /** @type {import("@microsoft/api-extractor-model").ApiClass | import("@microsoft/api-extractor-model").ApiInterface} */(apiItem).getExcerptWithModifiers();
            break;
    }
    return yamlItem;
};