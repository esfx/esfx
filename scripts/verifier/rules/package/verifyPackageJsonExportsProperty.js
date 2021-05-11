// @ts-check
const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { pickProperty } = require("../../utils");

/**
 * @type {import("../../types").PackageVerifierRule}
 */
function verifyPackageJsonExportsProperty(context) {
    // if (context.basePath === context.paths.internalPath) return;
    const { packageJsonFile, packageJsonObject, baseRelativePackageJsonPath, formatLocation, exportMapEntries, addWarning } = context;
    const headerProp =
        pickProperty(packageJsonObject, "main") ||
        pickProperty(packageJsonObject, "type") ||
        pickProperty(packageJsonObject, "description") ||
        pickProperty(packageJsonObject, "version") ||
        pickProperty(packageJsonObject, "name");

    const exportsProp = pickProperty(packageJsonObject, "exports");
    if (exportMapEntries.length > 0) {
        if (!exportsProp) {
            if (exportMapEntries.length === 1) {
                addWarning({
                    message: `Expected 'package.json' to have an 'exports' property whose value is '${exportMapEntries[0][1]}'`,
                    location: formatLocation(packageJsonFile, packageJsonObject),
                    fixes: [{
                        action: "insertProperty",
                        description: `Add missing 'exports' string property to '${baseRelativePackageJsonPath}'`,
                        file: packageJsonFile,
                        afterProperty: headerProp.parent,
                        property: ts.factory.createPropertyAssignment(
                            ts.factory.createStringLiteral("exports"),
                            ts.factory.createStringLiteral(exportMapEntries[0][1])
                        )
                    }]
                });
            }
            else {
                addWarning({
                    message: "Expected 'package.json' to have an 'exports' map",
                    location: formatLocation(packageJsonFile, packageJsonObject),
                    fixes: [{
                        action: "insertProperty",
                        description: `Add missing 'exports' export-map property to '${baseRelativePackageJsonPath}'`,
                        file: packageJsonFile,
                        afterProperty: headerProp.parent,
                        property: ts.factory.createPropertyAssignment(
                            ts.factory.createStringLiteral("exports"),
                            createExportsMap(exportMapEntries)
                        )
                    }]
                });
            }
        }
        else if (exportMapEntries.length === 1) {
            if (!ts.isStringLiteral(exportsProp) || exportsProp.text !== exportMapEntries[0][1]) {
                addWarning({
                    message: `Expected 'package.json' to have an 'exports' property whose value is '${exportMapEntries[0][1]}'`,
                    location: formatLocation(packageJsonFile, exportsProp),
                    fixes: [{
                        action: "replaceValue",
                        description: `Replace value of 'exports' property in '${baseRelativePackageJsonPath}' with string value`,
                        file: packageJsonFile,
                        oldValue: exportsProp,
                        newValue: ts.factory.createStringLiteral(exportMapEntries[0][1])
                    }]
                });
            }
        }
        else if (!ts.isObjectLiteralExpression(exportsProp)) {
            if (!ts.isStringLiteral(exportsProp) || exportsProp.text !== exportMapEntries[0][1]) {
                addWarning({
                    message: "Expected 'package.json' to have an 'exports' property whose value is an export map",
                    location: formatLocation(packageJsonFile, exportsProp),
                    fixes: [{
                        action: "replaceValue",
                        description: `Replace value of 'exports' property in '${baseRelativePackageJsonPath}' with export map`,
                        file: packageJsonFile,
                        oldValue: exportsProp,
                        newValue: createExportsMap(exportMapEntries)
                    }]
                });
            }
        }
    }
}
exports.verifyPackageJsonExportsProperty = verifyPackageJsonExportsProperty;

/**
 * @param {[string, string][]} exportMapEntries
 */
 function createExportsMap(exportMapEntries) {
    exportMapEntries = exportMapEntries.slice();
    exportMapEntries.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? +1 : a[1] < b[1] ? 0 : a[1] > b[1] ? +1 : 0);
    const node = ts.factory.createObjectLiteralExpression(
        exportMapEntries.flatMap(([key, value]) => {
            /** @type {ts.PropertyAssignment[]} */
            const properties = [];
            const keys = [];
            if (key === ".") {
                keys.push(key, "./index", "./index.js");
            }
            else if (key.replace(/\.js$/, "") !== key) {
                keys.push(key.replace(/\.js$/, ""));
                keys.push(key);
            }
            else {
                keys.push(key);
            }
            for (const key of keys) {
                properties.push(ts.setEmitFlags(
                    ts.factory.createPropertyAssignment(
                        ts.factory.createStringLiteral(key),
                        ts.factory.createStringLiteral(value)
                    ),
                    ts.EmitFlags.Indented
                ));
            }
            return properties;
        }),
        true);
    ts.setEmitFlags(node, ts.EmitFlags.Indented);
    return node;
}