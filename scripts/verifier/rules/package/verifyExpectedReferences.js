// @ts-check
const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

/**
 * @type {import("../../types").PackageVerifierRule}
 */
function verifyExpectedReferences(context) {
    const { packageTsconfigJsonFile, packageTsconfigObject, packageJsonFile, packagePath, expectedProjects, actualProjects, addError, formatLocation } = context;
    const referenceLocation = formatLocation(packageTsconfigJsonFile, context.references || packageTsconfigObject);
    for (const [expected, node] of expectedProjects) {
        if (!actualProjects.has(expected) && fs.existsSync(path.join(expected, "tsconfig.json"))) {
            const relatedLocation = formatLocation(packageJsonFile, node);
            const packageRelativeExpected = path.relative(packagePath, path.resolve(expected));

            if (!context.references) {
                context.references = ts.factory.createArrayLiteralExpression([], true);
                context.referencesFix = {
                    file: packageTsconfigJsonFile,
                    action: "appendProperty",
                    object: packageTsconfigObject,
                    property: ts.factory.createPropertyAssignment(ts.factory.createStringLiteral("references"), context.references)
                };
            }

            assert(ts.isArrayLiteralExpression(context.references));
            assert(ts.isPropertyAssignment(node.parent));

            addError({
                message: `Missing reference: '${packageRelativeExpected}'`,
                location: referenceLocation,
                relatedLocation,
                fixes: [{
                    file: packageTsconfigJsonFile,
                    action: "appendElement",
                    array: context.references,
                    element: ts.factory.createObjectLiteralExpression([ts.factory.createPropertyAssignment(ts.factory.createStringLiteral("path"), ts.factory.createStringLiteral(packageRelativeExpected))], false),
                    antecedent: context.referencesFix,
                    description: `Add missing reference '${packageRelativeExpected}' to '${context.baseRelativePackageTsconfigJsonPath}'`
                }, {
                    file: packageJsonFile,
                    action: "removeProperty",
                    object: node.parent.parent,
                    property: node.parent,
                    description: `Remove dependency '${node.text}' from '${context.baseRelativePackageJsonPath}'`
                }]
            });
        }
    }
}
exports.verifyExpectedReferences = verifyExpectedReferences;
