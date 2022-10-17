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
const assert = require("assert");
const { URL, fileURLToPath, pathToFileURL } = require("url");
const isCore = require("is-core-module");
const { isPackageJsonRelativeExports, isPackageJsonConditionalExports, parsePackageName, findPackageConfig, isUrlString, isDirectory, pathDirname, readPackageConfig, isFile, realpathSyncCached, TRACE } = require("./utils");
const {
    ObjectGetOwnPropertyNames,
    ArrayIsArray,
    StringPrototypeStartsWith,
    ObjectPrototypeHasOwnProperty,
    StringPrototypeEndsWith,
    StringPrototypeSlice,
    StringPrototypeSubstr,
    StringPrototypeReplace,
    RegExpPrototypeTest,
    SetPrototypeHas,
    ArrayPrototypeSort,
    ArrayPrototypeFilter,
} = require("./primordials");
const {
    ERR_INVALID_MODULE_SPECIFIER,
    ERR_UNSUPPORTED_DIR_IMPORT,
    ERR_MODULE_NOT_FOUND,
    ERR_INVALID_PACKAGE_CONFIG,
    ERR_INVALID_PACKAGE_TARGET,
    ERR_PACKAGE_IMPORT_NOT_DEFINED,
    ERR_PACKAGE_PATH_NOT_EXPORTED,
} = require("./errors");
const cjsResolver = require("./cjsResolver");

//
// ES Modules
//

/**
 * @param {string} specifier
 * @param {import("url").URL} parentURL
 * @param {Set<string>} conditions
 * @param {import("./types").ResolverOpts} options
 * @returns {import("url").URL}
 */
function ESM_RESOLVE(specifier, parentURL, conditions, options) {
    // ESM_RESOLVE(specifier, parentURL)

    //  1. Let resolved be undefined.
    let resolved;

    //  2. If specifier is a valid URL, then
    //      1. Set resolved to the result of parsing and reserializing specifier as a URL.
    if (isUrlString(specifier)) {
        resolved = new URL(specifier);
    }

    //  3. Otherwise, if specifier starts with "/", "./" or "../", then
    //      1. Set resolved to the URL resolution of specifier relative to parentURL.
    else if (/^(\/|\.\.?\/)/.test(specifier)) {
        resolved = new URL(specifier, parentURL);
    }

    //  4. Otherwise, if specifier starts with "#", then
    //      1. Set resolved to the destructured value of the result of PACKAGE_IMPORTS_RESOLVE(specifier, parentURL, defaultConditions).
    else if (StringPrototypeStartsWith(specifier, "#")) {
        resolved = PACKAGE_IMPORTS_RESOLVE(specifier, parentURL, conditions, options).resolved;
    }

    //  5. Otherwise,
    //      1. Note: specifier is now a bare specifier.
    //      2. Set resolved the result of PACKAGE_RESOLVE(specifier, parentURL).
    else {
        resolved = PACKAGE_RESOLVE(specifier, parentURL, conditions, options);
    }

    //  6. If resolved contains any percent encodings of "/" or "\" ("%2F" and "%5C" respectively), then
    //      1. Throw an Invalid Module Specifier error.
    if (/%2F|%5C/i.test(resolved.pathname)) throw ERR_INVALID_MODULE_SPECIFIER(specifier, "must not include encoded '/' or '\\' characters", parentURL);

    if (resolved.protocol === "node:") return resolved;

    //  7. If the file at resolved is a directory, then
    //      1. Throw an Unsupported Directory Import error.
    let resolvedPath = fileURLToPath(resolved);
    if (isDirectory(resolvedPath)) throw ERR_UNSUPPORTED_DIR_IMPORT(resolvedPath, parentURL);

    //  8. If the file at resolved does not exist, then
    //      1. Throw a Module Not Found error.

    // MODIFIED to pick up .ts file for .js import (matches TS module resolution)
    if (!isFile(resolvedPath)) {
        const match = /\.([cm]?)js(x?)$/.exec(resolvedPath);
        if (match) {
            const resolvedPath2 = resolvedPath.slice(0, -match[0].length);
            const ext1 = `.${match[1]}ts${match[2]}`;
            if (isFile(resolvedPath2 + ext1)) {
                resolvedPath = resolvedPath2 + ext1;
            }
            else {
                const ext2 = `.${match[1]}tsx`;
                if (isFile(resolvedPath2 + ext2)) {
                    resolvedPath = resolvedPath2 + ext2;
                }
            }
        }
    }

    if (!isFile(resolvedPath)) throw ERR_MODULE_NOT_FOUND(resolvedPath, parentURL, "module");

    //  9. Set resolved to the real path of resolved.
    resolved = pathToFileURL(realpathSyncCached(resolvedPath));

    //  10. Let format be the result of ESM_FORMAT(resolved).
    //  11. Load resolved as module format, format.
    // NOTE: skipped as we are not evaluating the module here.

    //  12. Return resolved.
    return resolved;
}
exports.ESM_RESOLVE = ESM_RESOLVE;

/**
 * @param {import("url").URL} packageJsonURL
 * @param {string} packageSubpath
 * @param {import("./types").PackageJson} packageJson
 * @param {import("url").URL} parentURL
 * @param {Set<string>} conditions
 * @param {import("./types").ResolverOpts} options
 * @returns {import("./types").ResolvedEsmMatch}
 */
function PACKAGE_EXPORTS_RESOLVE(packageJsonURL, packageSubpath, packageJson, parentURL, conditions, options) {
    TRACE(options, "PACKAGE_EXPORTS_RESOLVE", packageJsonURL.href, packageSubpath, parentURL.href, [...conditions].join(","));

    // PACKAGE_EXPORTS_RESOLVE(packageURL, subpath, exports, conditions)

    //  1. If exports is an Object with both a key starting with "." and a key not starting with ".", throw an Invalid Package Configuration error.
    //  2. If subpath is equal to ".", then
    //      1. Let mainExport be undefined.
    //      2. If exports is a String or Array, or an Object containing no keys starting with ".", then
    //          1. Set mainExport to exports.
    //      3. Otherwise if exports is an Object containing a "." property, then
    //          1. Set mainExport to exports["."].
    //      4. If mainExport is not undefined, then
    //          1. Let resolved be the result of PACKAGE_TARGET_RESOLVE( packageURL, mainExport, "", false, false, conditions).
    //          2. If resolved is not null or undefined, then
    //              1. Return resolved.
    //  3. Otherwise, if exports is an Object and all keys of exports start with ".", then
    //      1. Let matchKey be the string "./" concatenated with subpath.
    //      2. Let resolvedMatch be result of PACKAGE_IMPORTS_EXPORTS_RESOLVE( matchKey, exports, packageURL, false, conditions).
    //      3. If resolvedMatch.resolve is not null or undefined, then
    //          1. Return resolvedMatch.
    //  4. Throw a Package Path Not Exported error.

    let exports = packageJson.exports;
    if (isObject(exports) && isPackageJsonRelativeExports(exports) && isPackageJsonConditionalExports(exports)) {
        throw ERR_INVALID_PACKAGE_CONFIG(packageSubpath, parentURL, "exports cannot contain both keys starting with '.' and keys not starting with '.'");
    }
    if (typeof exports === "string" || ArrayIsArray(exports) || isObject(exports) && !isPackageJsonRelativeExports(exports)) {
        exports = /** @type {import("./types").PackageJsonRelativeExports} */({ ".": exports });
    }
    if (isPackageJsonRelativeExports(exports)) {
        const resolvedMatch = PACKAGE_IMPORTS_EXPORTS_RESOLVE(packageSubpath, exports, packageJsonURL, parentURL, false, conditions, options);
        if (resolvedMatch.resolved !== undefined) return resolvedMatch;
    }
    throw ERR_PACKAGE_PATH_NOT_EXPORTED(new URL(".", packageJsonURL), packageSubpath, parentURL);
}
exports.PACKAGE_EXPORTS_RESOLVE = PACKAGE_EXPORTS_RESOLVE;

/**
 * @param {string} specifier
 * @param {import("url").URL} parentURL
 * @param {Set<string>} conditions
 * @param {import("./types").ResolverOpts} options
 * @returns {import("./types").ResolvedEsmMatch}
 */
function PACKAGE_IMPORTS_RESOLVE(specifier, parentURL, conditions, options) {
    TRACE(options, "PACKAGE_IMPORTS_RESOLVE", specifier, parentURL.href, [...conditions].join(","));

    // PACKAGE_IMPORTS_RESOLVE(specifier, parentURL, conditions)
    //  1. Assert: specifier begins with "#".
    assert(StringPrototypeStartsWith(specifier, "#"));

    //  2. If specifier is exactly equal to "#" or starts with "#/", then
    //      1. Throw an Invalid Module Specifier error.
    if (specifier === "#" || StringPrototypeStartsWith(specifier, "#/")) throw ERR_INVALID_MODULE_SPECIFIER(specifier, "cannot be '#' or start with '#/'", parentURL);

    //  3. Let packageURL be the result of READ_PACKAGE_SCOPE(parentURL).
    const packageConfig = READ_PACKAGE_SCOPE(parentURL, options);

    //  4. If packageURL is not null, then
    if (packageConfig.exists) {
        //  1. Let pjson be the result of READ_PACKAGE_JSON(packageURL).
        const { packageJsonURL, packageJson} = packageConfig;

        //  2. If pjson.imports is a non-null Object, then
        if (packageJson.imports !== undefined) {
            //  1. Let resolvedMatch be the result of PACKAGE_IMPORTS_EXPORTS_RESOLVE(specifier, pjson.imports, packageURL, true, conditions).
            const resolvedMatch = PACKAGE_IMPORTS_EXPORTS_RESOLVE(specifier, packageJson.imports, packageJsonURL, parentURL, /*isImports*/ true, conditions, options);

            //  2. If resolvedMatch.resolve is not null or undefined, then
            //      1. Return resolvedMatch.
            if (resolvedMatch.resolved !== undefined) return resolvedMatch;
        }
    }

    //  5. Throw a Package Import Not Defined error.
    throw ERR_PACKAGE_IMPORT_NOT_DEFINED(specifier, packageConfig.packageJsonURL && new URL(".", packageConfig.packageJsonURL), parentURL);
}
exports.PACKAGE_IMPORTS_RESOLVE = PACKAGE_IMPORTS_RESOLVE;

/**
 * @param {string} matchKey
 * @param {import("./types").PackageJsonImports} matchObj
 * @param {import("url").URL} packageJsonURL
 * @param {import("url").URL} parentURL
 * @param {boolean} isImports
 * @param {Set<string>} conditions
 * @param {import("./types").ResolverOpts} options
 * @returns {import("./types").EsmMatch}
 */
function PACKAGE_IMPORTS_EXPORTS_RESOLVE(matchKey, matchObj, packageJsonURL, parentURL, isImports, conditions, options) {
    TRACE(options, "PACKAGE_IMPORTS_EXPORTS_RESOLVE", matchKey, packageJsonURL.href, parentURL.href, isImports, [...conditions].join(","));

    // PACKAGE_IMPORTS_EXPORTS_RESOLVE(matchKey, matchObj, packageURL, isImports, conditions)

    //  1. If matchKey is a key of matchObj, and does not end in "*", then
    if (ObjectPrototypeHasOwnProperty(matchObj, matchKey) && !StringPrototypeEndsWith(matchKey, "*")) {
        //  1. Let target be the value of matchObj[matchKey].
        const target = matchObj[matchKey];

        //  2. Let resolved be the result of PACKAGE_TARGET_RESOLVE( packageURL, target, "", false, isImports, conditions).
        const resolved = PACKAGE_TARGET_RESOLVE(packageJsonURL, target, "", matchKey, parentURL, /*pattern*/ false, isImports, conditions, options);

        //  3. Return the object { resolved, exact: true }.
        return { resolved, exact: true };
    }

    //  2. Let expansionKeys be the list of keys of matchObj ending in "/" or "*", sorted by length descending.
    const expansionKeys = ArrayPrototypeSort(
        ArrayPrototypeFilter(
            ObjectGetOwnPropertyNames(matchObj),
            key => StringPrototypeEndsWith(key, "*") || StringPrototypeEndsWith(key, "/")),
        (a, b) => b.length - a.length);

    //  3. For each key expansionKey in expansionKeys, do
    for (const expansionKey of expansionKeys) {
        //  1. If expansionKey ends in "*" and matchKey starts with but is not equal to the substring of expansionKey excluding the last "*" character, then
        if (StringPrototypeEndsWith(expansionKey, "*") && StringPrototypeStartsWith(matchKey, StringPrototypeSlice(expansionKey, 0, -1)) && matchKey.length > expansionKey.length) {
            //  1. Let target be the value of matchObj[expansionKey].
            const target = matchObj[expansionKey];

            //  2. Let subpath be the substring of matchKey starting at the index of the length of expansionKey minus one.
            const subpath = StringPrototypeSubstr(matchKey, expansionKey.length - 1);

            //  3. Let resolved be the result of PACKAGE_TARGET_RESOLVE( packageURL, target, subpath, true, isImports, conditions).
            const resolved = PACKAGE_TARGET_RESOLVE(packageJsonURL, target, subpath, expansionKey, parentURL, /*pattern*/ true, isImports, conditions, options);

            //  4. Return the object { resolved, exact: true }.
            return { resolved, exact: true };
        }

        //  2. If matchKey starts with expansionKey, then
        else if (StringPrototypeEndsWith(expansionKey, "/") && StringPrototypeStartsWith(matchKey, expansionKey)) {
            //  1. Let target be the value of matchObj[expansionKey].
            const target = matchObj[expansionKey];

            //  2. Let subpath be the substring of matchKey starting at the index of the length of expansionKey.
            const subpath = StringPrototypeSubstr(matchKey, expansionKey.length);

            //  3. Let resolved be the result of PACKAGE_TARGET_RESOLVE( packageURL, target, subpath, false, isImports, conditions).
            const resolved = PACKAGE_TARGET_RESOLVE(packageJsonURL, target, subpath, expansionKey, parentURL, /*pattern*/ false, isImports, conditions, options);

            //  4. Return the object { resolved, exact: false }.
            return { resolved, exact: false };
        }
    }

    //  4. Return the object { resolved: null, exact: true }.
    return { resolved: undefined, exact: true };
}
exports.PACKAGE_IMPORTS_EXPORTS_RESOLVE = PACKAGE_IMPORTS_EXPORTS_RESOLVE;

/**
 * @param {import("url").URL} packageJsonURL
 * @param {import("./types").PackageJsonRelativeExport | null} target
 * @param {string} subpath
 * @param {string} packageSubpath
 * @param {import("url").URL} parentURL
 * @param {boolean} pattern
 * @param {boolean} internal
 * @param {Set<string>} conditions
 * @param {import("./types").ResolverOpts} options
 * @returns {import("url").URL | undefined}
 */
function PACKAGE_TARGET_RESOLVE(packageJsonURL, target, subpath, packageSubpath, parentURL, pattern, internal, conditions, options) {
    TRACE(options, "PACKAGE_TARGET_RESOLVE", packageJsonURL.href, subpath, packageSubpath, parentURL.href, pattern, internal, [...conditions].join(","));

    // PACKAGE_TARGET_RESOLVE(packageURL, target, subpath, pattern, internal, conditions)

    //  1. If target is a String, then
    if (typeof target === "string") {
        TRACE(options, "> target is string");

        //  1. If pattern is false, subpath has non-zero length and target does not end with "/", throw an Invalid Module Specifier error.
        if (!pattern && subpath !== "" && !StringPrototypeEndsWith(target, "/")) throw ERR_INVALID_PACKAGE_TARGET(new URL(".", packageJsonURL), packageSubpath, target, internal, parentURL);

        //  2. If target does not start with "./", then
        if (!StringPrototypeStartsWith(target, "./")) {
            TRACE(options, "> target not package relative");

            //  1. If internal is true and target does not start with "../" or "/" and is not a valid URL, then
            if (internal && !StringPrototypeStartsWith(target, "../") && !StringPrototypeStartsWith(target, "/") && !isUrlString(target)) {
                TRACE(options, "> target is internal and not a relative path, absolute path, or url");
                //  1. If pattern is true, then
                //      1. Return PACKAGE_RESOLVE(target with every instance of "*" replaced by subpath, packageURL + "/").
                //  2. Return PACKAGE_RESOLVE(target + subpath, packageURL + "/").
                const exportTarget = pattern ? StringPrototypeReplace(target, /\*/g, subpath) : target + subpath;
                return PACKAGE_RESOLVE(exportTarget, packageJsonURL, conditions, options);
            }

            //  2. Otherwise, throw an Invalid Package Target error.
            throw ERR_INVALID_PACKAGE_TARGET(new URL(".", packageJsonURL), packageSubpath, target, internal, parentURL);
        }

        TRACE(options, "> target is package relative");

        //  3. If target split on "/" or "\" contains any ".", ".." or "node_modules" segments after the first segment, throw an Invalid Package Target error.
        if (RegExpPrototypeTest(/(^|[\\/])(\.\.?|node_modules)($|[\\/])/, StringPrototypeSlice(target, 2))) throw ERR_INVALID_PACKAGE_TARGET(new URL(".", packageJsonURL), packageSubpath, target, internal, parentURL);

        //  4. Let resolvedTarget be the URL resolution of the concatenation of packageURL and target.
        const resolvedTarget = new URL(target, packageJsonURL);
        const resolvedPath = fileURLToPath(resolvedTarget);
        const packagePath = fileURLToPath(new URL(".", packageJsonURL));

        //  5. Assert: resolvedTarget is contained in packageURL.
        if (!StringPrototypeStartsWith(resolvedPath, packagePath)) throw ERR_INVALID_PACKAGE_TARGET(new URL(".", packageJsonURL), packageSubpath, target, internal, parentURL);

        if (subpath === "") return resolvedTarget;

        //  6. If subpath split on "/" or "\" contains any ".", ".." or "node_modules" segments, throw an Invalid Module Specifier error.
        if (RegExpPrototypeTest(/(^|[\\/])(\.\.?|node_modules)($|[\\/])/, subpath)) throw ERR_INVALID_MODULE_SPECIFIER(packageSubpath + subpath, `request is not a valid subpath for the "${internal ? "imports" : "exports"}" resolution of '${fileURLToPath(packageJsonURL)}'`, parentURL);

        //  7. If pattern is true, then
        //      1. Return the URL resolution of resolvedTarget with every instance of "*" replaced with subpath.
        if (pattern) return new URL(StringPrototypeReplace(resolvedTarget.href, /\*/g, subpath));

        //  8. Otherwise,
        //      1. Return the URL resolution of the concatenation of subpath and resolvedTarget.
        return new URL(subpath, resolvedTarget);
    }

    //  2. Otherwise, if target is a non-null Object, then
    if (isObject(target) && !ArrayIsArray(target)) {
        //  1. If exports contains any index property keys, as defined in ECMA-262 6.1.7 Array Index, throw an Invalid Package Configuration error.
        const keys = ObjectGetOwnPropertyNames(target);
        for (const key of keys) {
            if (`${+key}` === key && +key >= 0 && +key < 0xffffffff) throw ERR_INVALID_PACKAGE_CONFIG(fileURLToPath(packageJsonURL), parentURL, '"exports" cannot contain numeric property keys');
        }

        //  2. For each property p of target, in object insertion order as,
        for (const key of keys) {
            //  1. If p equals "default" or conditions contains an entry for p, then
            if (key === "default" || SetPrototypeHas(conditions, key)) {
                //  1. Let targetValue be the value of the p property in target.
                const targetValue = target[key];

                //  2. Let resolved be the result of PACKAGE_TARGET_RESOLVE( packageURL, targetValue, subpath, pattern, internal, conditions).
                const resolved = PACKAGE_TARGET_RESOLVE(packageJsonURL, targetValue, subpath, packageSubpath, parentURL, pattern, internal, conditions, options);

                //  3. If resolved is equal to undefined, continue the loop.
                if (resolved === undefined) continue;

                //  4. Return resolved.
                return resolved;
            }
        }

        //  3. Return undefined.
        return undefined;
    }

    //  3. Otherwise, if target is an Array, then
    if (ArrayIsArray(target)) {
        //  1. If target.length is zero, return null.
        if (target.length === 0) return undefined;

        //  2. For each item targetValue in target, do
        let lastError;
        for (const targetValue of target) {
            //  1. Let resolved be the result of PACKAGE_TARGET_RESOLVE( packageURL, targetValue, subpath, pattern, internal, conditions), continuing the loop on any Invalid Package Target error.
            let resolved;
            try {
                resolved = PACKAGE_TARGET_RESOLVE(packageJsonURL, targetValue, subpath, packageSubpath, parentURL, pattern, internal, conditions, options);
            }
            catch (e) {
                lastError = { value: e };
                continue;
            }

            //  2. If resolved is undefined, continue the loop.
            if (resolved === undefined) continue;

            //  3. Return resolved.
            return resolved;
        }

        //  3. Return or throw the last fallback resolution null return or error.
        if (lastError) throw lastError.value;
        return undefined;
    }

    //  4. Otherwise, if target is null, return null.
    if (target === null) return undefined;

    //  5. Otherwise throw an Invalid Package Target error.
    throw ERR_INVALID_PACKAGE_TARGET(new URL(".", packageJsonURL), packageSubpath, target, internal, parentURL);
}
exports.PACKAGE_TARGET_RESOLVE = PACKAGE_TARGET_RESOLVE;

/**
 * @param {string} packageSpecifier
 * @param {import("url").URL} parentURL
 * @param {Set<string>} conditions
 * @param {import("./types").ResolverOpts} options
 * @returns {import("url").URL}
 */
function PACKAGE_RESOLVE(packageSpecifier, parentURL, conditions, options) {
    TRACE(options, "PACKAGE_RESOLVE", packageSpecifier, parentURL.href, [...conditions].join(","));

    // PACKAGE_RESOLVE(packageSpecifier, parentURL)

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
    const { packageName, packageSubpath, isScoped } = parsePackageName(packageSpecifier, parentURL);

    //  7. Let selfUrl be the result of PACKAGE_SELF_RESOLVE(packageName, packageSubpath, parentURL).
    const selfUrl = PACKAGE_SELF_RESOLVE(packageName, packageSubpath, parentURL, conditions, options);

    //  8. If selfUrl is not undefined, return selfUrl.
    if (selfUrl !== undefined) return selfUrl;

    //  9. If packageSubpath is "." and packageName is a Node.js builtin module, then
    //      1. Return the string "node:" concatenated with packageSpecifier.
    if (packageSubpath === "." && isCore(packageName)) return new URL("node:" + packageSpecifier);

    //  10. While parentURL is not the file system root,
    //      1. Let packageURL be the URL resolution of "node_modules/" concatenated with packageSpecifier, relative to parentURL.
    //      2. Set parentURL to the parent folder URL of parentURL.
    //      3. If the folder at packageURL does not exist, then
    //          1. Set parentURL to the parent URL path of parentURL.
    //          2. Continue the next loop iteration.
    //      4. Let pjson be the result of READ_PACKAGE_JSON(packageURL).
    //      5. If pjson is not null and pjson.exports is not null or undefined, then
    //          1. Let exports be pjson.exports.
    //          2. Return the resolved destructured value of the result of PACKAGE_EXPORTS_RESOLVE(packageURL, packageSubpath, pjson.exports, defaultConditions).
    //      6. Otherwise, if packageSubpath is equal to ".", then
    //          1. Return the result applying the legacy LOAD_AS_DIRECTORY CommonJS resolver to packageURL, throwing a Module Not Found error for no resolution.
    //      7. Otherwise,
    //          1. Return the URL resolution of packageSubpath in packageURL.

    let packageJsonURL = new URL(`./node_modules/${packageName}/package.json`, parentURL);
    while (true) {
        const packageJsonPath = fileURLToPath(packageJsonURL);
        if (!isDirectory(pathDirname(packageJsonPath))) {
            const lastPackageJsonURL = packageJsonURL;
            packageJsonURL = new URL(`${isScoped ? "../" : ""}../../../node_modules/${packageName}/package.json`, packageJsonURL);
            if (lastPackageJsonURL.pathname === packageJsonURL.pathname) break;
            continue;
        }

        const packageConfig = readPackageConfig(packageJsonURL, options);
        if (packageConfig.packageJson.exports !== undefined) {
            return PACKAGE_EXPORTS_RESOLVE(packageJsonURL, packageSubpath, packageConfig.packageJson, parentURL, conditions, options).resolved;
        }

        if (packageSubpath === ".") {
            let P;
            try {
                P = cjsResolver.LOAD_AS_DIRECTORY(fileURLToPath(new URL(".", packageJsonURL)), fileURLToPath(parentURL), options);
            }
            catch { }
            if (P !== undefined) {
                return pathToFileURL(P);
            }
            throw ERR_MODULE_NOT_FOUND(packageName, parentURL, "module");
        }

        return new URL(packageSubpath, packageJsonURL);
    }

    //  11. Throw a Module Not Found error.
    throw ERR_MODULE_NOT_FOUND(packageName, parentURL, "module");
}
exports.PACKAGE_RESOLVE = PACKAGE_RESOLVE;

/**
 * @param {string} packageName
 * @param {string} packageSubpath
 * @param {import("url").URL} parentURL
 * @param {Set<string>} conditions
 * @param {import("./types").ResolverOpts} options
 * @returns {import("url").URL | undefined}
 */
function PACKAGE_SELF_RESOLVE(packageName, packageSubpath, parentURL, conditions, options) {
    TRACE(options, "PACKAGE_SELF_RESOLVE", packageName, packageSubpath, parentURL.href, [...conditions].join(","));

    // PACKAGE_SELF_RESOLVE(packageName, packageSubpath, parentURL)

    //  1. Let packageURL be the result of READ_PACKAGE_SCOPE(parentURL).
    const packageConfig = READ_PACKAGE_SCOPE(parentURL, options);

    //  2. If packageURL is null, then
    //      1. Return undefined.
    if (!packageConfig.exists) return undefined;

    //  3. Let pjson be the result of READ_PACKAGE_JSON(packageURL).
    const packageJson = packageConfig.packageJson;

    //  4. If pjson is null or if pjson.exports is null or undefined, then
    //      1. Return undefined.
    if (packageJson === null || packageJson.exports === null || packageJson.exports === undefined) return undefined;

    //  5. If pjson.name is equal to packageName, then
    //      1. Return the resolved destructured value of the result of PACKAGE_EXPORTS_RESOLVE(packageURL, subpath, pjson.exports, defaultConditions).
    if (packageJson.name === packageName && packageJson.exports !== undefined) {
        return PACKAGE_EXPORTS_RESOLVE(packageConfig.packageJsonURL, packageSubpath, packageJson, parentURL, conditions, options).resolved;
    }

    //  6. Otherwise, return undefined.
    return undefined;
}
exports.PACKAGE_SELF_RESOLVE = PACKAGE_SELF_RESOLVE;

// /**
//  * @param {URL} url
//  * @param {import("./types").ResolverOpts} options
//  */
// function ESM_FORMAT(url, options) {
//     if (/\.mjs$/.test(url.pathname)) return "module";
//     if (/\.cjs$/.test(url.pathname)) return "commonjs";
//     const packageConfig = READ_PACKAGE_SCOPE(url, options);
//     if (packageConfig.exists && packageConfig.packageJson.type === "module") {
//         if (/\.js$/.test(url.pathname)) return "module";
//     }
//     throw ERR_IMPORT_NOT_RESOLVED();
// }
// exports.ESM_FORMAT = ESM_FORMAT;

/**
 * @param {import("url").URL} url
 * @param {import("./types").ResolverOpts} options
 * @returns {import("./types").PackageConfig}
 */
function READ_PACKAGE_SCOPE(url, options) {
    // READ_PACKAGE_SCOPE(url)

    //  1. Let scopeURL be url.
    //  2. While scopeURL is not the file system root,
    //      1. Set scopeURL to the parent URL of scopeURL.
    //      2. If scopeURL ends in a "node_modules" path segment, return null.
    //      3. Let pjson be the result of READ_PACKAGE_JSON(scopeURL).
    //      4. If pjson is not null, then
    //          1. Return pjson.
    //  3. Return null.

    return findPackageConfig(url, options);
}
exports.READ_PACKAGE_SCOPE = READ_PACKAGE_SCOPE;

/**
 * @template T
 * @param {T} value
 * @returns {value is Exclude<T, string | symbol | number | bigint | boolean | null | undefined>}
 */
function isObject(value) {
    return typeof value === "object" && value !== null;
}