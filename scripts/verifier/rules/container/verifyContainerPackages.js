// @ts-check
const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const { pickProperty, tryReadJsonFile, isPackageJsonExports, isPackageJsonConditionalExports } = require("../../utils");
const { verifyPackage } = require("../package");

/**
 * Verifies each package in `<container>/*`.
 *
 * @type {import("../../types").ContainerVerifierRule}
 */
function verifyContainerPackages(context) {
    const { paths, basePath: base, knownFiles, expectedContainerProjects, collectProjectReferences, formatLocation, addError, addWarning } = context;
    const { basePath } = paths;
    for (const packageEntry of fs.readdirSync(base, { withFileTypes: true })) {
        if (!packageEntry.isDirectory()) continue; // only directories can be packages

        const packageName = packageEntry.name;
        const packagePath = path.resolve(base, packageName);
        const packageJsonPath = path.resolve(packagePath, "package.json");
        const packageLockJsonPath = path.resolve(packagePath, "package-lock.json");
        const packageTsconfigJsonPath = path.resolve(packagePath, "tsconfig.json");

        const packageJsonFile = tryReadJsonFile(packageJsonPath, d => d.code !== "ENOENT" && addError(d), knownFiles);
        const packageLockJsonFile = tryReadJsonFile(packageLockJsonPath, d => d.code !== "ENOENT" && addError(d), knownFiles);
        const packageTsconfigJsonFile = tryReadJsonFile(packageTsconfigJsonPath, d => d.code !== "ENOENT" && addError(d), knownFiles);

        if (!packageJsonFile) continue; // skip if we couldn't read `<package>/package.json`
        if (!packageTsconfigJsonFile) continue; // skip if we couldn't read `<package>/tsconfig.json`

        /** @type {Map<string, import("typescript").StringLiteral>} */
        let _expectedProjects;

        /** @type {Map<string, import("typescript").StringLiteral>} */
        let _actualProjects;

        /** @type {import("../../../resolver/types").PackageJsonExports} */
        let _exportsMap;

        /** @type {import("../../../resolver/types").PackageJsonExports | null} */
        let _actualExportsMap;

        /** @type {import("../../types").PackageVerifierContext} */
        const context = {
            paths,
            basePath: base,
            packageName,
            packagePath,
            packageJsonFile,
            packageLockJsonFile,
            packageTsconfigJsonFile,
            expectedContainerProjects,
            get expectedProjects() { return _expectedProjects ??= collectPackageDependencies(context, context.packageJsonFile); },
            get actualProjects() { return _actualProjects ??= collectProjectReferences(context.packageTsconfigJsonFile); },
            get generatedExportsMap() { return _exportsMap ??= generateExportsMap(context.packagePath); },
            get actualExportsMap() { return (_actualExportsMap ??= buildActualExportsMap(context.packageJsonFile) ?? null) ?? undefined; },
            baseRelativePackageJsonPath: path.relative(basePath, packageJsonPath),
            baseRelativePackageLockJsonPath: packageLockJsonFile ? path.relative(basePath, packageLockJsonPath) : undefined,
            baseRelativePackageTsconfigJsonPath: path.relative(basePath, packageTsconfigJsonPath),
            addWarning,
            addError,
            formatLocation
        };

        const result = verifyPackage(context);
        if (result === "continue") continue;
        if (result === "break") break;
    }
}
exports.verifyContainerPackages = verifyContainerPackages;

/**
 * Collect the `"dependencies"` and `"devDependencies"` of a `package.json` file.
 *
 * @param {import("../../types").PackageVerifierContext} context
 * @param {import("typescript").JsonSourceFile} file
 */
function collectPackageDependencies(context, file) {
    /** @type {Map<string, ts.StringLiteral>} */
    const packageDependencies = new Map();
    if (file) {
        const dependencies = pickProperty(file.statements[0].expression, "dependencies");
        const devDependencies = pickProperty(file.statements[0].expression, "devDependencies");
        for (const dependenciesObject of [dependencies, devDependencies]) {
            if (dependenciesObject && ts.isObjectLiteralExpression(dependenciesObject)) {
                for (const property of dependenciesObject.properties) {
                    if (!ts.isPropertyAssignment(property) || !ts.isStringLiteral(property.name)) {
                        continue;
                    }
                    const key = property.name.text;
                    if (key.startsWith("@esfx/internal-")) {
                        const packagePath = path.resolve(context.paths.internalPath, key.slice("@esfx/internal-".length));
                        packageDependencies.set(packagePath.toLowerCase(), property.name);
                    }
                    else if (key.startsWith("@esfx/")) {
                        packageDependencies.set(path.resolve(context.paths.packagesPath, key.slice("@esfx/".length)).toLowerCase(), property.name);
                    }
                }
            }
        }
    }
    return packageDependencies;
}

/**
 * Gets the actual `"exports"` map from a package.
 *
 * @param {import("typescript").JsonSourceFile} packageJsonFile
 * @returns {import("../../../resolver/types").PackageJsonExports | undefined}
 */
function buildActualExportsMap(packageJsonFile) {
    const packageJsonObject = packageJsonFile.statements[0].expression;
    if (!ts.isObjectLiteralExpression(packageJsonObject)) return;

    const packageJsonExports = pickProperty(packageJsonObject, "exports");
    if (!packageJsonExports) return;

    const result = visit(packageJsonExports);
    return isPackageJsonExports(result) ? result : undefined;

    /**
     * @param {ts.JsonObjectExpression} node
     */
    function visit(node) {
        switch (node.kind) {
            case ts.SyntaxKind.StringLiteral: return node.text;
            case ts.SyntaxKind.NumericLiteral: return +node.text;
            case ts.SyntaxKind.NullKeyword: return null;
            case ts.SyntaxKind.PrefixUnaryExpression: return node.operator === ts.SyntaxKind.MinusToken ? -visit(node.operand) : visit(node.operand);
            case ts.SyntaxKind.ArrayLiteralExpression: return node.elements.map(child => visit(/** @type {ts.JsonObjectExpression} */(child)));
            case ts.SyntaxKind.ObjectLiteralExpression: return Object.fromEntries(
                node.properties.map(prop => {
                    if (!ts.isPropertyAssignment(prop) || !ts.isStringLiteral(prop.name)) throw new Error("Illegal state");
                    return [prop.name.text, visit(/** @type {ts.JsonObjectExpression} */(prop.initializer))]
                })
            );
        }
    }
}

/**
 * Builds the expected `"exports"` map for a package.
 *
 * @param {string} packagePath
 * @returns {import("../../../resolver/types").PackageJsonExports}
 */
function generateExportsMap(packagePath) {
    // check for multiple exports
    /** @type {import("../../../resolver/types").PackageJsonRelativeExports} */
    const exportMapEntries = {};

    /**
     * @param {"import" | "require"} type
     * @param {string} exportDir
     * @param {string} relativeDir
     * @param {string} dir
     * @param {number} depth
     */
    const collectEntries = (type, exportDir, relativeDir, dir, depth) => {
        if (depth >= 2) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.isDirectory()) {
                if (entry.name === "internal" || entry.name === "__tests__") continue;
                collectEntries(
                    type,
                    `${exportDir}/${entry.name}`,
                    `${relativeDir}/${entry.name}`,
                    path.join(dir, entry.name),
                    depth + 1);
            }
            else if (entry.isFile()) {
                if (!/\.ts$/.test(entry.name)) continue;
                const basename = path.basename(entry.name, ".ts");
                const jsFile = basename + (type === "import" ? ".mjs" : ".js");
                const jsRelativeName = `${relativeDir}/${jsFile}`;
                const dtsFile = basename + (type === "import" ? ".d.mts" : ".d.ts");
                const dtsRelativeName = `${relativeDir}/${dtsFile}`;
                const exportName = entry.name === "index.ts" ? exportDir : `${exportDir}/${jsFile}`;
                let value = exportMapEntries[exportName];
                if (value === undefined) {
                    value = { [type]: { types: dtsRelativeName, default: jsRelativeName } };
                }
                else if (!isPackageJsonConditionalExports(value)) {
                    throw new Error(`Not supported: ${JSON.stringify(value)}`);
                }
                else {
                    value[type] = jsRelativeName;
                }
                exportMapEntries[exportName] = value;
            }
        }
    }

    const srcPath = path.join(packagePath, "src");
    collectEntries("require", ".", "./dist/cjs", srcPath, 0);
    collectEntries("import", ".", "./dist/esm", srcPath, 0);

    for (const _ in exportMapEntries) {
        return exportMapEntries;
    }

    collectEntries("require", ".", "./dist", srcPath, 0);
    return exportMapEntries;
}