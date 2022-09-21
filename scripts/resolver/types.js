/**
 * @typedef {import("jest-resolve").FindNodeModuleConfig} ResolverOptsBase
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
 * @typedef {{ [key: string]: string | PackageJsonConditionalExports; } & { [conditionalBrand]?: never}} PackageJsonConditionalExports
 */

/**
 * @typedef {PackageJsonRelativeExport[]} PackageJsonRelativeExportArray
 */

/**
 * @typedef {string | PackageJsonConditionalExports | PackageJsonRelativeExportArray } PackageJsonRelativeExport
 */

/**
 * @typedef {{ [key: string]: PackageJsonRelativeExport | null } & { [relativeExportsBrand]?: never }} PackageJsonRelativeExports
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
 * @typedef UnresolvedEsmMatch
 * @property {undefined} resolved
 * @property {boolean} exact
 */

/**
 * @typedef ResolvedEsmMatch
 * @property {import("url").URL} resolved
 * @property {boolean} exact
 */

/**
 * @typedef {UnresolvedEsmMatch | ResolvedEsmMatch} EsmMatch
 */

 module.exports = {};