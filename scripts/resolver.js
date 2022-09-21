// @ts-check
const { pathToFileURL, fileURLToPath } = require("url");
const { COMMONJS_RESOLVE } = require("./resolver/cjsResolver");
const { ESM_RESOLVE } = require("./resolver/esmResolver");
const { clearCaches, pathJoin, isUrlString } = require("./resolver/utils");

/**
 * @param {string} request
 * @param {import("./resolver/types").ResolverOpts} options
 * @returns {string}
 */
module.exports = (request, options) => {
    try {
        const isEsm = options.conditions?.includes("import");
        const parent = options.filename ?? pathJoin(options.basedir, "dummy.js");
        if (isEsm) {
            const parentURL = isUrlString(parent) ? new URL(parent) : pathToFileURL(parent);
            const resolved = ESM_RESOLVE(request, parentURL, new Set(options.conditions), options);
            return resolved.protocol === "file:" ? fileURLToPath(resolved) : resolved.href;
        }
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