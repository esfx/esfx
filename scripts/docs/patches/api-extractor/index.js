/**
 * @param {object} options
 * @param {boolean} options.exportStarAsNamespace
 * @param {boolean} options.ignoreUnhandledExports
 */
module.exports = function(options) {
    if (options.exportStarAsNamespace) require("./exportStarAsNamespace");
    if (options.ignoreUnhandledExports) require("./ignoreUnhandledExports");
};
