// @ts-check
const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const { pickProperty, tryReadJsonFile } = require("../../utils");
const { verifyPackage } = require("../package");

/**
 * @type {import("../../types").ContainerVerifierRule}
 */
function verifyContainerPackages(context) {
    const { paths, basePath: base, knownFiles, expectedContainerProjects, collectProjectReferences, formatLocation, addError, addWarning } = context;
    const { basePath } = paths;
    for (const packageName of fs.readdirSync(base)) {
        const packagePath = path.resolve(base, packageName);
        if (!fs.statSync(packagePath).isDirectory()) continue;

        const packageJsonPath = path.resolve(packagePath, "package.json");
        if (!fs.existsSync(packageJsonPath)) continue;

        const packageLockJsonPath = path.resolve(packagePath, "package-lock.json");
        const hasPackageLock = fs.existsSync(packageLockJsonPath);

        const packageTsconfigJsonPath = path.resolve(packagePath, "tsconfig.json");
        if (!fs.existsSync(packageTsconfigJsonPath)) continue;

        const packageJsonFile = tryReadJsonFile(packageJsonPath, addError);
        if (!packageJsonFile) continue;

        knownFiles.set(packageJsonFile.fileName, packageJsonFile);

        const packageLockJsonFile = hasPackageLock ? tryReadJsonFile(packageLockJsonPath, addError) : undefined;
        if (packageLockJsonFile) knownFiles.set(packageLockJsonFile.fileName, packageLockJsonFile);

        /** @type {import("typescript").JsonSourceFile} */
        const packageTsconfigJsonFile = tryReadJsonFile(packageTsconfigJsonPath, addError);
        if (!packageTsconfigJsonFile) continue;

        knownFiles.set(packageTsconfigJsonFile.fileName, packageTsconfigJsonFile);

        /** @type {Map<string, import("typescript").StringLiteral>} */
        let _expectedProjects;
        /** @type {Map<string, import("typescript").StringLiteral>} */
        let _actualProjects;
        /** @type {[string, string][]} */
        let _exportMapEntries;
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
            get expectedProjects() { return _expectedProjects ||= collectPackageDependencies(context, context.packageJsonFile); },
            get actualProjects() { return _actualProjects || collectProjectReferences(context.packageTsconfigJsonFile); },
            get exportMapEntries() { return _exportMapEntries || collectExportMapEntries(context.packagePath); },
            baseRelativePackageJsonPath: path.relative(basePath, packageJsonPath),
            baseRelativePackageLockJsonPath: hasPackageLock ? path.relative(basePath, packageLockJsonPath) : undefined,
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
 * @param {import("../../types").PackageVerifierContext} context
 * @param {import("typescript").JsonSourceFile} file
 */
 function collectPackageDependencies(context, file) {
    if (!file) return;
    /** @type {Map<string, ts.StringLiteral>} */
    const packageDependencies = new Map();
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
    return packageDependencies;
}

/**
 * @param {string} packagePath 
 */
function collectExportMapEntries(packagePath) {
    // check for multiple exports
    /** @type {[string, string][]} */
    const exportMapEntries = [];

    /**
     * @param {string} exportDir
     * @param {string} relativeDir
     * @param {string} dir
     * @param {number} depth
     */
    const collectEntries = (exportDir, relativeDir, dir, depth) => {
        if (depth >= 2) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.isDirectory()) {
                if (entry.name === "internal" || entry.name === "__tests__") continue;
                collectEntries(
                    `${exportDir}/${entry.name}`,
                    `${relativeDir}/${entry.name}`,
                    path.join(dir, entry.name),
                    depth + 1);
            }
            else if (entry.isFile()) {
                if (!/\.ts$/.test(entry.name)) continue;
                const file = path.basename(entry.name, ".ts") + ".js";
                const exportName = entry.name === "index.ts" ? exportDir : `${exportDir}/${file}`;
                const relativeName = `${relativeDir}/${file}`;
                exportMapEntries.push([exportName, relativeName]);
            }
        }
    }

    const srcPath = path.join(packagePath, "src");
    collectEntries(".", "./dist", srcPath, 0);

    return exportMapEntries;
}

