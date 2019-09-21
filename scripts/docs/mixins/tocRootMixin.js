// @ts-check
const { defineMixin } = require("./mixin");
exports.TocRootMixin = defineMixin(function TocRootMixin(baseClass) {
    return class extends baseClass {
        /**
         * @protected
         * @returns {import("@microsoft/api-documenter/lib/yaml/IYamlTocFile").IYamlTocItem}
         */
        onGetTocRoot() {
            return {
                name: "@esfx reference",
                uid: "esfx",
                items: []
            }
        }
    };
});
