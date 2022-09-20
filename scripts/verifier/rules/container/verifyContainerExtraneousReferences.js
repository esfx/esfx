// @ts-check
const ts = require("typescript");
const path = require("path");
const assert = require("assert");

/**
 * Verifies that `<container>/tsconfig.json` does not contain project references to non-existent packages.
 *
 * @type {import("../../types").ContainerVerifierRule}
 */
function verifyContainerExtraneousReferences(context) {
    const { containerTsconfigJsonFile, basePath: base, expectedContainerProjects, actualContainerProjects, baseRelativeContainerTsconfigJsonPath, addWarning, formatLocation } = context;
    if (!actualContainerProjects || !containerTsconfigJsonFile) return;

    for (const [actual, node] of actualContainerProjects) {
        if (!expectedContainerProjects.has(actual)) {
            const nodeLocation = formatLocation(containerTsconfigJsonFile, node);
            const baseRelativeActual = path.relative(base, path.resolve(actual));

            assert(ts.isPropertyAssignment(node.parent) && ts.isObjectLiteralExpression(node.parent.parent) && ts.isArrayLiteralExpression(node.parent.parent.parent));

            addWarning({
                message: `Extraneous reference: '${baseRelativeActual}'`,
                location: nodeLocation,
                fixes: [{
                    file: containerTsconfigJsonFile,
                    action: "removeElement",
                    array: node.parent.parent.parent,
                    element: node.parent.parent,
                    description: `Remove extraneous reference to '${baseRelativeActual}' from '${baseRelativeContainerTsconfigJsonPath}'`
                }]
            });
        }
    }
}
exports.verifyContainerExtraneousReferences = verifyContainerExtraneousReferences;