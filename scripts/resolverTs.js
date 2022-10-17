// @ts-check
const resolver = require("./resolver.js");

/**
 * @param {string} request
 * @param {import("./resolver/types").ResolverOpts} options
 * @returns {string}
 */
module.exports = function (request, options) {
    options.conditions ??= [];
    if (!options.conditions.includes("ts")) options.conditions.push("ts");
    return resolver(request, options);
};

module.exports.clearDefaultResolverCache = resolver.clearDefaultResolverCache;