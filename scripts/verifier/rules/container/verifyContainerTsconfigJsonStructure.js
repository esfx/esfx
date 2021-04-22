// @ts-check
const ts = require("typescript");
const { pickProperty, isDefinedAndNot } = require("../../utils");

/**
 * @type {import("../../types").ContainerVerifierRule}
 */
function verifyContainerTsconfigJsonStructure(context) {
    const { containerTsconfigJsonFile, addError, formatLocation } = context;
    const containerTsconfigObject = containerTsconfigJsonFile.statements[0].expression;
    if (!ts.isObjectLiteralExpression(containerTsconfigObject)) {
        addError({
            message: `Invalid configuration file: Expected an object.`,
            location: formatLocation(containerTsconfigJsonFile, containerTsconfigObject)
        });
        return "continue";
    }
    context.containerTsconfigObject = containerTsconfigObject;

    const references = pickProperty(containerTsconfigObject, "references");
    if (isDefinedAndNot(references, ts.isArrayLiteralExpression)) {
        addError({
            message: `Invalid configuration file. Expected 'references' property to be an array.`,
            location: formatLocation(containerTsconfigJsonFile, references)
        });
        return "continue";
    }
    context.references = references;
}
exports.verifyContainerTsconfigJsonStructure = verifyContainerTsconfigJsonStructure;