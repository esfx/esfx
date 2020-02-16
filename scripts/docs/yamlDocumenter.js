// @ts-check
const { YamlDocumenter } = require("@microsoft/api-documenter/lib/documenters/YamlDocumenter");
const { TocRootMixin } = require("./mixins/tocRootMixin");
const { TocItemNameDisambiguatorMixin } = require("./mixins/tocItemNameDisambiguatorMixin");
const { OutputFileDisambiguatorMixin } = require("./mixins/outputFileDisambiguatorMixin");
const { NamespaceEmbedderMixin } = require("./mixins/namespaceEmbedderMixin");
const { mixin } = require("./mixins/mixin");

class CustomYamlDocumenter extends mixin(YamlDocumenter,
    // NamespaceEmbedderMixin,
    // OutputFileDisambiguatorMixin,
    // TocItemNameDisambiguatorMixin,
    TocRootMixin
) {
}

exports.CustomYamlDocumenter = CustomYamlDocumenter;