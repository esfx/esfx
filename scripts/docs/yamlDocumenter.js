// @ts-check
const path = require("path");
const ts = require("typescript");
const { ApiModel, ApiClass, ApiInterface, ApiItem, ApiDocumentedItem, ApiDeclaredItem, ApiEnumMember, ApiConstructor, ApiFunction, ApiMethod, ApiMethodSignature, ApiPropertyItem, ApiItemContainerMixin, ApiParameterListMixin, ApiReturnTypeMixin, ApiReleaseTagMixin, Excerpt } = require("@microsoft/api-extractor-model");
const { YamlDocumenter } = require("@microsoft/api-documenter/lib/documenters/YamlDocumenter");
const { Utilities } = require("@microsoft/api-documenter/lib/utils/Utilities");
const { PackageName, JsonSchema } = require("@microsoft/node-core-library");

/**
 * @typedef {import("@microsoft/api-documenter/lib/yaml/IYamlApiFile").IYamlApiFile} IYamlApiFile;
 * @typedef {import("@microsoft/api-documenter/lib/yaml/IYamlApiFile").IYamlItem} IYamlItem;
 * @typedef {import("@microsoft/api-documenter/lib/yaml/IYamlApiFile").IYamlSyntax} IYamlSyntax;
 * @typedef {import("@microsoft/api-documenter/lib/yaml/IYamlApiFile").IYamlParameter} IYamlParameter;
 * @typedef {import("@microsoft/api-documenter/lib/yaml/IYamlTocFile").IYamlTocItem} IYamlTocItem;
 * @typedef {{uid?: string, name: string, fullName: string}} IYamlReferenceSpec;
 */
void 0;

const yamlApiSchema = JsonSchema.fromFile(require.resolve("./typescript.schema.json"));

const kSafeNames = Symbol("kSafeNames");
const kCollisionMap = Symbol("kCollisionMap");
const kFlattenChildren = Symbol("kFlattenChildren");
const kCollidesWithItemsOfSameName = Symbol("kCollidesWithItemsOfSameName");
const kGetSafeName = Symbol("kGetSafeName");
const kAdaptType = Symbol("kAdaptType");
const kAddReference = Symbol("kAddReference");

// @ts-ignore
class CustomYamlDocumenter extends YamlDocumenter {
    /**
     * @param {ApiModel} apiModel
     */
    constructor(apiModel) {
        super(apiModel);
        /** @type {Map<ApiItem, string>} */
        this[kSafeNames] = new Map();
        /** @type {Map<ApiItem, boolean>} */
        this[kCollisionMap] = new Map();
    }

    // public generateFiles(outputFolder: string): void;

    /**
     * @protected
     * @returns {IYamlTocItem}
     */
    onGetTocRoot() {
        return {
            name: "@esfx reference",
            uid: "esfx",
            items: []
        }
    }

    // protected onCustomizeYamlItem(yamlItem: IYamlItem): void;

    /**
     * @private
     * @param {ApiDocumentedItem} apiItem
     * @param {IYamlApiFile | undefined} parentYamlFile
     */
    _visitApiItems(apiItem, parentYamlFile) {
        /** @type {IYamlItem|undefined} */
        const yamlItem = this._generateYamlItem(apiItem, parentYamlFile);
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
            // if (apiItem.kind === "Package") {
            //     // Skip over the entry point, since it's not part of the documentation hierarchy
            //     // for a package, collect all nested namespaces and treat them as children of the top level
            //     children = this[kFlattenChildren](apiItem.members[0].members, /*nsHandling*/ "allowed");
            // } else {
            //     // for anything else, skip over namespaces
            //     children = this[kFlattenChildren](apiItem.members, /*nsHandling*/ "no-namespace");
            // }

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
     * @private
     * @param {readonly ApiItem[]} children
     * @param {"namespace-only" | "no-namespace" | "allowed"} nsHandling
     */
    [kFlattenChildren](children, nsHandling) {
        /** @type {ApiItem[]} */
        let flattenedChildren = [];
        for (const child of children) {
            if (child.kind === "Namespace") {
                if (nsHandling !== "no-namespace") {
                    flattenedChildren.push(child);
                    flattenedChildren = [...flattenedChildren, ...this[kFlattenChildren](child.members, "namespace-only")];
                }
            }
            else if (nsHandling !== "no-namespace") {
                flattenedChildren.push(child);
            }
        }
        return flattenedChildren;
    }

    /**
     * @private
     * @param {readonly ApiItem[]} items
     * @returns {ApiItem[]}
     */
    _flattenNamespaces(items) {
        throw new TypeError("Not implemented");
    }

    // private _writeTocFile(apiItems: ReadonlyArray<ApiItem>): void
    // protected buildYamlTocFile(apiItems: ReadonlyArray<ApiItem>): IYamlTocFile

    /**
     * @private
     * @param {readonly ApiItem[]} apiItems
     * @returns {IYamlTocItem[]}
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
                if (this[kCollidesWithItemsOfSameName](apiItem)) {
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

    /**
     * @protected
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
     * @returns {IYamlItem}
     */
    _generateYamlItem(apiItem, parentYamlFile) {
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
            if (apiItem.releaseTag === 3) {
                yamlItem.isPreview = true;
            }
        }

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
                this._populateYamlClassOrInterface(yamlItem, apiItem, parentYamlFile);
                break;
            case "Interface":
                yamlItem.type = 'interface';
                // @ts-ignore
                this._populateYamlClassOrInterface(yamlItem, apiItem, parentYamlFile);
                break;
            case "Method":
            case "MethodSignature":
                yamlItem.type = 'method';
                // @ts-ignore
                this._populateYamlFunctionLike(yamlItem, /** @type {ApiMethod | ApiMethodSignature} */(apiItem), parentYamlFile);
                break;

            case "Constructor":
                yamlItem.type = 'constructor';
                this._populateYamlFunctionLike(yamlItem, /** @type {ApiConstructor} */(apiItem), parentYamlFile);
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
                this._populateYamlProperty(yamlItem, apiProperty, parentYamlFile);
                break;

            case "Function":
                yamlItem.type = 'function';
                // @ts-ignore
                this._populateYamlFunctionLike(yamlItem, /** @type {ApiFunction} */(apiItem), parentYamlFile);
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
     * @private
     * @param {Partial<IYamlItem>} yamlItem
     * @param {ApiDocumentedItem} apiItem
     * @param {IYamlApiFile | undefined} parentYamlFile
     * @returns {void}
     */
    _populateYamlClassOrInterface(yamlItem, apiItem, parentYamlFile) {
        if (apiItem instanceof ApiClass) {
            if (apiItem.extendsType) {
                yamlItem.extends = [this[kAdaptType](apiItem.extendsType.excerpt, parentYamlFile)];
            }
            if (apiItem.implementsTypes.length > 0) {
                yamlItem.implements = [];
                for (const implementsType of apiItem.implementsTypes) {
                    yamlItem.implements.push(this[kAdaptType](implementsType.excerpt, parentYamlFile));
                }
            }
        } else if (apiItem instanceof ApiInterface) {
            if (apiItem.extendsTypes.length > 0) {
                yamlItem.extends = [];
                for (const extendsType of apiItem.extendsTypes) {
                    yamlItem.extends.push(this[kAdaptType](extendsType.excerpt, parentYamlFile));
                }
            }
        }

        if (apiItem.tsdocComment) {
            if (apiItem.tsdocComment.modifierTagSet.isSealed()) {
                let sealedMessage;
                if (apiItem.kind === "Class") {
                    sealedMessage = 'This class is marked as `@sealed`. Subclasses should not extend it.';
                } else {
                    sealedMessage = 'This interface is marked as `@sealed`. Other interfaces should not extend it.';
                }
                if (!yamlItem.remarks) {
                    yamlItem.remarks = sealedMessage;
                } else {
                    yamlItem.remarks = sealedMessage + '\n\n' + yamlItem.remarks;
                }
            }
        }
    }

    /**
     * @private
     * @param {Partial<IYamlItem>} yamlItem
     * @param {ApiMethod | ApiMethodSignature | ApiConstructor | ApiFunction} apiItem
     * @param {IYamlApiFile | undefined} parentYamlFile
     * @returns {void}
     */
    _populateYamlFunctionLike(yamlItem, apiItem, parentYamlFile) {
        /** @type {IYamlSyntax} */
        const syntax = {
            content: apiItem.getExcerptWithModifiers()
        };
        yamlItem.syntax = syntax;

        if (ApiReturnTypeMixin.isBaseClassOf(apiItem)) {
            const returnType = this[kAdaptType](apiItem.returnTypeExcerpt, parentYamlFile);

            let returnDescription = '';

            if (apiItem.tsdocComment && apiItem.tsdocComment.returnsBlock) {
                // @ts-ignore
                returnDescription = this._renderMarkdown(apiItem.tsdocComment.returnsBlock.content, apiItem);
                // temporary workaround for people who mistakenly add a hyphen, e.g. "@returns - blah"
                returnDescription = returnDescription.replace(/^\s*-\s+/, '');
            }

            if (returnType || returnDescription) {
                syntax.return = {
                    type: [returnType],
                    description: returnDescription
                };
            }
        }

        /** @type {IYamlParameter[]} */
        const parameters = [];
        for (const apiParameter of apiItem.parameters) {
            let parameterDescription = '';
            if (apiParameter.tsdocParamBlock) {
                // @ts-ignore
                parameterDescription = this._renderMarkdown(apiParameter.tsdocParamBlock.content, apiItem);
            }

            parameters.push(
                {
                    id: apiParameter.name,
                    description: parameterDescription,
                    type: [this[kAdaptType](apiParameter.parameterTypeExcerpt, parentYamlFile)]
                }
            );
        }

        if (parameters.length) {
            syntax.parameters = parameters;
        }
    }

    /**
     * @private
     * @param {Partial<IYamlItem>} yamlItem 
     * @param {ApiPropertyItem} apiItem 
     * @param {IYamlApiFile | undefined} parentYamlFile
     * @returns {void}
     */
    _populateYamlProperty(yamlItem, apiItem, parentYamlFile) {
        /** @type {IYamlSyntax} */
        const syntax = {
            content: apiItem.getExcerptWithModifiers()
        };
        yamlItem.syntax = syntax;

        if (apiItem.propertyTypeExcerpt.text) {
            syntax.return = {
                type: [this[kAdaptType](apiItem.propertyTypeExcerpt, parentYamlFile)]
            };
        }
    }

    // private _renderMarkdown(docSection: DocSection, contextApiItem: ApiItem): string
    // private _writeYamlFile(dataObject: {}, filePath: string, yamlMimeType: string, schema: JsonSchema|undefined): void

    /**
     * @protected
     * @param {ApiItem} apiItem
     * @returns {string}
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
                    result += this[kGetSafeName](hierarchyItem);
                    break;
            }
        }
        return result;
    }

    // private _initApiItemsByTypeName(): void
    // private _initApiItemsByTypeNameRecursive(apiItem: ApiItem, ambiguousNames: Set<string>): void
    // private _linkToUidIfPossible(typeName: string): string
    // private _getTypeNameWithDot(apiItem: ApiItem): string | undefined

    /**
     * @private
     * @param {ApiItem} apiItem
     * @returns {string}
     */
    _getYamlItemName(apiItem) {
        return Utilities.getConciseSignature(apiItem).replace(/^\(constructor\)/, "constructor");
    }


    /**
     * @param {ApiItem} apiItem
     * @returns {string}
     */
    _getYamlFilePath(apiItem) {
        let result = '';
        for (const current of apiItem.getHierarchy()) {
            switch (current.kind) {
                case "Model":
                case "EntryPoint":
                    break;
                case "Package":
                    result += PackageName.getUnscopedName(current.displayName);
                    break;
                default:
                    if (current.parent && current.parent.kind === "EntryPoint") {
                        result += '/';
                    }
                    else {
                        result += '.';
                    }
                    result += this[kGetSafeName](current);
                    break;
            }
        }

        // @ts-ignore
        return path.join(this._outputFolder, result.toLowerCase() + '.yml');
    }

    // private _deleteOldOutputFiles(): void

    /**
     * @private
     * @param {ApiItem} apiItem
     */
    [kCollidesWithItemsOfSameName](apiItem) {
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
     * @private
     * @param {ApiItem} apiItem
     */
    [kGetSafeName](apiItem) {
        let safeName = this[kSafeNames].get(apiItem);
        if (!safeName) {
            safeName = apiItem.displayName;
            if (safeName === ts.InternalSymbolName.Computed && apiItem instanceof ApiDeclaredItem) {
                const match = /\[[^\[\]]+\]/.exec(apiItem.excerpt.text);
                if (match) {
                    safeName = match[0];
                }
            }
            if (this[kCollidesWithItemsOfSameName](apiItem)) {
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
     * @param {Excerpt} typeExcerpt
     * @param {IYamlApiFile | undefined} parentYamlFile
     */
    [kAdaptType](typeExcerpt, parentYamlFile) {
        if (typeExcerpt.tokens.length === 1 || !parentYamlFile) {
            // @ts-ignore
            return this._linkToUidIfPossible(typeExcerpt.text);
        }
        let uid = "";
        let name = "";
        let fullName = "";
        /** @type {IYamlReferenceSpec[]} */
        const specs = [];
        for (const token of typeExcerpt.tokens.slice(typeExcerpt.tokenRange.startIndex, typeExcerpt.tokenRange.endIndex)) {
            /** @type {IYamlReferenceSpec} */
            let spec;
            if (token.kind === "Reference") {
                const typeName = token.text.trim();
                /** @type {ApiItem | undefined} */
                // @ts-ignore
                const apiItem = this._apiItemsByTypeName.get(typeName);
                spec = {
                    uid: apiItem ? this._getUid(apiItem) : typeName,
                    name: apiItem ? apiItem.displayName : typeName,
                    fullName: apiItem ? apiItem.getScopedNameWithinPackage() : typeName,
                };
                uid += spec.uid;
                name += spec.name;
                fullName += spec.fullName;
            }
            else {
                spec = {
                    name: token.text,
                    fullName: token.text
                };
                uid += token.text.replace(/\s*(=>|[,.|:&<>{}()\[\]])\s*/g, (_, s) => {
                    return s === "{" ? "{{" :
                        s === "}" ? "}}" :
                        s === "<" ? "{" :
                        s === ">" ? "}" :
                        s === "=>" ? ":" :
                        s;
                });
                name += token.text;
                fullName += token.text;
            }
            specs.push(spec);
        }
        if (!parentYamlFile.references) {
            parentYamlFile.references = [];
        }
        if (!parentYamlFile.references.find(ref => ref.uid === uid)) {
            parentYamlFile.references.push({
                uid,
                // @ts-ignore
                "name.typeScript": name,
                "fullName.typeScript": fullName,
                "spec.typeScript": specs,
            });
        }
        return uid;
    }
}

exports.CustomYamlDocumenter = CustomYamlDocumenter;