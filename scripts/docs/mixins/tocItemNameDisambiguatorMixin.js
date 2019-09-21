// @ts-check
const { defineMixin } = require("./mixin");
const { DeclarationReference } = require("@microsoft/tsdoc/lib/beta/DeclarationReference");
exports.TocItemNameDisambiguatorMixin = defineMixin(function TocItemNameDisambiguatorMixin(baseClass) {
    // @ts-ignore
    return /** @type {typeof baseClass} */(class extends baseClass {
        /**
         * @private
         * @param {readonly import("@microsoft/api-extractor-model").ApiItem[]} apiItems
         * @returns {import("@microsoft/api-documenter/lib/yaml/IYamlTocFile").IYamlTocItem[]}
         */
        _buildTocItems(apiItems) {
            /** @type {import("@microsoft/api-documenter/lib/yaml/IYamlTocFile").IYamlTocItem[]} */
            // @ts-ignore
            const tocItems = super._buildTocItems(apiItems);
            
            /** @type {Map<string, import("@microsoft/api-documenter/lib/yaml/IYamlTocFile").IYamlTocItem>} */
            const singletonMap = new Map();
            
            /** @type {Map<string, import("@microsoft/api-documenter/lib/yaml/IYamlTocFile").IYamlTocItem[]>} */
            const collisionMap = new Map();
            for (const tocItem of tocItems) {
                let collisions = collisionMap.get(tocItem.name);
                if (!collisions) {
                    const collision = singletonMap.get(tocItem.name);
                    if (!collision) {
                        singletonMap.set(tocItem.name, tocItem);
                        continue;
                    }
                    collisionMap.set(tocItem.name, collisions = [collision]);
                    singletonMap.delete(tocItem.name);
                }
                collisions.push(tocItem);
            }

            for (const collisions of collisionMap.values()) {
                for (const collision of collisions) {
                    collision.name += getDisambiguator(collision.uid);
                }
            }

            return tocItems;
        }
    });

    /**
     * @param {string} uid 
     */
    function getDisambiguator(uid) {
        const ref = uid && DeclarationReference.parse(uid);
        if (ref && ref.symbol) {
            switch (ref.symbol.meaning) {
                case "class": return " (Class)";
                case "interface": return " (Interface)";
                case "namespace": return " (Namespace)";
                case "enum": return " (Enum)";
                case "function": return " (Function)";
                case "var": return " (Variable)";
            }
        }
        return "";
    }
});
