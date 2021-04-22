/*!
   Parts of this algorithm are derived from Node.js (https://github.com/nodejs/node/blob/053aa6d213ea828fac89864df03890228831db7e/lib/internal/modules/esm/resolve.js)

   License notice for Node.js
   --------------------------
   Copyright Node.js contributors. All rights reserved.

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to
   deal in the Software without restriction, including without limitation the
   rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
   sell copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in
   all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
   FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
   IN THE SOFTWARE.
*/

// @ts-check
const {
    realpathSync: _realpathSync,
    statSync,
    readFileSync
} = require("fs");
const {
    resolve: _pathResolve,
    dirname: _pathDirname,
    join: _pathJoin
} = require("path");
const {
    fileURLToPath,
    URL
} = require("url");
const {
    ErrorCaptureStackTrace,
    Map,
    MapPrototypeClear,
    MapPrototypeGet,
    MapPrototypeSet,
    RegExpPrototypeExec,
    RegExpPrototypeTest,
    StatsPrototypeIsDirectory,
    StatsPrototypeIsFIFO,
    StatsPrototypeIsFile,
    StringPrototypeReplace,
    StringPrototypeStartsWith,
    StringPrototypeEndsWith,
    ObjectGetOwnPropertyNames,
} = require("./primordials");

/**
 * @template {new (message: string) => Error} F
 * @param {F} ctor
 * @param {string} code
 * @param {string} message
 * @returns {InstanceType<F>}
 */
 function errorWithCode(ctor, code, message) {
    const error = /** @type {InstanceType<F>} */(new ctor(message));
    /** @type {NodeJS.ErrnoException} */(error).code = code;
    ErrorCaptureStackTrace?.(error, errorWithCode);
    return error;
}
exports.errorWithCode = errorWithCode;

/**
 * @param {string} file
 */
function normalizeSlashes(file) {
    return StringPrototypeReplace(file, /\\/g, "/");
}
exports.normalizeSlashes = normalizeSlashes;

/**
 * @param {...string} args
 */
function pathResolve(...args) {
    return normalizeSlashes(_pathResolve(...args));
}
exports.pathResolve = pathResolve;

/**
 * @param {string} file
 */
function pathDirname(file) {
    return normalizeSlashes(_pathDirname(file));
}
exports.pathDirname = pathDirname;

/**
 * @param {...string} args
 */
function pathJoin(...args) {
    return normalizeSlashes(_pathJoin(...args));
}
exports.pathJoin = pathJoin;

/** @type {Map<string, "file" | "directory" | "other">} */
const cachedPathKinds = new Map();

/**
 * @param {string} file
 */
function statSyncCached(file) {
    file = normalizeSlashes(file);
    let value = MapPrototypeGet(cachedPathKinds, file);
    if (value !== undefined) return value;

    let stats;
    try {
        stats = statSync(file);
    }
    catch (e) {
        if (e?.code !== "ENOENT" && e?.code !== "ENOTDIR") throw e;
    }

    value = stats && (StatsPrototypeIsFile(stats) || StatsPrototypeIsFIFO(stats)) ? "file" : stats && StatsPrototypeIsDirectory(stats) ? "directory" : "other";
    MapPrototypeSet(cachedPathKinds, file, value);
    return value;
}
exports.statSyncCached = statSyncCached;

/** @type {Map<string, string>} */
const cachedRealpaths = new Map();
const realpathSync = typeof _realpathSync?.native === "function" ? _realpathSync.native : _realpathSync;

/**
 * @param {string} file
 */
function realpathSyncCached(file) {
    file = normalizeSlashes(file);
    let value = MapPrototypeGet(cachedRealpaths, file);
    if (value !== undefined) return value;

    try {
        value = realpathSync(file);
    }
    catch (e) {
        if (e?.code !== "ENOENT") throw e;
        value = file;
    }

    MapPrototypeSet(cachedRealpaths, file, value);
    return value;
}
exports.realpathSyncCached = realpathSyncCached;

function clearCaches() {
    MapPrototypeClear(cachedPathKinds);
    MapPrototypeClear(cachedRealpaths);
    MapPrototypeClear(cachedPackageConfigs);
}
exports.clearCaches = clearCaches;

/**
 * @param {string} file
 */
function isFile(file) {
    return statSyncCached(file) === "file";
}
exports.isFile = isFile;

/**
 * @param {string} file
 */
function isDirectory(file) {
    return statSyncCached(file) === "directory";
}
exports.isDirectory = isDirectory;

const packageNameWithSubpathRegExp = /^(?<name>(?:@[^\\/%]+\/)[^./\\%][^/\\%]*)(?<subpath>\/.*)?$/;

/**
 * @param {string} specifier
 * @param {import("url").URL} base
 * @returns {import("./types").PackageName}
 */
function parsePackageName(specifier, base) {
    // from: PACKAGE_RESOLVE(packageSpecifier, parentURL)

    //  1. Let packageName be undefined.
    //  2. If packageSpecifier is an empty string, then
    //      1. Throw an Invalid Module Specifier error.
    //  3. If packageSpecifier does not start with "@", then
    //      1. Set packageName to the substring of packageSpecifier until the first "/" separator or the end of the string.
    //  4. Otherwise,
    //      1. If packageSpecifier does not contain a "/" separator, then
    //          1. Throw an Invalid Module Specifier error.
    //      2. Set packageName to the substring of packageSpecifier until the second "/" separator or the end of the string.
    //  5. If packageName starts with "." or contains "\" or "%", then
    //      1. Throw an Invalid Module Specifier error.
    //  6. Let packageSubpath be "." concatenated with the substring of packageSpecifier from the position at the length of packageName.

    const match = RegExpPrototypeExec(packageNameWithSubpathRegExp, specifier);
    if (!match?.groups) throw errorWithCode(TypeError, "ERR_INVALID_MODULE_SPECIFIER", `Invalid module "${specifier}" is not a valid package name imported from ${fileURLToPath(base)}`);
    const { name, subpath = "" } = match.groups;
    return createPackageName(name, "." + subpath);
}
exports.parsePackageName = parsePackageName;

const packageNameRegExp = /^(?<name>(?:@[^\\/%]+\/)[^./\\%][^/\\%]*)$/;

/**
 * @param {string} packageName
 * @param {string} packageSubpath
 * @returns {import("./types").PackageName}
 */
function createPackageName(packageName, packageSubpath) {
    if (!RegExpPrototypeTest(packageNameRegExp, packageName)) throw errorWithCode(TypeError, "ERR_INVALID_MODULE_SPECIFIER", `Invalid module "${packageName}" is not a valid package name`);
    if (packageSubpath !== "." && !StringPrototypeStartsWith(packageSubpath, "./")) throw errorWithCode(TypeError, "ERR_INVALID_MODULE_SPECIFIER", `Invalid module "${packageName}", "${packageSubpath}" is not a valid package subpath`);
    const isScoped = StringPrototypeStartsWith(packageName, "@");
    return { packageName, packageSubpath, isScoped };
}
exports.createPackageName = createPackageName;

/**
 * @param {import("./types").PackageJson} packageJson
 * @param {import("url").URL} packageJsonURL
 * @param {boolean} exists
 * @returns {import("./types").PackageConfig}
 */
function createPackageConfig(packageJson, packageJsonURL, exists) {
    return { packageJson, packageJsonURL, exists };
}
exports.createPackageConfig = createPackageConfig;

/** @type {Map<string, import("./types").PackageConfig>} */
const cachedPackageConfigs = new Map();

/**
 * @returns {import("./types").PackageJson}
 */
function createEmptyPackageJson() {
    return { main: undefined, name: undefined, type: "none", exports: undefined, imports: undefined };
}

/**
 * @param {import("url").URL} packageJsonURL
 * @param {import("./types").ResolverOpts} options
 * @returns {import("./types").PackageConfig}
 */
function readPackageConfig(packageJsonURL, options) {
    const packageJsonPath = realpathSyncCached(fileURLToPath(packageJsonURL));
    let packageConfig = cachedPackageConfigs.get(packageJsonPath);
    if (packageConfig) return packageConfig;
    if (!isFile(packageJsonPath)) {
        packageConfig = createPackageConfig(createEmptyPackageJson(), packageJsonURL, false);
    }
    else {
        const text = readFileSync(packageJsonPath, "utf8");
        let packageJsonRaw;
        try {
            packageJsonRaw = JSON.parse(text);
        }
        catch (e) {
            throw errorWithCode(TypeError, "ERR_INVALID_PACKAGE_CONFIG", `Invalid package config '${fileURLToPath(packageJsonURL)}'`);
        }
        if (typeof packageJsonRaw !== "object" && packageJsonRaw !== null) {
            throw errorWithCode(TypeError, "ERR_INVALID_PACKAGE_CONFIG", `Invalid package config '${fileURLToPath(packageJsonURL)}'`);
        }
        if (options.packageFilter) {
            const packagePath = realpathSyncCached(fileURLToPath(packageJsonURL));
            packageJsonRaw = options.packageFilter(packageJsonRaw, packageJsonPath, pathDirname(packagePath));
            if (typeof packageJsonRaw !== "object" && packageJsonRaw !== null) {
                throw errorWithCode(TypeError, "ERR_INVALID_PACKAGE_CONFIG", `Invalid package config from package filter`);
            }
        }
        let { name, main, type, imports, exports } = packageJsonRaw;
        if (typeof name !== "string") name = undefined;
        if (typeof main !== "string") main = undefined;
        if (type !== "module" && type !== "commonjs") type = "none";
        if (typeof imports !== "object" || imports === null) imports = undefined;
        /** @type {import("./types").PackageJson} */
        const packageJson = { ...packageJsonRaw, main, name, type, exports, imports };
        packageConfig = createPackageConfig(packageJson, packageJsonURL, true);
    }
    MapPrototypeSet(cachedPackageConfigs, packageJsonPath, packageConfig);
    return packageConfig;
}
exports.readPackageConfig = readPackageConfig;

/**
 * @param {import("url").URL} resolvedURL
 * @param {import("./types").ResolverOpts} options
 * @returns {import("./types").PackageConfig}
 */
function findPackageConfig(resolvedURL, options) {
    let packageJsonURL = new URL("./package.json", resolvedURL);
    while (true) {
        const packageJsonPath = normalizeSlashes(fileURLToPath(packageJsonURL));
        if (StringPrototypeEndsWith(packageJsonPath, "/node_modules/package.json")) break;
        const packageConfig = readPackageConfig(packageJsonURL, options);
        if (packageConfig.exists) return packageConfig;

        const lastPackageJsonURL = packageJsonURL;
        packageJsonURL = new URL("../package.json", packageJsonURL);
        if (packageJsonURL.pathname === lastPackageJsonURL.pathname) break;
    }
    return createPackageConfig(createEmptyPackageJson(), packageJsonURL, false);
}
exports.findPackageConfig = findPackageConfig;


/**
 * @param {import("./types").PackageJsonExports} exports
 * @returns {exports is import("./types").PackageJsonRelativeExports}
 */
function isPackageJsonRelativeExports(exports) {
    if (typeof exports !== "object") return;
    for (const key of ObjectGetOwnPropertyNames(exports)) {
        if (key === "" || StringPrototypeStartsWith(key, ".")) return true;
    }
    return false;
}
exports.isPackageJsonRelativeExports = isPackageJsonRelativeExports;

/**
 * @param {import("./types").PackageJsonExports} exports
 * @returns {exports is import("./types").PackageJsonConditionalExports}
 */
function isPackageJsonConditionalExports(exports) {
    if (typeof exports !== "object") return;
    for (const key of ObjectGetOwnPropertyNames(exports)) {
        if (key !== "" && !StringPrototypeStartsWith(key, ".")) return true;
    }
    return false;
}
exports.isPackageJsonConditionalExports = isPackageJsonConditionalExports;

/**
 * @param {string} text
 * @returns {boolean}
 */
function isUrlString(text) {
    try {
        const url = new URL(text);
        return !!url.protocol;
    }
    catch {
        return false;
    }
}
exports.isUrlString = isUrlString;