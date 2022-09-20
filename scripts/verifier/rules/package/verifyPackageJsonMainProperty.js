// @ts-check
const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { pickProperty, pickPropertyMatching } = require("../../utils");

/**
 * Verifies the `"main"` field of `<package>/package.json` is correct.
 *
 * @type {import("../../types").PackageVerifierRule}
 */
function verifyPackageJsonMainProperty(context) {
    const { packageJsonFile, packageJsonObject, packageTsconfigJsonFile, packageTsconfigObject, formatLocation, addError } = context;
    if (!packageJsonObject) return;

    const headerProp =
        pickProperty(packageJsonObject, "type") ||
        pickProperty(packageJsonObject, "description") ||
        pickProperty(packageJsonObject, "version") ||
        pickProperty(packageJsonObject, "name");

    const tsconfigJson = ts.convertToObject(packageTsconfigJsonFile, []);
    const expectedMain = tsconfigJson?.compilerOptions?.outDir?.includes("dist/cjs") ? "./dist/cjs/index.js" :
        "./dist/index.js";

    const mainProp = pickProperty(packageJsonObject, "main");
    if (!mainProp) {
        addError({
            message: `Expected 'package.json' to have a 'main' property whose value is '${expectedMain}'`,
            location: formatLocation(packageJsonFile, packageJsonObject),
            fixes: headerProp && [{
                action: "insertProperty",
                description: `Add missing 'main' property to '${context.baseRelativePackageJsonPath}'`,
                file: packageJsonFile,
                afterProperty: headerProp.parent,
                property: ts.factory.createPropertyAssignment(
                    ts.factory.createStringLiteral("main"),
                    ts.factory.createStringLiteral(expectedMain)
                )
            }]
        });
    }
    else if (!ts.isStringLiteral(mainProp) || mainProp.text !== expectedMain) {
        addError({
            message: `Expected 'package.json' to have a 'main' property whose value is '${expectedMain}'`,
            location: formatLocation(packageJsonFile, mainProp),
            fixes: [{
                action: "replaceValue",
                description: `Replace value of 'main' property in '${context.baseRelativePackageJsonPath}'`,
                file: packageJsonFile,
                oldValue: mainProp,
                newValue: ts.factory.createStringLiteral(expectedMain)
            }]
        });
    }
}
exports.verifyPackageJsonMainProperty = verifyPackageJsonMainProperty;
