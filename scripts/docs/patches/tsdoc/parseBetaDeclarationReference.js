// @ts-check
require("@microsoft/api-extractor-model");
const { DeclarationReference, ModuleSource, ComponentNavigation, ComponentString } = require("@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference");
const { DocMemberReference } = require("@microsoft/tsdoc/lib-commonjs/nodes/DocMemberReference");
const { DocMemberIdentifier } = require("@microsoft/tsdoc/lib-commonjs/nodes/DocMemberIdentifier");
const { NodeParser } = require("@microsoft/tsdoc/lib-commonjs/parser/NodeParser");
const { DocMemberSymbol } = require("@microsoft/tsdoc/lib-commonjs/nodes/DocMemberSymbol");
const { DocMemberSelector } = require("@microsoft/tsdoc/lib-commonjs/nodes/DocMemberSelector");
const { TSDocEmitter } = require("@microsoft/tsdoc/lib-commonjs/emitters/TSDocEmitter");
const { ApiModel } = require("@microsoft/api-extractor-model/lib/model/ApiModel");
const { BetaOrLegacyDocDeclarationReference } = require("./betaOrLegacyDocDeclarationReference");
const { meaningToSelector } = require("../utils/declarationReferenceUtils");
const { TokenKind } = /** @type {{ TokenKind: typeof import("@microsoft/tsdoc").TokenKind}} */ (/** @type {*} */(require("@microsoft/tsdoc/lib-commonjs/parser/Token")));
/** @typedef {import("@microsoft/tsdoc").TokenKind} TokenKind */
module.exports = {};

const prev_parseDeclarationReference = NodeParser.prototype["_parseDeclarationReference"];

/**
 * @param {import("@microsoft/tsdoc/lib/parser/TokenReader").TokenReader} tokenReader
 * @param {*} tokenSequenceForErrorContext
 * @param {*} nodeForErrorContext
 * @returns
 */
NodeParser.prototype["_parseDeclarationReference"] = function(tokenReader, tokenSequenceForErrorContext, nodeForErrorContext) {
    tokenReader.assertAccumulatedSequenceIsEmpty();
    const startMarker = tokenReader.createMarker();

    // skip tokens that are allowed in a beta declaration reference
    let done = false;
    let inString = false;
    /** @type {readonly [number, TokenKind]} */
    let currentBracket = [0, TokenKind.EndOfInput ];
    /** @type {(readonly [number, TokenKind])[]} */
    const bracketStack = [];
    /** @type {(readonly [number, import("@microsoft/tsdoc").Token])[]} */
    const tokens = [];
    while (!done) {
        if (inString) {
            if (tokenReader.peekTokenKind() === TokenKind.DoubleQuote) {
                tokens.push([tokenReader.createMarker(), tokenReader.readToken()]);
                inString = false;
                continue;
            }
            if (tokenReader.peekTokenKind() === TokenKind.Slash) {
                tokens.push([tokenReader.createMarker(), tokenReader.readToken()]);
            }
            tokens.push([tokenReader.createMarker(), tokenReader.readToken()]);
            continue;
        }
        switch (tokenReader.peekTokenKind()) {
            case TokenKind.EndOfInput:
                done = true;
                break;
            case TokenKind.DoubleQuote:
                inString = true;
                tokens.push([tokenReader.createMarker(), tokenReader.readToken()]);
                break;
            case TokenKind.LeftCurlyBracket:
                bracketStack.push(currentBracket);
                currentBracket = [tokenReader.createMarker(), TokenKind.RightCurlyBracket];
                tokens.push([tokenReader.createMarker(), tokenReader.readToken()]);
                break;
            case TokenKind.LeftParenthesis:
                bracketStack.push(currentBracket);
                currentBracket = [tokenReader.createMarker(), TokenKind.RightParenthesis];
                tokens.push([tokenReader.createMarker(), tokenReader.readToken()]);
                break;
            case TokenKind.LeftSquareBracket:
                bracketStack.push(currentBracket);
                currentBracket = [tokenReader.createMarker(), TokenKind.RightSquareBracket];
                tokens.push([tokenReader.createMarker(), tokenReader.readToken()]);
                break;
            case TokenKind.RightCurlyBracket:
            case TokenKind.RightParenthesis:
            case TokenKind.RightSquareBracket:
                if (currentBracket[1] !== tokenReader.peekTokenKind()) {
                    while (bracketStack.length) {
                        tokenReader.backtrackToMarker(currentBracket[0]);
                        currentBracket = bracketStack.pop();
                    }
                    done = true;
                    break;
                }
                currentBracket = bracketStack.pop();
                tokens.push([tokenReader.createMarker(), tokenReader.readToken()]);
                break;
            case TokenKind.Hyphen:
            case TokenKind.AsciiWord:
            case TokenKind.Period:
            case TokenKind.PoundSymbol:
            case TokenKind.Colon:
            case TokenKind.Comma:
            case TokenKind.AtSign:
            case TokenKind.Slash:
                tokens.push([tokenReader.createMarker(), tokenReader.readToken()]);
                break;
            case TokenKind.OtherPunctuation: // ! ~
                switch (tokenReader.peekToken().toString()) {
                    case "!":
                    case "~":
                    case "0":
                    case "1":
                    case "2":
                    case "3":
                    case "4":
                    case "5":
                    case "6":
                    case "7":
                    case "8":
                    case "9":
                        tokens.push([tokenReader.createMarker(), tokenReader.readToken()]);
                        continue;
                }
                // falls through
            default:
                done = true;
                break;
        }
    }

    while (tokens.length > 0) {
        const start = tokens[0][1].range.pos;
        const end = tokens[tokens.length - 1][1].range.end;
        const range = tokens[0][1].range.getNewRange(start, end);
        if (!range.isEmpty()) {
            try {
                const declRef = DeclarationReference.parse(range.toString());
                return declarationReferenceToDocDeclarationReference(declRef, this._configuration);
            }
            catch {
            }
        }
        tokenReader.backtrackToMarker(tokens[tokens.length - 1][0]);
        tokens.pop();
    }

    tokenReader.backtrackToMarker(startMarker);
    return prev_parseDeclarationReference.call(this, tokenReader, tokenSequenceForErrorContext, nodeForErrorContext);
};

/**
 * @param {DeclarationReference} declRef
 * @param {import("@microsoft/tsdoc/lib-commonjs/configuration/TSDocConfiguration").TSDocConfiguration} configuration
 */
function declarationReferenceToDocDeclarationReference(declRef, configuration) {
    const memberReferences = [];
    if (declRef.symbol) {
        const componentPath = [];
        let component = declRef.symbol.componentPath;
        while (component instanceof ComponentNavigation) {
            componentPath.unshift(component);
            component = component.parent;
        }
        const selector = componentPath.length === 0 ?
            meaningToSelector(declRef.symbol.meaning, undefined, declRef.symbol.overloadIndex)?.selector :
            undefined;
        memberReferences.push(new DocMemberReference({
            configuration,
            hasDot: false,
            memberIdentifier: component.component instanceof ComponentString ?
                new DocMemberIdentifier({
                    configuration,
                    identifier: component.component.text
                }) :
                undefined,
            selector: selector && new DocMemberSelector({ configuration, selector })
        }))
        for (let i = 0; i < componentPath.length; i++) {
            const component = componentPath[i];
            const selector = i === componentPath.length - 1 ?
                meaningToSelector(declRef.symbol.meaning, component.navigation, declRef.symbol.overloadIndex)?.selector :
                undefined;
            memberReferences.push(component.component instanceof ComponentString ?
                new DocMemberReference({
                    configuration,
                    hasDot: true,
                    memberIdentifier: new DocMemberIdentifier({
                        configuration,
                        identifier: component.component.text
                    }),
                    selector: selector && new DocMemberSelector({ configuration, selector })
                }) :
                new DocMemberReference({
                    configuration,
                    hasDot: true,
                    memberSymbol: new DocMemberSymbol({
                        configuration,
                        symbolReference: declarationReferenceToDocDeclarationReference(component.component.reference, configuration)
                    }),
                    selector: selector && new DocMemberSelector({ configuration, selector })
                })
            );
        }
    }
    const docDeclRef = new BetaOrLegacyDocDeclarationReference({
        configuration,
        packageName: declRef.source instanceof ModuleSource ? declRef.source.packageName : undefined,
        importPath: declRef.source instanceof ModuleSource ? declRef.source.importPath : undefined,
        memberReferences,
    });
    docDeclRef.betaDeclarationReference = declRef;
    return docDeclRef;
};

const prev_renderNode = TSDocEmitter.prototype._renderNode;
TSDocEmitter.prototype._renderNode = function (docNode) {
    if (docNode instanceof BetaOrLegacyDocDeclarationReference) {
        if (docNode.betaDeclarationReference) {
            this._writeContent(docNode.betaDeclarationReference.toString());
            return;
        }
    }
    return prev_renderNode.call(this, docNode);
};

const prevResolveDeclarationReference = ApiModel.prototype.resolveDeclarationReference;
ApiModel.prototype.resolveDeclarationReference = function (declRef, apiItem) {
    if (declRef instanceof BetaOrLegacyDocDeclarationReference && declRef.betaDeclarationReference) {
        declRef = declRef.betaDeclarationReference;
    }
    return prevResolveDeclarationReference.call(this, declRef, apiItem);
};