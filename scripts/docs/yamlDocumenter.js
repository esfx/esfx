// @ts-check
const path = require("path");
const { ApiModel, ApiItem, ApiDocumentedItem, ApiDeclaredItem, ApiEnumMember, ApiConstructor, ApiFunction, ApiPropertyItem, ApiItemContainerMixin, ApiParameterListMixin, ApiReleaseTagMixin } = require("@microsoft/api-extractor-model");
const { YamlDocumenter } = require("@microsoft/api-documenter/lib/documenters/YamlDocumenter");
const { Utilities } = require("@microsoft/api-documenter/lib/utils/Utilities");
const { PackageName, JsonSchema } = require("@microsoft/node-core-library");

/**
 * @typedef {import("@microsoft/api-documenter/lib/yaml/IYamlApiFile").IYamlApiFile} IYamlApiFile;
 * @typedef {import("@microsoft/api-documenter/lib/yaml/IYamlApiFile").IYamlItem} IYamlItem;
 * @typedef {import("@microsoft/api-documenter/lib/yaml/IYamlTocFile").IYamlTocItem} IYamlTocItem;
 */
void 0;

const yamlApiSchema = JsonSchema.fromFile(require.resolve("./typescript.schema.json"));
const kSafeNames = Symbol();
const kCollisionMap = Symbol();

// @ts-ignore
class CustomYamlDocumenter extends YamlDocumenter {
    constructor(apiModel) {
        super(apiModel);
        /** @type {Map<ApiItem, string>} */
        this[kSafeNames] = new Map();
        /** @type {Map<ApiItem, boolean>} */
        this[kCollisionMap] = new Map();
    }

    onGetTocRoot() {
        return {
            name: "@esfx reference",
            uid: "esfx",
            items: []
        }
    }

    /**
     * @param {string} apiItemKind
     */
    _shouldEmbed(apiItemKind) {
        switch (apiItemKind) {
            case "Class":
            case "Namespace":
            case "Package":
            case "Interface":
            case "Enum":
                return false;
        }
        return true;
    }

    /**
     * @private
     * @param {ApiDocumentedItem} apiItem
     * @param {IYamlApiFile | undefined} parentYamlFile
     */
    _visitApiItems(apiItem, parentYamlFile) {
        /** @type {IYamlItem|undefined} */
        // @ts-ignore
        const yamlItem = this._generateYamlItem(apiItem);
        if (!yamlItem) {
            return false;
        }

        this.onCustomizeYamlItem(yamlItem);

        if (this._shouldEmbed(apiItem.kind)) {
            if (!parentYamlFile) {
                throw new Error('Missing file context');
            }
            parentYamlFile.items.push(yamlItem);
        } else {
            /** @type {IYamlApiFile} */
            const newYamlFile = {
                items: []
            };
            newYamlFile.items.push(yamlItem);

            /** @type {ReadonlyArray<ApiItem>} */
            let children;
            if (apiItem.kind === "Package") {
                // Skip over the entry point, since it's not part of the documentation hierarchy
                children = apiItem.members[0].members;
            } else {
                children = apiItem.members;
            }

            // for a package, collect all nested namespaces and treat them as children of the top level
            const nonNamespaceChildren = children.filter(child => child.kind !== "Namespace");
            if (apiItem.kind === "Package") {
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
                flatten(children, false);
                children = flattenedChildren;
            }
            else {
                children = nonNamespaceChildren;
            }

            for (const child of children) {
                if (child instanceof ApiDocumentedItem) {
                    if (this._visitApiItems(child, newYamlFile)) {
                        if (!yamlItem.children) {
                            yamlItem.children = [];
                        }
                        yamlItem.children.push(this._getUid(child));
                    }
                }
            }

            const yamlFilePath = this._getYamlFilePath(apiItem);

            if (apiItem.kind === "Package") {
                console.log('Writing ' + yamlFilePath);
            }

            // @ts-ignore
            this._writeYamlFile(newYamlFile, yamlFilePath, 'UniversalReference', yamlApiSchema);

            if (parentYamlFile) {
                if (!parentYamlFile.references) {
                    parentYamlFile.references = [];
                }

                parentYamlFile.references.push({
                    uid: this._getUid(apiItem),
                    // @ts-ignore
                    name: this._getYamlItemName(apiItem)
                });

            }
        }

        return true;
    }

    /**
     * @param {ReadonlyArray<ApiItem>} items
     */
    _collectNamespaces(items) {
        /** @type {ApiItem[]} */
        const namespaces = [];
        for (const item of items) {
            if (item.kind === "Namespace") {
                namespaces.push(item);
                namespaces.push(...this._collectNamespaces(item.members));
            }
        }
        return namespaces;
    }

    /**
     * @param {ApiDocumentedItem} apiItem
     */
    _generateYamlItem(apiItem) {
        // Filter out known items that are not yet supported
        switch (apiItem.kind) {
            case "CallSignature":
            case "ConstructSignature":
            case "IndexSignature":
            case "TypeAlias":
            case "Variable":
                return undefined;
        }

        /** @type {Partial<IYamlItem>} */
        const yamlItem = {};
        yamlItem.uid = this._getUid(apiItem);

        if (apiItem.tsdocComment) {
            const tsdocComment = apiItem.tsdocComment;
            if (tsdocComment.summarySection) {
                // @ts-ignore
                const summary = this._renderMarkdown(tsdocComment.summarySection, apiItem);
                if (summary) {
                    yamlItem.summary = summary;
                }
            }

            if (tsdocComment.remarksBlock) {
                // @ts-ignore
                const remarks = this._renderMarkdown(tsdocComment.remarksBlock.content, apiItem);
                if (remarks) {
                    yamlItem.remarks = remarks;
                }
            }

            if (tsdocComment.deprecatedBlock) {
                // @ts-ignore
                const deprecatedMessage = this._renderMarkdown(tsdocComment.deprecatedBlock.content, apiItem);
                if (deprecatedMessage.length > 0) {
                    yamlItem.deprecated = { content: deprecatedMessage };
                }
            }
        }

        if (ApiReleaseTagMixin.isBaseClassOf(apiItem)) {
            if (apiItem.releaseTag === 3 /*ReleaseTag.Beta*/) {
                yamlItem.isPreview = true;
            }
        }

        // @ts-ignore
        yamlItem.name = this._getYamlItemName(apiItem);

        yamlItem.fullName = yamlItem.name;
        yamlItem.langs = ['typeScript'];

        switch (apiItem.kind) {
            case "Enum":
                yamlItem.type = 'enum';
                break;
            case "EnumMember":
                yamlItem.type = 'field';
                const enumMember = /** @type {ApiEnumMember} */(apiItem);

                if (enumMember.initializerExcerpt.text.length > 0) {
                    yamlItem.numericValue = enumMember.initializerExcerpt.text;
                }

                break;
            case "Class":
                yamlItem.type = 'class';
                // @ts-ignore
                this._populateYamlClassOrInterface(yamlItem, apiItem);
                break;
            case "Interface":
                yamlItem.type = 'interface';
                // @ts-ignore
                this._populateYamlClassOrInterface(yamlItem, apiItem);
                break;
            case "Method":
            case "MethodSignature":
                yamlItem.type = 'method';
                // @ts-ignore
                this._populateYamlFunctionLike(yamlItem, /** @type {ApiMethod | ApiMethodSignature} */(apiItem));
                break;

            case "Constructor":
                yamlItem.type = 'constructor';
                // @ts-ignore
                this._populateYamlFunctionLike(yamlItem, /** @type {ApiConstructor} */(apiItem));
                break;

            case "Namespace":
                // @ts-ignore
                yamlItem.type = 'namespace';
                break;

            case "Package":
                yamlItem.type = 'package';
                break;
            case "Property":
            case "PropertySignature":
                const apiProperty = /** @type {ApiPropertyItem} */(apiItem);
                if (apiProperty.isEventProperty) {
                    yamlItem.type = 'event';
                } else {
                    yamlItem.type = 'property';
                }
                // @ts-ignore
                this._populateYamlProperty(yamlItem, apiProperty);
                break;

            case "Function":
                yamlItem.type = 'function';
                // @ts-ignore
                this._populateYamlFunctionLike(yamlItem, /** @type {ApiFunction} */(apiItem));
                break;

            default:
                throw new Error('Unimplemented item kind: ' + apiItem.kind);
        }

        if (apiItem.kind !== "Package" && !this._shouldEmbed(apiItem.kind)) {
            const associatedPackage = apiItem.getAssociatedPackage();
            if (!associatedPackage) {
                throw new Error('Unable to determine associated package for ' + apiItem.displayName);
            }
            yamlItem.package = this._getUid(associatedPackage);
        }

        return /** @type {IYamlItem} */(yamlItem);
    }

    /**
     * @param {ApiItem} apiItem
     */
    _collidesWithItemsOfSameName(apiItem) {
        let collision = this[kCollisionMap].get(apiItem);
        if (collision === undefined) {
            if (apiItem.kind === "Class" ||
                apiItem.kind === "Interface" ||
                apiItem.kind === "Function" ||
                apiItem.kind === "Namespace") {
                const same = apiItem.parent.members.filter(m => m.displayName === apiItem.displayName);
                collision = same.length > 1;
                for (const item of same) {
                    this[kCollisionMap].set(item, collision);
                }
            }
        }
        return collision;
    }

    /**
     * @param {ApiItem} apiItem
     */
    _getSafeName(apiItem) {
        let safeName = this[kSafeNames].get(apiItem);
        if (!safeName) {
            safeName = apiItem.displayName;
            if (safeName === "__computed" && apiItem instanceof ApiDeclaredItem) {
                const match = /\[[^\[\]]+\]/.exec(apiItem.excerpt.text);
                if (match) {
                    safeName = match[0];
                }
            }
            if (this._collidesWithItemsOfSameName(apiItem)) {
                safeName += `_${apiItem.kind}`;
            }
            // For overloaded methods, add a suffix such as "MyClass.myMethod_2".
            if (ApiParameterListMixin.isBaseClassOf(apiItem)) {
                if (apiItem.overloadIndex > 0) {
                    safeName += `_${apiItem.overloadIndex}`;
                }
            }
            this[kSafeNames].set(apiItem, safeName);
        }
        return safeName;
    }

    /**
     * @param {ApiItem} apiItem
     */
    _getUid(apiItem) {
        let result = '';
        for (const hierarchyItem of apiItem.getHierarchy()) {
            switch (hierarchyItem.kind) {
                case "Model" /* Model */:
                case "EntryPoint" /* EntryPoint */:
                    break;
                case "Package" /* Package */:
                    result += PackageName.getUnscopedName(hierarchyItem.displayName);
                    break;
                default:
                    result += '.';
                    result += this._getSafeName(hierarchyItem);
                    break;
            }
        }
        return result;
    }

    /**
     * @param {ApiItem} apiItem
     */
    _getYamlFilePath(apiItem) {
        let result = '';
        for (const current of apiItem.getHierarchy()) {
            switch (current.kind) {
                case "Model" /* Model */:
                case "EntryPoint" /* EntryPoint */:
                    break;
                case "Package" /* Package */:
                    result += PackageName.getUnscopedName(current.displayName);
                    break;
                default:
                    if (current.parent && current.parent.kind === "EntryPoint" /* EntryPoint */) {
                        result += '/';
                    }
                    else {
                        result += '.';
                    }
                    result += this._getSafeName(current);
                    break;
            }
        }

        // @ts-ignore
        return path.join(this._outputFolder, result.toLowerCase() + '.yml');
    }

    /**
     * @param {ApiItem} apiItem
     */
    _getYamlItemName(apiItem) {
        return Utilities.getConciseSignature(apiItem).replace(/^\(constructor\)/, "constructor");
    }

    /**
     * @param {readonly ApiItem[]} apiItems
     */
    _buildTocItems(apiItems) {
        /** @type {IYamlTocItem[]} */
        const tocItems = [];
        for (const apiItem of apiItems) {
            /** @type {IYamlTocItem} */
            let tocItem;
            if (this._shouldEmbed(apiItem.kind)) {
                // Don't generate table of contents items for embedded definitions
                continue;
            }

            if (apiItem.kind === "Package") {
                tocItem = {
                    name: PackageName.getUnscopedName(apiItem.displayName),
                    uid: this._getUid(apiItem)
                };
            } else {
                let name = apiItem.displayName;
                if (this._collidesWithItemsOfSameName(apiItem)) {
                    name = `${name} (${apiItem.kind})`;
                }

                tocItem = {
                    name,
                    uid: this._getUid(apiItem)
                };
            }

            tocItems.push(tocItem);

            /** @type {readonly ApiItem[]} */
            let children;
            if (apiItem.kind === "Package") {
                // Skip over the entry point, since it's not part of the documentation hierarchy
                children = apiItem.members[0].members;
            } else {
                children = apiItem.members;
            }

            const childItems = this._buildTocItems(children);
            if (childItems.length > 0) {
                tocItem.items = childItems;
            }
        }
        return tocItems;
    }
}

exports.CustomYamlDocumenter = CustomYamlDocumenter;