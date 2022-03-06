/**
 * @param {object} options
 * @param {boolean} options.emitSoftBreak
 * @param {boolean} options.overrideTocRoot
 * @param {boolean} options.documentExternals
 * @param {boolean} options.inlineTypeAliases
 * @param {boolean} options.renameTsSymbolicNames
 * @param {boolean} options.disableConvertToSDP
 * @param {boolean} options.documentAliases
 * @param {boolean} options.overwriteYamlSchema
 */
module.exports = function(options) {
    if (options.emitSoftBreak) require("./emitSoftBreak");
    if (options.overrideTocRoot) require("./overrideTocRoot");
    if (options.documentExternals) require("./documentExternals");
    if (options.inlineTypeAliases) require("./inlineTypeAliases");
    if (options.renameTsSymbolicNames) require("./renameTsSymbolicNames");
    if (options.disableConvertToSDP) require("./disableConvertToSDP");
    if (options.documentAliases) require("./documentAliases");
    if (options.overwriteYamlSchema) require("./overwriteYamlSchema");
};
