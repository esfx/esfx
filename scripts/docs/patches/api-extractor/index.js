/**
 * @param {object} options
 * @param {boolean} options.exportStarAsNamespace
 * @param {boolean} options.ignoreUnhandledExports
 * @param {boolean} options.ambiguousReferences
 */
module.exports = function(options) {
    if (options.exportStarAsNamespace) require("./exportStarAsNamespace");
    if (options.ignoreUnhandledExports) require("./ignoreUnhandledExports");
    if (options.ambiguousReferences) require("./ambiguousReferences");
};
