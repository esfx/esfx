// @ts-check
const { fileURLToPath } = require("url");
const { ObjectGetOwnPropertyNames, JSONStringify, StringPrototypeStartsWith, ErrorCaptureStackTrace } = require("./primordials");

/**
 * @template {Record<string, (...args: any) => Error> | {}} T
 * @param {T} definitions
 * @returns {T}
 */
function wrapDefinitions(definitions) {
    for (const key of ObjectGetOwnPropertyNames(definitions)) {
        const definition = definitions[key];
        definitions[key] = function NodeError(...args) {
            const error = definition(...args);
            /** @type {NodeJS.ErrnoException} */(error).code = key;
            ErrorCaptureStackTrace?.(error, NodeError);
            return error;
        };
    }
    return definitions;
}

/**
 * @param {string|import("url").URL} packagePath
 */
function withPackageJson(packagePath) {
    return packagePath ? ` in package config '${tryFile(packagePath)}/package.json'` : "";
}

/**
 * @param {string|import("url").URL} referrer 
 */
function withReferrer(referrer) {
    return referrer ? ` imported from '${tryFile(referrer)}'` : "";
}

/**
 * @param {string|import("url").URL} value 
 */
function tryFile(value) {
    return typeof value !== "string" && value.protocol === "file:" ? fileURLToPath(value) : value;
}

function isRelativeError(target, isImport) {
    return !isImport && typeof target === "string" && target !== "" && !StringPrototypeStartsWith(target, "./");
}

module.exports = wrapDefinitions({
    /**
     * @param {string} specifier
     * @param {string|import("url").URL} [packagePath]
     * @param {string|import("url").URL} [base]
     */
    ERR_PACKAGE_IMPORT_NOT_DEFINED: (specifier, packagePath, base) => new TypeError(`Package import specifier "${specifier}" is not defined${withPackageJson(packagePath)}${withReferrer(base)}`),
    /**
     * @param {string|import("url").URL} packagePath
     * @param {string} subpath
     * @param {string|import("url").URL} [base]
     */
    ERR_PACKAGE_PATH_NOT_EXPORTED: (packagePath, subpath, base) => new Error(
        subpath === "." ?
            `No "exports" main defined${withPackageJson(packagePath)}${withReferrer(base)}` :
            `Package subpath '${subpath}' is not defined by "exports"${withPackageJson(packagePath)}${withReferrer(base)}`),
    /**
     * @param {string} request
     * @param {string} reason
     * @param {string|import("url").URL} [base]
     */
    ERR_INVALID_MODULE_SPECIFIER: (request, reason, base) => new TypeError(`Invalid module '${request}' ${reason}${withReferrer(base)}`),
    /**
     * @param {string|import("url").URL} packagePath
     * @param {string} key
     * @param {any} target
     * @param {boolean} isImport
     * @param {string|import("url").URL} [base]
     */
    ERR_INVALID_PACKAGE_TARGET: (packagePath, key, target, isImport, base) => new Error(
        key === "." && !isImport ?
            `Invalid "exports" main target ${JSONStringify(target)} defined${withPackageJson(packagePath)}${withReferrer(base)}${isRelativeError(target, isImport) ? "; targets must start with './'" : ""}` :
            `Invalid "${isImport ? "imports" : "exports"}" target ${JSONStringify(target)} defined for '${key}'${withPackageJson(packagePath)}${withReferrer(base)}${isRelativeError(target, isImport) ? "; targets must start with './'" : ""}`),
    /**
     * @param {string} request
     * @param {string|import("url").URL} base
     */
    ERR_UNSUPPORTED_DIR_IMPORT: (request, base) => new TypeError(`Directory import '${request}' is not supported when resolving ES modules from '${tryFile(base)}'`),
    /**
     * @param {string} request
     * @param {string|import("url").URL} base
     * @param {string} [type]
     */
    ERR_MODULE_NOT_FOUND: (request, base, type = "package") => new Error(`Cannot find ${type} '${request}${withReferrer(base)}`),
    /**
     * @param {string} request
     * @param {string|import("url").URL} base
     * @param {string} message
     */
    ERR_INVALID_PACKAGE_CONFIG: (request, base, message) => new Error(`Invalid package config '${request}'${withReferrer(base)}${message ? `; ${message}` : ""}`)
});
