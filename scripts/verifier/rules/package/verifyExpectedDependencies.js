// @ts-check
const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

/**
 * @type {import("../../types").PackageVerifierRule}
 */
function verifyExpectedDependencies(context) {
    const { packageTsconfigJsonFile, packagePath, packageJsonFile, packageJsonObject, formatLocation, expectedProjects, actualProjects, addWarning } = context;

    for (const [actual, node] of actualProjects) {
        if (!expectedProjects.has(actual)) {
            const nodeLocation = formatLocation(packageTsconfigJsonFile, node);
            const packageRelativeActual = path.relative(packagePath, path.resolve(actual));
            const packageDependencyName = formatDependencyName(context, path.resolve(actual));

            if (!context.dependencies) {
                context.dependencies = ts.factory.createObjectLiteralExpression([], true);
                context.dependenciesFix = {
                    file: packageJsonFile,
                    action: "appendProperty",
                    object: packageJsonObject,
                    property: ts.factory.createPropertyAssignment("dependencies", context.dependencies)
                };
            }

            assert(ts.isObjectLiteralExpression(context.dependencies));

            if (!context.devDependencies) {
                context.devDependencies = ts.factory.createObjectLiteralExpression([], true);
                context.devDependenciesFix = {
                    file: packageJsonFile,
                    action: "appendProperty",
                    object: packageJsonObject,
                    property: ts.factory.createPropertyAssignment("devDependencies", context.devDependencies)
                };
            }

            assert(ts.isObjectLiteralExpression(context.devDependencies));
            assert(ts.isPropertyAssignment(node.parent) && ts.isObjectLiteralExpression(node.parent.parent) && ts.isArrayLiteralExpression(node.parent.parent.parent));

            addWarning({
                message: `Extraneous reference: '${packageRelativeActual}'`,
                location: nodeLocation,
                fixes: [{
                    file: packageTsconfigJsonFile,
                    action: "removeElement",
                    array: node.parent.parent.parent,
                    element: node.parent.parent,
                    description: `Remove extraneous reference '${packageRelativeActual}' from '${context.baseRelativePackageTsconfigJsonPath}'`
                }, {
                    file: packageJsonFile,
                    action: "appendProperty",
                    object: context.dependencies,
                    property: ts.factory.createPropertyAssignment(packageDependencyName, ts.factory.createStringLiteral(getPackageVersion(actual))),
                    antecedent: context.dependenciesFix,
                    description: `Add production dependency '${packageDependencyName}' to '${context.baseRelativePackageJsonPath}'`
                }, {
                    file: packageJsonFile,
                    action: "appendProperty",
                    object: context.devDependencies,
                    property: ts.factory.createPropertyAssignment(packageDependencyName, ts.factory.createStringLiteral(getPackageVersion(actual))),
                    antecedent: context.devDependenciesFix,
                    description: `Add development dependency '${packageDependencyName}' to '${context.baseRelativePackageJsonPath}'`
                }]
            });
        }
    }
}
exports.verifyExpectedDependencies = verifyExpectedDependencies;

/**
 * @param {import("../../types").PackageVerifierContext} context
 * @param {string} dependency
 */
 function formatDependencyName(context, dependency) {
    assert(path.isAbsolute(dependency), "Dependency path must be absolute");
    if (dependency.toLocaleLowerCase().startsWith(context.paths.internalPath)) {
        return `@esfx/internal-${dependency.slice(context.paths.internalPath.length + 1)}`;
    }
    else if (dependency.toLocaleLowerCase().startsWith(context.paths.packagesPath)) {
        return `@esfx/${dependency.slice(context.paths.packagesPath.length + 1)}`;
    }
    else {
        throw new Error(`Unsupported path: ${dependency}`);
    }
}

function getPackageVersion(dependency) {
    try {
        const data = fs.readFileSync(path.resolve(dependency, "package.json"), "utf8");
        const json = JSON.parse(data);
        return typeof json.version === "string" ? `^${json.version}` : "*";
    }
    catch {
        return "*";
    }
}
