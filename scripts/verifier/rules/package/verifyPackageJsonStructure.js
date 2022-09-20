// @ts-check
const ts = require("typescript");
const { pickProperty, isDefinedAndNot } = require("../../utils");

/**
 * Verifies the structure of `<package>/package.json`.
 *
 * @type {import("../../types").PackageVerifierRule}
 */
function verifyPackageJsonStructure(context) {
    const { packageJsonFile, addError, formatLocation } = context;
    const packageJsonObject = packageJsonFile.statements[0].expression;

    // TODO: verify `name`, `description`, `version`, etc.

    if (!ts.isObjectLiteralExpression(packageJsonObject)) {
        addError({
            message: `Invalid package file: Expected an object.`,
            location: formatLocation(packageJsonFile, packageJsonObject)
        });
        return "continue";
    }
    context.packageJsonObject = packageJsonObject;

    const dependencies = pickProperty(packageJsonObject, "dependencies");
    if (isDefinedAndNot(dependencies, ts.isObjectLiteralExpression)) {
        addError({
            message: `Invalid package file: Expected 'dependencies' property to be an object.`,
            location: formatLocation(packageJsonFile, dependencies)
        });
        return "continue";
    }
    context.dependencies = dependencies;

    const devDependencies = pickProperty(packageJsonObject, "devDependencies");
    if (isDefinedAndNot(devDependencies, ts.isObjectLiteralExpression)) {
        addError({
            message: `Invalid package file: Expected 'devDependencies' property to be an object.`,
            location: formatLocation(packageJsonFile, devDependencies)
        });
        return "continue";
    }
    context.devDependencies = devDependencies;
}
exports.verifyPackageJsonStructure = verifyPackageJsonStructure;