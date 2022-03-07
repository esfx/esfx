// fixes https://github.com/microsoft/tsdoc/issues/128#issuecomment-565673442

const { NodeParser } = require("@microsoft/tsdoc/lib-commonjs/parser/NodeParser");
var Token_1 = require("@microsoft/tsdoc/lib-commonjs/parser/Token");
var StringChecks_1 = require("@microsoft/tsdoc/lib-commonjs/parser/StringChecks");
var nodes_1 = require("@microsoft/tsdoc/lib-commonjs/nodes");

NodeParser.prototype._parseParamBlock = function (tokenReader, docBlockTag) {
    var startMarker = tokenReader.createMarker();
    var spacingBeforeParameterNameExcerpt = this._tryReadSpacingAndNewlines(tokenReader);
    var parameterName = '';
    var done = false;
    while (!done) {
        switch (tokenReader.peekTokenKind()) {
            case Token_1.TokenKind.AsciiWord:
            case Token_1.TokenKind.Period:
            case Token_1.TokenKind.DollarSign:
                parameterName += tokenReader.readToken();
                break;
            default:
                done = true;
                break;
        }
    }
    var explanation = StringChecks_1.StringChecks.explainIfInvalidUnquotedIdentifier(parameterName);
    if (explanation !== undefined) {
        tokenReader.backtrackToMarker(startMarker);
        var errorParamBlock = new nodes_1.DocParamBlock({
            configuration: this._configuration,
            blockTag: docBlockTag,
            parameterName: ''
        });
        var errorMessage = parameterName.length > 0
            ? 'The @param block should be followed by a valid parameter name: ' + explanation
            : 'The @param block should be followed by a parameter name';
        this._parserContext.log.addMessageForTokenSequence("tsdoc-param-tag-with-invalid-name" /* ParamTagWithInvalidName */, errorMessage, docBlockTag.getTokenSequence(), docBlockTag);
        return errorParamBlock;
    }
    var parameterNameExcerpt = tokenReader.extractAccumulatedSequence();
    // TODO: Warn if there is no space before or after the hyphen
    var spacingAfterParameterNameExcerpt = this._tryReadSpacingAndNewlines(tokenReader);
    var hyphenExcerpt;
    var spacingAfterHyphenExcerpt;
    if (tokenReader.peekTokenKind() === Token_1.TokenKind.Hyphen) {
        tokenReader.readToken();
        hyphenExcerpt = tokenReader.extractAccumulatedSequence();
        // TODO: Only read one space
        spacingAfterHyphenExcerpt = this._tryReadSpacingAndNewlines(tokenReader);
    }
    else if (tokenReader.peekTokenKind() !== Token_1.TokenKind.AsciiWord) {
        tokenReader.backtrackToMarker(startMarker);
        this._parserContext.log.addMessageForTokenSequence("tsdoc-param-tag-missing-hyphen" /* ParamTagMissingHyphen */, 'The @param block should be followed by a parameter name and then a hyphen', docBlockTag.getTokenSequence(), docBlockTag);
        return new nodes_1.DocParamBlock({
            configuration: this._configuration,
            blockTag: docBlockTag,
            parameterName: ''
        });
    }
    return new nodes_1.DocParamBlock({
        parsed: true,
        configuration: this._configuration,
        blockTag: docBlockTag,
        spacingBeforeParameterNameExcerpt: spacingBeforeParameterNameExcerpt,
        parameterNameExcerpt: parameterNameExcerpt,
        parameterName: parameterName,
        spacingAfterParameterNameExcerpt: spacingAfterParameterNameExcerpt,
        hyphenExcerpt: hyphenExcerpt,
        spacingAfterHyphenExcerpt: spacingAfterHyphenExcerpt
    });
};
