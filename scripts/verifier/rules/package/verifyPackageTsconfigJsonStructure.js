// @ts-check
const ts = require("typescript");
const path = require("path");
const { pickProperty, isDefinedAndNot } = require("../../utils");

/**
 * @type {import("../../types").PackageVerifierRule}
 */
function verifyPackageTsconfigJsonStructure(context) {
    const { packagePath, packageTsconfigJsonFile, addError, formatLocation } = context;
    const packageTsconfigObject = packageTsconfigJsonFile.statements[0].expression;
    if (!ts.isObjectLiteralExpression(packageTsconfigObject)) {
        addError({
            message: `Invalid configuration file: Expected an object.`,
            location: formatLocation(packageTsconfigJsonFile, packageTsconfigObject)
        });
        return "continue";
    }
    context.packageTsconfigObject = packageTsconfigObject;

    const references = pickProperty(packageTsconfigObject, "references");
    if (isDefinedAndNot(references, ts.isArrayLiteralExpression)) {
        addError({
            message: `Invalid configuration file. Expected 'references' property to be an array.`,
            location: formatLocation(packageTsconfigJsonFile, references)
        });
        return "continue";
    }
    context.references = references;
    context.expectedContainerProjects.set(packagePath, packageTsconfigJsonFile);
}
exports.verifyPackageTsconfigJsonStructure = verifyPackageTsconfigJsonStructure;