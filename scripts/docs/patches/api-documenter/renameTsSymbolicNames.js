const { YamlDocumenter } = require("@microsoft/api-documenter/lib/documenters/YamlDocumenter");

const prev_getYamlItemName = YamlDocumenter.prototype._getYamlItemName;

YamlDocumenter.prototype._getYamlItemName = function(apiItem, options) {
    const itemName = prev_getYamlItemName.call(this, apiItem, options);
    return itemName.replace(/^\(constructor\)/, "constructor");
};