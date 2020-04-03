const { YamlDocumenter } = require("@microsoft/api-documenter/lib/documenters/YamlDocumenter");

const saved_getYamlItemName = YamlDocumenter.prototype._getYamlItemName;
YamlDocumenter.prototype._getYamlItemName = function(apiItem, options) {
    const itemName = saved_getYamlItemName.call(this, apiItem, options);
    return itemName.replace(/^\(constructor\)/, "constructor");
};