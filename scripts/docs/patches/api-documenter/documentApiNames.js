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
        case ApiItemKind.Method:
        case ApiItemKind.MethodSignature:
        case ApiItemKind.Property:
        case ApiItemKind.PropertySignature:
            if (apiItem.parent) {
                if (!yamlItem.fullName || yamlItem.fullName === yamlItem.name) {
                    const parentName = this["_getYamlItemName"](apiItem.parent, { includeSignature: false, includeNamespace: false });
                    yamlItem.fullName = `${parentName}.${yamlItem.name}`;
                }
            }
            break;
    }
    return yamlItem;
};