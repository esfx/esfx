// @ts-check
const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { pickProperty } = require("../../utils");

/**
 * @type {import("../../types").PackageVerifierRule}
 */
function verifyPackageJsonTypesProperty(context) {
    // if (context.basePath === context.paths.internalPath) return;
    const { packageJsonFile, packageJsonObject, baseRelativePackageJsonPath, formatLocation, exportMapEntries, addWarning } = context;
    const headerProp =
        pickProperty(packageJsonObject, "exports") ||
        pickProperty(packageJsonObject, "main") ||
        pickProperty(packageJsonObject, "type") ||
        pickProperty(packageJsonObject, "description") ||
        pickProperty(packageJsonObject, "version") ||
        pickProperty(packageJsonObject, "name");

    const typesProp = pickProperty(packageJsonObject, "types");
    if (!typesProp) {
        if (exportMapEntries.length === 1) {
            addWarning({
                message: "Expected 'package.json' to have a 'types' property whose value is './dist/index.d.ts'",
                location: formatLocation(packageJsonFile, packageJsonObject),
                fixes: [{
                    action: "insertProperty",
                    description: `Add missing 'types' property to '${baseRelativePackageJsonPath}'`,
                    file: packageJsonFile,
                    afterProperty: headerProp.parent,
                    property: ts.factory.createPropertyAssignment(
                        ts.factory.createStringLiteral("types"),
                        ts.factory.createStringLiteral("./dist/index.d.ts")
                    )
                }]
            });
        }
        else if (exportMapEntries.length > 1) {
            addWarning({
                message: "Expected 'package.json' to have a 'types' property whose value is 'index.d.ts'",
                location: formatLocation(packageJsonFile, packageJsonObject),
                fixes: [{
                    action: "insertProperty",
                    description: `Add missing 'types' property to '${baseRelativePackageJsonPath}'`,
                    file: packageJsonFile,
                    afterProperty: headerProp.parent,
                    property: ts.factory.createPropertyAssignment(
                        ts.factory.createStringLiteral("types"),
                        ts.factory.createStringLiteral("index")
                    )
                }]
            });
        }
    }
    else {
        const expected = exportMapEntries.length > 1 ? "index" : "./dist/index.d.ts";
        if (!ts.isStringLiteral(typesProp) || typesProp.text !== expected) {
            addWarning({
                message: `Expected 'package.json' to have a 'types' property whose value is '${expected}'`,
                location: formatLocation(packageJsonFile, typesProp),
                fixes: [{
                    action: "replaceValue",
                    description: `Replace value of 'types' property in '${baseRelativePackageJsonPath}'`,
                    file: packageJsonFile,
                    oldValue: typesProp,
                    newValue: ts.factory.createStringLiteral(expected)
                }]
            });
        }
    }
}
exports.verifyPackageJsonTypesProperty = verifyPackageJsonTypesProperty;
