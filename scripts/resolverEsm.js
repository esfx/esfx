// @ts-check
const resolver = require("./resolver.js");

/**
 * @param {string} request
 * @param {import("./resolver/types").ResolverOpts} options
 * @returns {string}
 */
module.exports = function (request, options) {
    return resolver(request, options);
};

module.exports.clearDefaultResolverCache = resolver.clearDefaultResolverCache;