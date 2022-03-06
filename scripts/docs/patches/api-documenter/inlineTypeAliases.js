const { YamlDocumenter } = require("@microsoft/api-documenter/lib/documenters/YamlDocumenter");
const { ApiItemKind } = require("@microsoft/api-extractor-model/lib/items/ApiItem");

const prev_shouldEmbed = YamlDocumenter.prototype._shouldEmbed;
YamlDocumenter.prototype._shouldEmbed = function (apiItemKind) {
    if (apiItemKind === ApiItemKind.TypeAlias) {
        return true;
    }
    return prev_shouldEmbed.call(this, apiItemKind);
};