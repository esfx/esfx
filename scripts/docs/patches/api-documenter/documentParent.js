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
                if (!yamlItem.parent) {
                    const uid = this["_getUidObject"](apiItem.parent);
                    yamlItem.parent = uid.toString();
                }
            }
            break;
    }
    return yamlItem;
};