// @ts-check
const { COMMONJS_RESOLVE } = require("./resolver/cjsResolver");
const { clearCaches, pathJoin } = require("./resolver/utils");

/**
 * @param {string} request 
 * @param {import("./resolver/types").ResolverOpts} options 
 * @returns {string}
 */
module.exports = (request, options) => {
    try {
        const parent = options.filename ?? pathJoin(options.basedir, "dummy.js");
        return COMMONJS_RESOLVE(request, parent, options);
    }
    catch (e) {
        return options.defaultResolver(request, options);
    }
};

function clearDefaultResolverCache() {
    clearCaches();
}
module.exports.clearDefaultResolverCache = clearDefaultResolverCache;