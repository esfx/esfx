// @ts-check
const { CustomMarkdownEmitter } = require("@microsoft/api-documenter/lib/markdown/CustomMarkdownEmitter");
const { BetaOrLegacyDocDeclarationReference } = require("../tsdoc/betaOrLegacyDocDeclarationReference");

const prev_writeLinkTagWithCodeDestination = CustomMarkdownEmitter.prototype["writeLinkTagWithCodeDestination"];

/**
 * @param {import("@microsoft/tsdoc").DocLinkTag} docLinkTag 
 * @param {import("@microsoft/api-documenter/lib/markdown/MarkdownEmitter").IMarkdownEmitterContext} context 
 */
CustomMarkdownEmitter.prototype["writeLinkTagWithCodeDestination"] = function (docLinkTag, context) {
    const writer = context.writer;
    const options = context.options;
    const result = this["_apiModel"].resolveDeclarationReference(docLinkTag.codeDestination, options.contextApiItem);
    const text = docLinkTag.linkText || "";
    const xref =
        result.resolvedApiItem ? options.onGetFilenameForApiItem(result.resolvedApiItem) :
        docLinkTag.codeDestination instanceof BetaOrLegacyDocDeclarationReference && docLinkTag.codeDestination.betaDeclarationReference ? 
            `xref:${encodeUID(docLinkTag.codeDestination.betaDeclarationReference.toString())}` :
            `xref:${encodeUID(docLinkTag.codeDestination.emitAsTsdoc())}`;

    if (text) {
        const encodedLinkText = this["getEscapedText"](text.replace(/\s+/g, ' '));
        writer.write(`[${encodedLinkText}](${xref})`);
    }
    else {
        writer.write(`<${xref}>`);
    }
};

/**
 * @param {string} uid
 */
function encodeUID(uid) {
    return encodeURI(uid)
        .replace(/[#?]/g, (s) => encodeURIComponent(s))
        .replace(/(\([^(]*\))|[()]/g, (s, balanced) => balanced || '\\' + s);
}