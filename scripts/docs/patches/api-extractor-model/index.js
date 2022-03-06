/**
 * @param {object} options
 * @param {boolean} options.ambiguousReferences
 */
module.exports = function(options) {
    if (options.ambiguousReferences) require("./ambiguousReferences");
};
