// @ts-check
const ts = require("typescript");
const path = require("path");
const { pickProperty, isDefinedAndNot } = require("../../utils");

/**
 * @type {import("../../types").PackageVerifierRule}
 */
function verifyPackageJsonDependencies(context) {
    const { packageJsonFile, addError, formatLocation } = context;
    const packageJsonObject = packageJsonFile.statements[0].expression;
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
exports.verifyPackageJsonDependencies = verifyPackageJsonDependencies;