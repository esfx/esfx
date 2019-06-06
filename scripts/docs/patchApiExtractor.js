// @ts-check
const { ApiTypeAlias: OriginalApiTypeAlias } = require("@microsoft/api-extractor-model");
const api_extractor_model_1 = require("@microsoft/api-extractor-model");
const ApiTypeAlias_1 = require("@microsoft/api-extractor-model/lib/model/ApiTypeAlias");
const { ApiModelGenerator } = require("@microsoft/api-extractor/lib/generators/ApiModelGenerator");
const { ExcerptBuilder } = require("@microsoft/api-extractor/lib/generators/ExcerptBuilder");
const ts = require("typescript");

/**
 * @typedef {import("@microsoft/api-extractor/lib/analyzer/AstDeclaration").AstDeclaration} AstDeclaration
 * @typedef {import("@microsoft/api-extractor-model").ApiItemContainerMixin} ApiItemContainerMixin
 * @typedef {import("@microsoft/api-extractor-model").IExcerptTokenRange} IExcerptTokenRange
 * @typedef {import("@microsoft/api-extractor-model").IApiTypeAliasOptions&{aliasTypeTokenRange:IExcerptTokenRange}} IApiTypeAliasOptions
 * @typedef {Parameters<typeof OriginalApiTypeAlias["onDeserializeInto"]>[1]&{aliasTypeTokenRange:IExcerptTokenRange}} IApiTypeAliasJson
 */
void 0;

class ApiTypeAlias extends OriginalApiTypeAlias {
    /**
     * @param {Partial<IApiTypeAliasOptions>} options
     * @param {IApiTypeAliasJson} jsonObject
     */
    static onDeserializeInto (options, jsonObject) {
        console.log("ApiTypeAliasEx.onDeserializeInto");
        super.onDeserializeInto(options, jsonObject);
        options.aliasTypeTokenRange = jsonObject.aliasTypeTokenRange;
    }

    /**
     * @param {IApiTypeAliasOptions} options
     */
    constructor(options) {
        console.log("ApiTypeAliasEx.#ctor");
        super(options);
        this.aliasTypeExcerpt = this.buildExcerpt(options.aliasTypeTokenRange || { startIndex: 0, endIndex: 0 });
    }

    /**
     * @param {Partial<IApiTypeAliasJson>} jsonObject
     */
    serializeInto(jsonObject) {
        console.log("ApiTypeAliasEx.prototype.serializeInto");
        super.serializeInto(jsonObject);
        jsonObject.aliasTypeTokenRange = this.aliasTypeExcerpt.tokenRange;
    }
};

// @ts-ignore
ApiTypeAlias_1.ApiTypeAlias = ApiTypeAlias;
api_extractor_model_1.ApiTypeAlias = ApiTypeAlias;

/**
 * @param {AstDeclaration} astDeclaration
 * @param {string?} exportedName
 * @param {ApiItemContainerMixin} parentApiItem
 */
// @ts-ignore
ApiModelGenerator.prototype._processApiTypeAlias = function(astDeclaration, exportedName, parentApiItem) {
    console.log("ApiModelGenerator.prototype._processApiTypeAlias");
    const name = !!exportedName ? exportedName : astDeclaration.astSymbol.localName;
    const canonicalReference = ApiTypeAlias.getCanonicalReference(name);

    let apiTypeAlias = /** @type {ApiTypeAlias?} */(parentApiItem.tryGetMember(canonicalReference));
    if (apiTypeAlias === undefined) {
      const typeAliasDeclaration = /** @type {ts.TypeAliasDeclaration} */(astDeclaration.declaration);
      const nodesToCapture = [];
      // @ts-ignore
      const aliasTypeTokenRange = ExcerptBuilder.createEmptyTokenRange();
      nodesToCapture.push({ node: typeAliasDeclaration.type, tokenRange: aliasTypeTokenRange });

      const excerptTokens = ExcerptBuilder.build({
        startingNode: astDeclaration.declaration,
        nodesToCapture
      });
      // @ts-ignore
      const docComment = this._collector.fetchMetadata(astDeclaration).tsdocComment;
      // @ts-ignore
      const releaseTag = this._collector.fetchMetadata(astDeclaration.astSymbol).releaseTag;
      // @ts-ignore
      apiTypeAlias = new ApiTypeAlias({ name, docComment, releaseTag, excerptTokens, aliasTypeTokenRange });
      parentApiItem.addMember(apiTypeAlias);
    }
};