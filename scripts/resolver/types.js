/**
 * @typedef {Parameters<typeof import("jest-resolve").findNodeModule>[1]} ResolverOptsBase
 */

/**
 * @typedef JestResolverOptsMixin
 * @property {string} [filename]
 * @property {(request: string, options: ResolverOpts) => string} defaultResolver
 * @property {(pkg: any, file: string, dir: string) => any} [packageFilter]
 */

/**
 * @typedef {ResolverOptsBase & JestResolverOptsMixin} ResolverOpts
 */

const conditionalBrand = Symbol();
const relativeExportsBrand = Symbol();

/**
 * @typedef {{ [key: string]: string | PackageJsonConditionalExports | undefined; } & { [conditionalBrand]?: never}} PackageJsonConditionalExports
 */

/**
 * @typedef {PackageJsonRelativeExport[]} PackageJsonRelativeExportArray
 */

/**
 * @typedef {string | PackageJsonConditionalExports | PackageJsonRelativeExportArray } PackageJsonRelativeExport
 */

/**
 * @typedef {{ [key: string]: PackageJsonRelativeExport | null | undefined } & { [relativeExportsBrand]?: never }} PackageJsonRelativeExports
 */

/**
 * @typedef {PackageJsonRelativeExport | PackageJsonRelativeExports} PackageJsonExports
 */

/**
 * @typedef {PackageJsonRelativeExports} PackageJsonImports
 */

/**
 * @typedef PackageJson
 * @property {string} name
 * @property {string} [type]
 * @property {string} [main]
 * @property {PackageJsonImports} [imports]
 * @property {PackageJsonExports} [exports]
 */

/**
 * @typedef PackageName
 * @property {string} packageName
 * @property {string} packageSubpath
 * @property {boolean} isScoped
 */

/**
 * @typedef PackageConfig
 * @property {PackageJson} packageJson
 * @property {import("url").URL} packageJsonURL
 * @property {boolean} exists
 */

/**
 * @typedef EsmMatch
 * @property {import("url").URL} resolved
 * @property {boolean} exact
 */

module.exports = {};