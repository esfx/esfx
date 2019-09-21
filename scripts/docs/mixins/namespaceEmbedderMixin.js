// @ts-check
const { defineMixin } = require("./mixin");
const { JsonSchema } = require("@microsoft/node-core-library");
const { ApiItem, ApiDocumentedItem } = require("@microsoft/api-extractor-model");

const yamlApiSchema = JsonSchema.fromFile(require.resolve("../typescript.schema.json"));

/**
 * @typedef {import("@microsoft/api-documenter/lib/yaml/IYamlApiFile").IYamlApiFile} IYamlApiFile;
 * @typedef {import("@microsoft/api-documenter/lib/yaml/IYamlApiFile").IYamlItem} IYamlItem;
 */

exports.NamespaceEmbedderMixin = defineMixin(function NamespaceEmbedderMixin(baseClass) {
    // @ts-ignore
    return /** @type {typeof baseClass} */(class extends baseClass {
        /**
         * @private
         * @param {ApiDocumentedItem} apiItem
         * @param {IYamlApiFile | undefined} parentYamlFile
         */
        _visitApiItems(apiItem, parentYamlFile) {
            this._currentApiItem = apiItem;
            try {
                // @ts-ignore
                return super._visitApiItems(apiItem, parentYamlFile);
            }
            finally {
                this._currentApiItem = undefined;
            }
        }

        /**
         * @private
         * @param {readonly ApiItem[]} items
         * @returns {ApiItem[]}
         */
        _flattenNamespaces(items) {
            // for a package, collect all nested namespaces and treat them as children of the top level
            if (this._currentApiItem.kind === "Package") {
                /** @type {ApiItem[]} */
                const flattenedChildren = [];
                /**
                 * @param {readonly ApiItem[]} children
                 * @param {boolean} nsOnly
                 */
                const flatten = (children, nsOnly) => {
                    for (const child of children) {
                        if (child.kind === "Namespace") {
                            flattenedChildren.push(child);
                            flatten(child.members, true);
                        }
                        else if (!nsOnly) {
                            flattenedChildren.push(child);
                        }
                    }
                };
                flatten(items, false);
                return flattenedChildren;
            }
            else {
                return items.filter(child => child.kind !== "Namespace");
            }
        }

        /**
         * @protected
         * @param {string} apiItemKind
         */
        _shouldEmbed(apiItemKind) {
            // @ts-ignore
            return apiItemKind === "Namespace" ? false : super._shouldEmbed(apiItemKind);
        }

        /**
         * @private
         * @param {ApiDocumentedItem} apiItem
         * @param {IYamlApiFile | undefined} parentYamlFile
         * @returns {IYamlItem}
         */
        _generateYamlItem(apiItem, parentYamlFile) {
            if (apiItem.kind === "Namespace") {
                const proxy = Object.create(apiItem, { kind: { value: "Enum" } });
                // @ts-ignore
                const yamlItem = super._generateYamlItem(proxy, parentYamlFile);
                yamlItem.type = "namespace";
                return yamlItem;
            }
            // @ts-ignore
            return super._generateYamlItem(apiItem, parentYamlFile);
        }

        /**
         * @private
         * @param {readonly import("@microsoft/api-extractor-model").ApiItem[]} apiItems
         * @returns {import("@microsoft/api-documenter/lib/yaml/IYamlTocFile").IYamlTocItem[]}
         */
        _buildTocItems(apiItems) {
            let tocItems = [];
            for (const apiItem of apiItems) {
                if (apiItem.kind === "Namespace") {
                    const proxy = Object.create(apiItem, { kind: { value: "Enum" } });
                    // @ts-ignore
                    tocItems = tocItems.concat(super._buildTocItems([proxy]));
                }
                else {
                    // @ts-ignore
                    tocItems = tocItems.concat(super._buildTocItems([apiItem]));
                }
            }
            return tocItems;
        }

        /**
         * @private
         * @param {{}} dataObject
         * @param {string} filePath
         * @param {string} yamlMimeType
         * @param {JsonSchema?} schema
         */
        _writeYamlFile(dataObject, filePath, yamlMimeType, schema) {
            if (schema && schema.shortName === "typescript.schema.json") {
                schema = yamlApiSchema;
            }
            // @ts-ignore
            return super._writeYamlFile(dataObject, filePath, yamlMimeType, schema);
        }
    });
});