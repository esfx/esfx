// @ts-check
require("@microsoft/api-extractor-model");
const { NodeParser } = require("@microsoft/tsdoc/lib-commonjs/parser/NodeParser");
module.exports = {};

const prev_parseLinkTagCodeDestination = NodeParser.prototype["_parseLinkTagCodeDestination"];

// _parseLinkTagCodeDestination
/**
 * @param {import("@microsoft/tsdoc/lib/parser/TokenReader").TokenReader} embeddedTokenReader
 * @param {import("@microsoft/tsdoc/lib/nodes/DocLinkTag").IDocLinkTagParsedParameters} parameters
 * @param {*} tokenSequenceForErrorContext
 * @param {*} nodeForErrorContext
 * @returns
 */
NodeParser.prototype["_parseLinkTagCodeDestination"] = function(embeddedTokenReader, parameters, tokenSequenceForErrorContext, nodeForErrorContext) {
    if (prev_parseLinkTagCodeDestination.call(this, embeddedTokenReader, parameters, tokenSequenceForErrorContext, nodeForErrorContext)) {
        this._tryReadSpacingAndNewlines(embeddedTokenReader);
        return true;
    }
    return false;
};
