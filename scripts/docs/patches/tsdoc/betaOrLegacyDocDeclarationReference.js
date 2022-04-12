const { DocDeclarationReference } = require("@microsoft/tsdoc/lib-commonjs/nodes/DocDeclarationReference");
const { DeclarationReference } = require("@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference");

class BetaOrLegacyDocDeclarationReference extends DocDeclarationReference {
    /** @type {DeclarationReference | undefined} */
    betaDeclarationReference;
}

exports.BetaOrLegacyDocDeclarationReference = BetaOrLegacyDocDeclarationReference;
