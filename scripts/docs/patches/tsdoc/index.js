/**
 * @param {object} options
 * @param {boolean} options.paramTagHyphen
 * @param {boolean} options.emitSoftBreak
 * @param {boolean} options.parseBetaDeclarationReference
 * @param {boolean} options.parseSpacingAfterCodeDestination
 */
module.exports = function(options) {
    if (options.paramTagHyphen) require("./paramTagHyphen");
    if (options.emitSoftBreak) require("./emitSoftBreak");
    if (options.parseBetaDeclarationReference) require("./parseBetaDeclarationReference");
    if (options.parseSpacingAfterCodeDestination) require("./parseSpacingAfterCodeDestination");
};