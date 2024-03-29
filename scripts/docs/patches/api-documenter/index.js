/**
 * @param {object} options
 * @param {boolean} options.emitSoftBreak
 * @param {boolean} options.overrideTocRoot
 * @param {boolean} options.documentExternals
 * @param {boolean} options.inlineTypeAliases
 * @param {boolean} options.renameTsSymbolicNames
 * @param {boolean} options.disableConvertToSDP
 * @param {boolean} options.documentAliases
 * @param {boolean} options.documentClassInterfaceSyntax
 * @param {boolean} options.documentInheritedMembers
 * @param {boolean} options.documentParent
 * @param {boolean} options.documentApiNames
 * @param {boolean} options.includeTypeParametersInName
 * @param {boolean} options.overwriteYamlSchema
 * @param {boolean} options.forwardUnresolvedReferences
 */
module.exports = function(options) {
    if (options.emitSoftBreak) require("./emitSoftBreak");
    if (options.overrideTocRoot) require("./overrideTocRoot");
    if (options.documentExternals) require("./documentExternals");
    if (options.inlineTypeAliases) require("./inlineTypeAliases");
    if (options.renameTsSymbolicNames) require("./renameTsSymbolicNames");
    if (options.disableConvertToSDP) require("./disableConvertToSDP");
    if (options.documentAliases) require("./documentAliases");
    if (options.documentClassInterfaceSyntax) require("./documentClassInterfaceSyntax");
    if (options.documentParent) require("./documentParent");
    if (options.documentApiNames) require("./documentApiNames");
    if (options.includeTypeParametersInName) require("./includeTypeParametersInName");
    if (options.overwriteYamlSchema) require("./overwriteYamlSchema");
    if (options.forwardUnresolvedReferences) require("./forwardUnresolvedReferences");
    if (options.documentInheritedMembers) require("./documentInheritedMembers");
};
