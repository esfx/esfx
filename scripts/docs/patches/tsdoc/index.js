/**
 * @param {object} options
 * @param {boolean} options.paramTagHyphen
 * @param {boolean} options.emitSoftBreak
 */
module.exports = function(options) {
    if (options.paramTagHyphen) require("./paramTagHyphen");
    if (options.emitSoftBreak) require("./emitSoftBreak");
};