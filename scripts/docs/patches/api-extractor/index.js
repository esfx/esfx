/**
 * @param {object} options
 * @param {boolean} options.exportStarAsNamespace
 */
module.exports = function(options) {
    if (options.exportStarAsNamespace) require("./exportStarAsNamespace");
};
