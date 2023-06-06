// @ts-check
const { verifyPackageJsonStructure } = require("./verifyPackageJsonStructure");
const { verifyPackageTsconfigJsonStructure } = require("./verifyPackageTsconfigJsonStructure");
const { verifyExpectedReferences } = require("./verifyExpectedReferences");
const { verifyExpectedDependencies } = require("./verifyExpectedDependencies");
const { verifyTslibUsage } = require("./verifyTslibUsage");
const { verifyPackageJsonModuleTypeProperty } = require("./verifyPackageJsonModuleTypeProperty");
const { verifyPackageJsonMainProperty } = require("./verifyPackageJsonMainProperty");
const { verifyPackageJsonExportsProperty } = require("./verifyPackageJsonExportsProperty");
const { verifyPackageJsonTypesProperty } = require("./verifyPackageJsonTypesProperty");
const { verifyPackageJsonTypesVersionsProperty } = require("./verifyPackageJsonTypesVersionsProperty");

/**
 * Verifies a package.
 *
 * @type {import("../../types").PackageVerifierRule}
 */
function verifyPackage(context) {
    return verifyPackageJsonStructure(context) ||
        verifyPackageTsconfigJsonStructure(context) ||
        verifyExpectedReferences(context) ||
        verifyExpectedDependencies(context) ||
        verifyTslibUsage(context) ||
        verifyPackageJsonModuleTypeProperty(context) ||
        verifyPackageJsonMainProperty(context) ||
        verifyPackageJsonExportsProperty(context) ||
        verifyPackageJsonTypesProperty(context) ||
        verifyPackageJsonTypesVersionsProperty(context);
}
exports.verifyPackage = verifyPackage;
