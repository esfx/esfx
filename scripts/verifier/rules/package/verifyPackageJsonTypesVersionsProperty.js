// @ts-check
const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { pickProperty } = require("../../utils");

/**
 * @type {import("../../types").PackageVerifierRule}
 */
function verifyPackageJsonTypesVersionsProperty(context) {
    if (context.basePath === context.paths.internalPath) return "continue";
    const { packageJsonFile, packageJsonObject, baseRelativePackageJsonPath, formatLocation, exportMapEntries, addWarning } = context;
    const headerProp =
        pickProperty(packageJsonObject, "types") ||
        pickProperty(packageJsonObject, "exports") ||
        pickProperty(packageJsonObject, "main") ||
        pickProperty(packageJsonObject, "type") ||
        pickProperty(packageJsonObject, "description") ||
        pickProperty(packageJsonObject, "version") ||
        pickProperty(packageJsonObject, "name");
    const typesVersionsProp = pickProperty(packageJsonObject, "typesVersions");

    if (exportMapEntries.length > 1 && !typesVersionsProp) {
        addWarning({
            message: "Expected 'package.json' to have a 'typesVersions' property whose value is a version map to support an exports map",
            location: formatLocation(packageJsonFile, packageJsonObject),
            fixes: [{
                action: "insertProperty",
                description: `Add missing 'typesVersions' property to '${baseRelativePackageJsonPath}'`,
                file: packageJsonFile,
                afterProperty: headerProp.parent,
                property: ts.factory.createPropertyAssignment(
                    ts.factory.createStringLiteral("typesVersions"),
                    createTypesVersions(exportMapEntries)
                )
            }]
        });
    }
}
exports.verifyPackageJsonTypesVersionsProperty = verifyPackageJsonTypesVersionsProperty;

/**
 * @param {[string, string][]} exportMapEntries
 */
 function createTypesVersions(exportMapEntries) {
    exportMapEntries = exportMapEntries.slice();
    exportMapEntries.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? +1 : a[1] < b[1] ? 0 : a[1] > b[1] ? +1 : 0);
    const node =
        ts.factory.createObjectLiteralExpression([
            ts.factory.createPropertyAssignment(
                ts.factory.createStringLiteral("*"),
                    ts.factory.createObjectLiteralExpression(
                        exportMapEntries.flatMap(([key, value]) => [
                            ts.factory.createPropertyAssignment(
                                ts.factory.createStringLiteral(mapKey(key).replace(/\.js$/, "")),
                                ts.factory.createArrayLiteralExpression([ts.factory.createStringLiteral(mapValue(value))])
                            ),
                            ts.factory.createPropertyAssignment(
                                ts.factory.createStringLiteral(mapKey(key)),
                                ts.factory.createArrayLiteralExpression([ts.factory.createStringLiteral(mapValue(value))])
                            ),
                        ]),
                        true
                    )
                )
            ], true);
    return node;

    function mapKey(key) {
        return key === "." ? "index.js" : key.replace(/^\.\//, "");
    }

    function mapValue(value) {
        return value.replace(/\.js$/, ".d.ts");
    }
}