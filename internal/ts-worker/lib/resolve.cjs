/** @type {RequireResolve} */
exports.resolve = function (id, options) {
    return require.resolve(id, options);
};