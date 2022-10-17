// @ts-check
const { realpathSync: _realpathSync } = require("fs");
const { resolve: _pathResolve, dirname: _pathDirname, join: _pathJoin, extname: pathExtname, basename: pathBasename } = require("path");
const isCore = require("is-core-module");
const nodeModulesPaths = require("resolve/lib/node-modules-paths");
const { URL, fileURLToPath, pathToFileURL } = require("url");
const { pathResolve, realpathSyncCached, pathDirname, isFile, pathJoin, readPackageConfig, findPackageConfig, parsePackageName, findTSConfig, ensureTrailingDirectorySeparator, normalizeSlashes, pathContains, TRACE } = require("./utils");
const { Set, StringPrototypeStartsWith, RegExpPrototypeTest } = require("./primordials");
const { ERR_MODULE_NOT_FOUND } = require("./errors");
const esmResolver = require("./esmResolver");

//
// CommonJS
//

/**
 * @param {string} X The module to load
 * @param {string} Y The path to the requesting module
 * @param {import("./types").ResolverOpts} options
 * @returns {string}
 */
function COMMONJS_RESOLVE(X, Y, options) {
    // require(X) from module at path Y
    TRACE(options, "COMMONJS_RESOLVE", X, Y);

    //  1. If X is a core module,
    //     a. return the core module
    //     b. STOP
    if (isCore(X)) return X;

    //  2. If X begins with '/'
    //     a. set Y to be the filesystem root
    if (StringPrototypeStartsWith(X, "/")) Y = pathResolve("/");

    const base = realpathSyncCached(pathResolve(options.basedir));
    const dirnameY = pathDirname(realpathSyncCached(pathResolve(base, Y)));

    let P;

    //  3. If X begins with './' or '/' or '../'
    if (RegExpPrototypeTest(/^(\.\/|\.\.\/|\/|[a-z]:[\\/])/i, X)) {
        const YX = pathResolve(dirnameY, X) + (RegExpPrototypeTest(/(^(\.|\.\.)|\/)$/, X) ? "/" : "");

        //  a. LOAD_AS_FILE(Y + X)
        P ??= LOAD_AS_FILE(YX, options);

        //  b. LOAD_AS_DIRECTORY(Y + X)
        P ??= LOAD_AS_DIRECTORY(YX, Y, options);

        if (P !== undefined) return realpathSyncCached(P);

        //  c. THROW "not found"
        throw ERR_MODULE_NOT_FOUND(X, options.filename ?? Y);
    }

    //  4. If X begins with '#'
    //     a. LOAD_PACKAGE_IMPORTS(X, dirname(Y))
    if (StringPrototypeStartsWith(X, "#")) {
        P = LOAD_PACKAGE_IMPORTS(X, dirnameY, Y, options);
    }
    else {
        //  5. LOAD_PACKAGE_SELF(X, dirname(Y))
        P ??= LOAD_PACKAGE_SELF(X, dirnameY, Y, options);

        //  6. LOAD_NODE_MODULES(X, dirname(Y))
        P ??= LOAD_NODE_MODULES(X, dirnameY, Y, options);
    }

    if (P !== undefined) return realpathSyncCached(P);

    //  7. THROW "not found"
    throw ERR_MODULE_NOT_FOUND(X, options.filename ?? Y);
}
exports.COMMONJS_RESOLVE = COMMONJS_RESOLVE;

/**
 * @param {string} X
 * @param {import("./types").ResolverOpts} options
 * @returns {string|undefined}
 */
function LOAD_AS_FILE(X, options) {
    TRACE(options, "LOAD_AS_FILE", X);

    const extensions = options.extensions ?? [".js"];
    // LOAD_AS_FILE(X)
    // 1. If X is a file, load X as its file extension format. STOP
    if (isFile(X)) return X;
    // 2. If X.js is a file, load X.js as JavaScript text. STOP
    // 3. If X.json is a file, parse X.json to a JavaScript Object. STOP
    // 4. If X.node is a file, load X.node as binary addon. STOP
    for (const ext of extensions) {
        if (isFile(X + ext)) return X + ext;
    }

    // MODIFIED to pick up .ts file for .js import (matches TS module resolution)
    for (const ext of extensions) {
        if (/^\.[mc]?jsx?$/.test(ext) && X.endsWith(ext)) {
            const X2 = X.slice(0, -ext.length);
            for (const ext2 of extensions) {
                if (/^\.[mc]?tsx?$/.test(ext2)) {
                    if (isFile(X2 + ext2)) return X2 + ext2;
                }
            }
        }
    }
}
exports.LOAD_AS_FILE = LOAD_AS_FILE;

/**
 * @param {string} X
 * @param {import("./types").ResolverOpts} options
 * @returns {string|undefined}
 */
function LOAD_INDEX(X, options) {
    TRACE(options, "LOAD_INDEX", X);

    // LOAD_INDEX(X)
    // 1. If X/index.js is a file, load X/index.js as JavaScript text. STOP
    // 2. If X/index.json is a file, parse X/index.json to a JavaScript object. STOP
    // 3. If X/index.node is a file, load X/index.node as binary addon. STOP
    const extensions = options.extensions ?? [".js"];
    for (const ext of extensions) {
        const pathX = pathJoin(X, "index" + ext);
        if (isFile(pathX)) return pathX;
    }
}
exports.LOAD_INDEX = LOAD_INDEX;

/**
 * @param {string} X
 * @param {string} Y
 * @param {import("./types").ResolverOpts} options
 * @returns {string|undefined}
 */
function LOAD_AS_DIRECTORY(X, Y, options) {
    TRACE(options, "LOAD_AS_DIRECTORY", X, Y);

    // LOAD_AS_DIRECTORY(X)
    // 1. If X/package.json is a file,
    //    a. Parse X/package.json, and look for "main" field.
    //    b. If "main" is a falsy value, GOTO 2.
    //    c. let M = X + (json main field)
    //    d. LOAD_AS_FILE(M)
    //    e. LOAD_INDEX(M)
    //    f. LOAD_INDEX(X) DEPRECATED
    //    g. THROW "not found"
    const packageConfig = readPackageConfig(pathToFileURL(pathJoin(X, "package.json")), options);
    if (packageConfig.exists) {
        const { packageJson } = packageConfig;
        if (packageJson.main) {
            const M = pathJoin(X, packageJson.main);
            let P;
            P ??= LOAD_AS_FILE(M, options);
            P ??= LOAD_INDEX(M, options);
            P ??= LOAD_INDEX(X, options); // deprecated
            if (P !== undefined) return P;
            throw ERR_MODULE_NOT_FOUND(X, options.filename ?? Y);
        }
    }
    // 2. LOAD_INDEX(X)
    return LOAD_INDEX(X, options);
}
exports.LOAD_AS_DIRECTORY = LOAD_AS_DIRECTORY;

/**
 * @param {string} X
 * @param {string} START
 * @param {string} Y
 * @param {import("./types").ResolverOpts} options
 * @returns {string|undefined}
 */
function LOAD_NODE_MODULES(X, START, Y, options) {
    TRACE(options, "LOAD_NODE_MODULES", X, START, Y);

    // LOAD_NODE_MODULES(X, START)

    // 1. let DIRS = NODE_MODULES_PATHS(START)
    const DIRS = NODE_MODULES_PATHS(START, options, X);

    // 2. for each DIR in DIRS:
    for (const DIR of DIRS) {
        let P;

        // a. LOAD_PACKAGE_EXPORTS(X, DIR)
        P ??= LOAD_PACKAGE_EXPORTS(X, DIR, Y, options);

        // b. LOAD_AS_FILE(DIR/X)
        P ??= LOAD_AS_FILE(pathJoin(DIR, X), options);

        // c. LOAD_AS_DIRECTORY(DIR/X)
        P ??= LOAD_AS_DIRECTORY(pathJoin(DIR, X), Y, options);

        if (P !== undefined) return P;
    }
}
exports.LOAD_NODE_MODULES = LOAD_NODE_MODULES;

/**
 * @param {string} START
 * @param {import("./types").ResolverOpts} options
 * @param {string} request
 * @returns {string[]}
 */
function NODE_MODULES_PATHS(START, options, request) {
    TRACE(options, "NODE_MODULES_PATHS", START, request);

    // NODE_MODULES_PATHS(START)
    // 1. let PARTS = path split(START)
    // 2. let I = count of PARTS - 1
    // 3. let DIRS = [GLOBAL_FOLDERS]
    // 4. while I >= 0,
    //    a. if PARTS[I] = "node_modules" CONTINUE
    //    b. DIR = path join(PARTS[0 .. I] + "node_modules")
    //    c. DIRS = DIRS + DIR
    //    d. let I = I - 1
    // 5. return DIRS

    // const PARTS = START.split(/[\\/]/g);
    // let I = PARTS.length - 1;
    // const DIRS = [];
    // while (I >= 0) {
    //     if (PARTS[I] === "node_modules") break;
    //     const DIR = pathJoin(...PARTS.slice(0, I), "node_modules");
    //     DIRS.push(DIR);
    //     I--;
    // }
    // return DIRS;

    return nodeModulesPaths(START, options, request);
}
exports.NODE_MODULES_PATHS = NODE_MODULES_PATHS;

/**
 * @param {string} X
 * @param {string} DIR
 * @param {string} Y
 * @param {import("./types").ResolverOpts} options
 * @returns {string|undefined}
 */
function LOAD_PACKAGE_IMPORTS(X, DIR, Y, options) {
    TRACE(options, "LOAD_PACKAGE_IMPORTS", X, DIR, Y);

    // LOAD_PACKAGE_IMPORTS(X, DIR)
    // 1. Find the closest package scope SCOPE to DIR.
    const packageConfig = findPackageConfig(pathToFileURL(ensureTrailingDirectorySeparator(DIR)), options);

    // 2. If no scope was found, return.
    if (!packageConfig.exists) {
        TRACE(options, "> no package config.");
        return;
    }
    const { packageJson, packageJsonURL } = packageConfig;

    // 3. If the SCOPE/package.json "imports" is null or undefined, return.
    if (packageJson.imports === undefined) {
        TRACE(options, `> package ${fileURLToPath(packageJsonURL)} does not have imports.`);
        return;
    }

    // 4. let MATCH = PACKAGE_IMPORTS_RESOLVE(X, pathToFileURL(SCOPE),
    //   ["node", "require"]) defined in the ESM resolver.
    const MATCH = esmResolver.PACKAGE_IMPORTS_RESOLVE(X, new URL(".", packageJsonURL), new Set(["node", "require"]), options);

    // 5. RESOLVE_ESM_MATCH(MATCH).
    return RESOLVE_ESM_MATCH(MATCH, Y, options, /*resolveInput*/ true);
}
exports.LOAD_PACKAGE_IMPORTS = LOAD_PACKAGE_IMPORTS;

/**
 * @param {string} X
 * @param {string} DIR
 * @param {string} Y
 * @param {import("./types").ResolverOpts} options
 * @returns {string|undefined}
 */
function LOAD_PACKAGE_EXPORTS(X, DIR, Y, options) {
    TRACE(options, "LOAD_PACKAGE_EXPORTS", X, DIR, Y);

    // LOAD_PACKAGE_EXPORTS(X, DIR)
    // 1. Try to interpret X as a combination of NAME and SUBPATH where the name
    //    may have a @scope/ prefix and the subpath begins with a slash (`/`).
    // 2. If X does not match this pattern or DIR/NAME/package.json is not a file,
    //    return.
    let packageName;
    try {
        packageName = parsePackageName(X, pathToFileURL(DIR));
    }
    catch {
        return;
    }
    const { packageName: NAME, packageSubpath: SUBPATH } = packageName;

    // 3. Parse DIR/NAME/package.json, and look for "exports" field.
    const packageConfig = readPackageConfig(pathToFileURL(pathJoin(DIR, NAME, "package.json")), options);
    if (!packageConfig.exists) return;
    const { packageJson, packageJsonURL } = packageConfig;

    // 4. If "exports" is null or undefined, return.
    if (packageJson.exports === undefined) return;

    // 5. let MATCH = PACKAGE_EXPORTS_RESOLVE(pathToFileURL(DIR/NAME), "." + SUBPATH,
    //    `package.json` "exports", ["node", "require"]) defined in the ESM resolver.
    const MATCH = esmResolver.PACKAGE_EXPORTS_RESOLVE(packageJsonURL, SUBPATH, packageJson, pathToFileURL(Y), new Set(["node", "require"]), options);

    // 6. RESOLVE_ESM_MATCH(MATCH)
    return RESOLVE_ESM_MATCH(MATCH, Y, options, /*resolveInput*/ false);
}
exports.LOAD_PACKAGE_EXPORTS = LOAD_PACKAGE_EXPORTS;

/**
 * @param {string} X
 * @param {string} DIR
 * @param {string} Y
 * @param {import("./types").ResolverOpts} options
 * @returns {string|undefined}
 */
function LOAD_PACKAGE_SELF(X, DIR, Y, options) {
    TRACE(options, "LOAD_PACKAGE_SELF", X, DIR, Y);

    // LOAD_PACKAGE_SELF(X, DIR)
    // 1. Find the closest package scope SCOPE to DIR.
    const packageInfo = findPackageConfig(pathToFileURL(DIR), options);

    // 2. If no scope was found, return.
    if (!packageInfo.exists) return;
    const { packageJson, packageJsonURL } = packageInfo;

    // 3. If the SCOPE/package.json "exports" is null or undefined, return.
    if (packageJson.exports === null || packageJson.exports === undefined || typeof packageJson.name !== "string") return;

    // 4. If the SCOPE/package.json "name" is not the first segment of X, return.
    if (!(X === packageJson.name || X.startsWith(packageJson.name + "/"))) return;

    // 5. let MATCH = PACKAGE_EXPORTS_RESOLVE(pathToFileURL(SCOPE),
    //    "." + X.slice("name".length), `package.json` "exports", ["node", "require"])
    //    defined in the ESM resolver.
    const MATCH = esmResolver.PACKAGE_EXPORTS_RESOLVE(packageJsonURL, "." + X.slice(packageJson.name.length), packageJson, pathToFileURL(Y), new Set(["node", "require"]), options);

    // 6. RESOLVE_ESM_MATCH(MATCH)
    return RESOLVE_ESM_MATCH(MATCH, Y, options, /*resolveInput*/ true);
}
exports.LOAD_PACKAGE_SELF = LOAD_PACKAGE_SELF;

/**
 * @param {import("./types").ResolvedEsmMatch} MATCH
 * @param {string} Y
 * @param {import("./types").ResolverOpts} options
 * @param {boolean} resolveInput
 */
function RESOLVE_ESM_MATCH(MATCH, Y, options, resolveInput) {
    TRACE(options, "RESOLVE_ESM_MATCH", { resolved: MATCH.resolved.href, exact: MATCH.exact }, Y);

    // RESOLVE_ESM_MATCH(MATCH)
    // 1. let { RESOLVED, EXACT } = MATCH
    const { resolved, exact } = MATCH;

    // 2. let RESOLVED_PATH = fileURLToPath(RESOLVED)
    const RESOLVED_PATH = fileURLToPath(resolved);

    // modification to algorithm: Try to load source file for output file.
    if (resolveInput && (options.conditions?.includes("ts") || options.conditions?.includes("ts-jest") || options.conditions?.includes("ts-node"))) {
        const INPUT = LOAD_AS_INPUT_FILE(RESOLVED_PATH, options);
        if (INPUT !== undefined) return INPUT;
    }
    
    // 3. If EXACT is true,
    //    a. If the file at RESOLVED_PATH exists, load RESOLVED_PATH as its extension
    //       format. STOP
    if (exact) {
        if (isFile(RESOLVED_PATH)) return RESOLVED_PATH;
    }

    // 4. Otherwise, if EXACT is false,
    //    a. LOAD_AS_FILE(RESOLVED_PATH)
    //    b. LOAD_AS_DIRECTORY(RESOLVED_PATH)
    else {
        const P =
            LOAD_AS_FILE(RESOLVED_PATH, options) ??
            LOAD_AS_DIRECTORY(RESOLVED_PATH, Y, options);
        if (P !== undefined) return P;
    }

    // 5. THROW "not found"
    throw ERR_MODULE_NOT_FOUND(RESOLVED_PATH, options.filename ?? Y);
}
exports.RESOLVE_ESM_MATCH = RESOLVE_ESM_MATCH;

const EXTENSIONS = [
    { output: [".d.mts", ".mjs", ".mts" ], input: [".mts", ".mjs"] },
    { output: [".d.cts", ".cjs", ".cts"], input: [".cts", ".cjs"] },
    { output: [".d.ts", ".js", ".jsx", ".ts", ".tsx"], input: [".tsx", ".ts", ".jsx", ".js"] },
];

/**
 * @param {string} X
 * @param {import("./types").ResolverOpts} options
 * @returns {string|undefined}
 */
function LOAD_AS_INPUT_FILE(X, options) {
    const T = TRACE.bind(null, options);
    T("LOAD_AS_INPUT_FILE", X);

    const packageConfig = findPackageConfig(pathToFileURL(X), options);
    if (!packageConfig.exists) {
        T(`> 'package.json' not found.`);
        return undefined;
    }

    const tsconfig = findTSConfig(pathToFileURL(X), options);
    if (!tsconfig.exists) {
        T(`> 'tsconfig.json' not found.`);
        return undefined;
    }

    const packageDir = fileURLToPath(new URL("./", packageConfig.packageJsonURL));
    const tsconfigFile = fileURLToPath(tsconfig.tsconfigJsonURL);
    if (!pathContains(packageDir, tsconfigFile, process.platform === "win32") ||
        pathContains(pathResolve(packageDir, "node_modules"), tsconfigFile, process.platform === "win32")) {
        T(`> 'tsconfig.json' not in package.`);
        return undefined;
    }

    if (options.rootDir && (
        !pathContains(options.rootDir, fileURLToPath(tsconfig.tsconfigJsonURL), process.platform === "win32") ||
        pathContains(pathResolve(options.rootDir, "node_modules"), fileURLToPath(tsconfig.tsconfigJsonURL), process.platform === "win32"))) {
        T(`> file referenced from external package.`);
        return undefined;
    }

    if (!(tsconfig.project.options.declarationDir || tsconfig.project.options.outDir)) {
        T(`> 'tsconfig.json' has no outDir.`);
        return undefined;
    }

    const tsconfigDir = fileURLToPath(new URL("./", tsconfig.tsconfigJsonURL));
    const rootDir =
        tsconfig.project.options.rootDir ? ensureTrailingDirectorySeparator(pathResolve(tsconfigDir, tsconfig.project.options.rootDir)) :
        tsconfig.project.options.composite ? ensureTrailingDirectorySeparator(pathResolve(tsconfigDir)) :
        undefined;

    if (!rootDir) {
        T(`> failed to discover rootDir.`);
        return undefined;
    }

    const candidatesOutDirs = new Set();
    if (tsconfig.project.options.declarationDir) candidatesOutDirs.add(ensureTrailingDirectorySeparator(pathResolve(tsconfigDir, tsconfig.project.options.declarationDir)));
    if (tsconfig.project.options.outDir) candidatesOutDirs.add(ensureTrailingDirectorySeparator(pathResolve(tsconfigDir, tsconfig.project.options.outDir)));
    if (typeof tsconfig.project.raw?.esmDir === "string") candidatesOutDirs.add(ensureTrailingDirectorySeparator(pathResolve(tsconfigDir, tsconfig.project.raw.esmDir)));
    if (typeof tsconfig.project.raw?.cjsLegacyDir === "string") candidatesOutDirs.add(ensureTrailingDirectorySeparator(pathResolve(tsconfigDir, tsconfig.project.raw.cjsLegacyDir)));

    const X2 = pathResolve(X);
    for (const candidateOutDir of candidatesOutDirs) {
        if (pathContains(candidateOutDir, X2, process.platform === "win32")) {
            const rest = X2.slice(candidateOutDir.length);
            const candidate = pathResolve(rootDir, rest);
            for (const { output, input } of EXTENSIONS) {
                for (const outputExt of output) {
                    if (candidate.endsWith(outputExt)) {
                        for (const inputExt of input) {
                            const candidateWithExt = pathResolve(pathDirname(candidate), pathBasename(candidate, outputExt) + inputExt);
                            if (isFile(candidateWithExt)) {
                                T(`> found '${candidateWithExt}'`);
                                return candidateWithExt;
                            }
                        }
                    }
                }
            }
        }
    }

    T(`> source file not found.`);
}
exports.LOAD_AS_INPUT_FILE = LOAD_AS_INPUT_FILE;