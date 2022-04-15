// @ts-check
const { YamlDocumenter } = require("@microsoft/api-documenter/lib/documenters/YamlDocumenter");
const prev_onCustomizeYamlItem = YamlDocumenter.prototype["onCustomizeYamlItem"];

/**
 * @param {import("@microsoft/api-documenter/lib/yaml/IYamlApiFile").IYamlItem} yamlItem
 */
YamlDocumenter.prototype["onCustomizeYamlItem"] = function (yamlItem) {
    prev_onCustomizeYamlItem.call(this, yamlItem);
    if (yamlItem.type !== "interface" && yamlItem.type !== "class") return;
    if (!yamlItem.syntax?.typeParameters?.length) return;
    const typeParameters = [];
    for (const typeParameter of yamlItem.syntax.typeParameters) {
        typeParameters.push(typeParameter.id);
    }
    if (typeParameters.length) {
        if (yamlItem.name) yamlItem.name = `${yamlItem.name}<${typeParameters.join(", ")}>`;
        if (yamlItem.fullName) yamlItem.fullName = `${yamlItem.fullName}<${typeParameters.join(", ")}>`;
    }
};