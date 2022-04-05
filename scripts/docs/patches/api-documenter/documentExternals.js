const path = require("path");
const fs = require("fs");
const jsyaml = require("js-yaml");
const { YamlDocumenter } = require("@microsoft/api-documenter/lib/documenters/YamlDocumenter");

const externalTypes = new Set();
const domYaml = jsyaml.load(fs.readFileSync(path.resolve(__dirname, "../../../../docsrc/xrefmap-dom.yml")));
const ecma262Yaml = jsyaml.load(fs.readFileSync(path.resolve(__dirname, "../../../../docsrc/xrefmap-ecma262.yml")));

for (const yaml of [domYaml, ecma262Yaml]) {
    for (const ref of yaml.references) {
        externalTypes.add(ref.uid);
    }
}

function isExternalType(type) {
    return externalTypes.has(type);
}

const prev_renderType = YamlDocumenter.prototype._renderType;

YamlDocumenter.prototype._renderType = function(contextUid, typeExcerpt) {
    const typeName = typeExcerpt.text.trim();
    const uid = prev_renderType.call(this, contextUid, typeExcerpt);
    if (typeName === uid && isExternalType(typeName)) {
        const yamlReferences = this._ensureYamlReferences();
        const existingUid = yamlReferences.typeNameToUid.get(typeName);
        if (existingUid) {
            return existingUid;
        }
        return this._recordYamlReference(yamlReferences, typeName, typeName, typeName);
    }
    return uid;
};