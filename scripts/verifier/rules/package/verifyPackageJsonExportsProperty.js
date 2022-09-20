// @ts-check
// TODO: Verify the exports map is correct.
// TODO: Verify the imports map is correct.

const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { pickProperty, simplifyExportsMap, createExportsMap, getExportsMapCardinality } = require("../../utils");

/**
 * Verifies the `"exports"` property of `<package>/package.json` exists.
 *
 * @type {import("../../types").PackageVerifierRule}
 */
function verifyPackageJsonExportsProperty(context) {
    const { packageJsonFile, packageJsonObject, baseRelativePackageJsonPath, formatLocation, generatedExportsMap: exportsMap, addWarning } = context;
    if (!packageJsonObject) return;

    const headerProp =
        pickProperty(packageJsonObject, "main") ||
        pickProperty(packageJsonObject, "type") ||
        pickProperty(packageJsonObject, "description") ||
        pickProperty(packageJsonObject, "version") ||
        pickProperty(packageJsonObject, "name");

    const simplified = simplifyExportsMap(exportsMap, "commonjs");

    const exportsProp = pickProperty(packageJsonObject, "exports");
    if (simplified) {
        if (!exportsProp) {
            if (typeof simplified === "string") {
                addWarning({
                    message: `Expected 'package.json' to have an 'exports' property whose value is '${simplified}'`,
                    location: formatLocation(packageJsonFile, packageJsonObject),
                    fixes: headerProp && [{
                        action: "insertProperty",
                        description: `Add missing 'exports' string property to '${baseRelativePackageJsonPath}'`,
                        file: packageJsonFile,
                        afterProperty: headerProp.parent,
                        property: ts.factory.createPropertyAssignment(
                            ts.factory.createStringLiteral("exports"),
                            ts.factory.createStringLiteral(simplified)
                        )
                    }]
                });
            }
            else {
                addWarning({
                    message: "Expected 'package.json' to have an 'exports' map",
                    location: formatLocation(packageJsonFile, packageJsonObject),
                    fixes: headerProp && [{
                        action: "insertProperty",
                        description: `Add missing 'exports' export-map property to '${baseRelativePackageJsonPath}'`,
                        file: packageJsonFile,
                        afterProperty: headerProp.parent,
                        property: ts.factory.createPropertyAssignment(
                            ts.factory.createStringLiteral("exports"),
                            createExportsMap(exportsMap)
                        )
                    }]
                });
            }
        }
        else if (typeof simplified === "string") {
            if (!ts.isStringLiteral(exportsProp) || exportsProp.text !== simplified) {
                addWarning({
                    message: `Expected 'package.json' to have an 'exports' property whose value is '${simplified}'`,
                    location: formatLocation(packageJsonFile, exportsProp),
                    fixes: [{
                        action: "replaceValue",
                        description: `Replace value of 'exports' property in '${baseRelativePackageJsonPath}' with string value`,
                        file: packageJsonFile,
                        oldValue: exportsProp,
                        newValue: ts.factory.createStringLiteral(simplified)
                    }]
                });
            }
        }
        else if (!ts.isObjectLiteralExpression(exportsProp)) {
            // if (!ts.isStringLiteral(exportsProp) || exportsProp.text !== exportMapEntries[0][1]) {
                addWarning({
                    message: "Expected 'package.json' to have an 'exports' property whose value is an export map",
                    location: formatLocation(packageJsonFile, exportsProp),
                    fixes: [{
                        action: "replaceValue",
                        description: `Replace value of 'exports' property in '${baseRelativePackageJsonPath}' with export map`,
                        file: packageJsonFile,
                        oldValue: exportsProp,
                        newValue: createExportsMap(exportsMap)
                    }]
                });
            // }
        }
    }
}
exports.verifyPackageJsonExportsProperty = verifyPackageJsonExportsProperty;
