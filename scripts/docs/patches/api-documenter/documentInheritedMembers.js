// @ts-check
const { YamlDocumenter } = require("@microsoft/api-documenter/lib/documenters/YamlDocumenter");
const { ApiItemKind } = require("@microsoft/api-extractor-model");

const prev_generateYamlItem = YamlDocumenter.prototype["_generateYamlItem"];

/**
 * @param {import("@microsoft/api-extractor-model").ApiItem} apiItem
 * @returns {import("@microsoft/api-documenter/lib/yaml/IYamlApiFile").IYamlItem}
 */
YamlDocumenter.prototype["_generateYamlItem"] = function (apiItem) {
    /** @type {import("@microsoft/api-documenter/lib/yaml/IYamlApiFile").IYamlItem} */
    const yamlItem = prev_generateYamlItem.call(this, apiItem);

    /** @param {import("@microsoft/api-documenter/lib/yaml/IYamlApiFile").IYamlInheritanceTree[] | undefined} inheritanceArray */
    const visit = (inheritanceArray) => {
        if (!inheritanceArray) return;
        for (const inheritance of inheritanceArray) {
            /** @type {import("@microsoft/api-extractor-model").ApiItem} */
            let apiItem = this["_apiItemsByCanonicalReference"].get(inheritance.type);
            if (!apiItem && inheritance.type.endsWith(":complex")) {
                const yamlReference = this["_yamlReferences"]?.references?.find(ref => ref.uid === inheritance.type);
                const spec = yamlReference?.["spec.typeScript"]?.[0];
                if (spec?.uid) {
                    apiItem = this["_apiItemsByCanonicalReference"].get(spec.uid);
                }
            }
            if (apiItem) {
                for (const member of apiItem.members) {
                    const uid = this["_getUid"](member);
                    yamlItem.inheritedMembers ??= [];
                    if (!yamlItem.inheritedMembers.includes(uid)) {
                        yamlItem.inheritedMembers.push(uid);
                    }
                }
            }
            visit(inheritance.inheritance);
        }
    };
    visit(yamlItem.inheritance);
    return yamlItem;
};