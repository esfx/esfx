// @ts-check
const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { pickProperty } = require("../../utils");

/**
 * @type {import("../../types").PackageVerifierRule}
 */
function verifyPackageJsonMainProperty(context) {
    if (context.basePath === context.paths.internalPath) return;
    const { packageJsonFile, packageJsonObject, formatLocation, addError } = context;
    const headerProp =
        pickProperty(packageJsonObject, "type") ||
        pickProperty(packageJsonObject, "description") ||
        pickProperty(packageJsonObject, "version") ||
        pickProperty(packageJsonObject, "name");

    const mainProp = pickProperty(packageJsonObject, "main");
    if (!mainProp) {
        addError({
            message: "Expected 'package.json' to have a 'main' property whose value is './dist/index.js'",
            location: formatLocation(packageJsonFile, packageJsonObject),
            fixes: [{
                action: "insertProperty",
                description: `Add missing 'main' property to '${context.baseRelativePackageJsonPath}'`,
                file: packageJsonFile,
                afterProperty: headerProp.parent,
                property: ts.factory.createPropertyAssignment(
                    ts.factory.createStringLiteral("main"),
                    ts.factory.createStringLiteral("./dist/index.js")
                )
            }]
        });
    }
    else if (!ts.isStringLiteral(mainProp) || mainProp.text !== "./dist/index.js") {
        addError({
            message: "Expected 'package.json' to have a 'main' property whose value is './dist/index.js'",
            location: formatLocation(packageJsonFile, mainProp),
            fixes: [{
                action: "replaceValue",
                description: `Replace value of 'main' property in '${context.baseRelativePackageJsonPath}'`,
                file: packageJsonFile,
                oldValue: mainProp,
                newValue: ts.factory.createStringLiteral("./dist/index.js")
            }]
        });
    }
}
exports.verifyPackageJsonMainProperty = verifyPackageJsonMainProperty;
