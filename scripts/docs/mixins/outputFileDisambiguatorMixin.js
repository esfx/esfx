// @ts-check
const path = require("path");
const { defineMixin } = require("./mixin");
exports.OutputFileDisambiguatorMixin = defineMixin(function OutputFileDisambiguatorMixin(baseClass) {
    // @ts-ignore
    return /** @type {typeof baseClass} */(class extends baseClass {
        /**
         * @param {import("@microsoft/api-extractor-model").ApiItem} apiItem
         * @returns {string}
         */
        _getYamlFilePath(apiItem) {
            // @ts-ignore
            const file = super._getYamlFilePath(apiItem);
            if (apiItem.canonicalReference.symbol) {
                const meaning = apiItem.canonicalReference.symbol.meaning;
                switch (meaning) {
                    case "class":
                    case "interface":
                    case "namespace":
                    case "enum":
                    case "function":
                    case "var":
                        // these meanings can merge, disambiguate the file name
                        const extname = path.extname(file);
                        const basename = path.basename(file, extname);
                        const dirname = path.dirname(file);
                        return path.join(dirname, `${basename}_${meaning}${extname}`);
                }
            }
            return file;
        }
    });
});
