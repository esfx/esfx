const { JsonSchema } = require('@rushstack/node-core-library');
const { YamlDocumenter } = require("@microsoft/api-documenter/lib/documenters/YamlDocumenter");

/** @type {JsonSchema | undefined} */
let modifiedSchema;

const prev_writeYamlFile = YamlDocumenter.prototype._writeYamlFile;

YamlDocumenter.prototype._writeYamlFile = function (dataObject, filePath, yamlMimeType, schema) {
    if (schema) {
        if (!modifiedSchema) {
            const clone = Object.create(Object.getPrototypeOf(schema));
            for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(schema))) {
                if (key === "_validator") continue;
                Object.defineProperty(clone, key, descriptor);
            }
            clone._ensureLoaded();
            const item = clone._schemaObject.definitions.item;
            item.properties.alias ??= {
                "type": "array",
                "items": { "type": "string" }
            };
            modifiedSchema = clone;
        }
        schema = modifiedSchema;
    }
    return prev_writeYamlFile.call(this, dataObject, filePath, yamlMimeType, schema);
};