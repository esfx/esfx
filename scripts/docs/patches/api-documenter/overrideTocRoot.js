const { YamlDocumenter } = require("@microsoft/api-documenter/lib/documenters/YamlDocumenter");

YamlDocumenter.prototype.onGetTocRoot = function() {
    return {
        name: "@esfx reference",
        uid: "esfx",
        items: []
    }
};