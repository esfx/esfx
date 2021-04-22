// @ts-check
const ts = require("typescript");
const path = require("path");
const assert = require("assert");

/**
 * @type {import("../../types").ContainerVerifierRule}
 */
function verifyContainerMissingReferences(context) {
    if (!context.actualContainerProjects) return;
    const { containerTsconfigJsonFile, containerTsconfigObject, expectedContainerProjects, actualContainerProjects, baseRelativeContainerTsconfigJsonPath, addError, formatLocation } = context;
    const referenceLocation = formatLocation(containerTsconfigJsonFile, context.references || containerTsconfigObject);
    for (const [expected, node] of expectedContainerProjects) {
        if (!actualContainerProjects.has(expected)) {
            if (!context.references) {
                context.references = ts.factory.createArrayLiteralExpression([], true);
                context.referencesFix = {
                    file: containerTsconfigJsonFile,
                    action: "appendProperty",
                    object: containerTsconfigObject,
                    property: ts.factory.createPropertyAssignment("references", context.references)
                };
            }

            assert(ts.isArrayLiteralExpression(context.references));

            const relatedLocation = `${path.relative(context.paths.basePath, path.resolve(node.fileName))}:1:1`;
            const baseRelativeExpected = path.relative(context.basePath, path.resolve(expected));
            addError({
                message: `Missing reference: '${baseRelativeExpected}'`,
                location: referenceLocation,
                relatedLocation,
                fixes: [{
                    file: containerTsconfigJsonFile,
                    action: "appendElement",
                    array: context.references,
                    element: ts.factory.createObjectLiteralExpression([ts.factory.createPropertyAssignment("path", ts.factory.createStringLiteral(baseRelativeExpected))], false),
                    antecedent: context.referencesFix,
                    description: `Add missing reference '${baseRelativeExpected}' to '${baseRelativeContainerTsconfigJsonPath}'`
                }]
            });
        }
    }

}
exports.verifyContainerMissingReferences = verifyContainerMissingReferences;