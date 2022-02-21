/**
 * @param {string} name
 * @param {Function} fn
 * @returns {Function}
 */
function fname(name, fn) {
    return Object.defineProperty(fn, "name", { ...Object.getOwnPropertyDescriptor(fn, "name"), value: name });
}
exports.fname = fname;