// @ts-check

const { verifyContainerExtraneousReferences } = require("./verifyContainerExtraneousReferences");
const { verifyContainerMissingReferences } = require("./verifyContainerMissingReferences");
const { verifyContainerPackages } = require("./verifyContainerPackages");
const { verifyContainerTsconfigJsonStructure } = require("./verifyContainerTsconfigJsonStructure");

/**
 * @type {import("../../types").ContainerVerifierRule}
 */
function verifyContainer(context) {
    return verifyContainerTsconfigJsonStructure(context) ||
        verifyContainerPackages(context) ||
        verifyContainerMissingReferences(context) ||
        verifyContainerExtraneousReferences(context);

}
exports.verifyContainer = verifyContainer;
