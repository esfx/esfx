// @ts-check
const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { pickProperty } = require("../../utils");

/**
 * @type {import("../../types").PackageVerifierRule}
 */
function verifyPackageJsonModuleTypeProperty(context) {
    if (context.basePath === context.paths.internalPath) return;
    const { packageJsonFile, packageJsonObject, formatLocation, addError } = context;
    const headerProp =
        pickProperty(packageJsonObject, "description") ||
        pickProperty(packageJsonObject, "version") ||
        pickProperty(packageJsonObject, "name");
    const typeProp = pickProperty(packageJsonObject, "type");
    if (!typeProp) {
        addError({
            message: "Expected 'package.json' to have a 'type' property whose value is 'commonjs'",
            location: formatLocation(packageJsonFile, packageJsonObject),
            fixes: [{
                action: "insertProperty",
                description: `Add missing 'type' property to '${context.baseRelativePackageJsonPath}'`,
                file: packageJsonFile,
                afterProperty: headerProp.parent,
                property: ts.factory.createPropertyAssignment(
                    ts.factory.createStringLiteral("type"),
                    ts.factory.createStringLiteral("commonjs"))
            }]
        });
    }
    else if (!ts.isStringLiteral(typeProp) || typeProp.text !== "commonjs") {
        addError({
            message: "Expected 'package.json' to have a 'type' property whose value is 'commonjs'",
            location: formatLocation(packageJsonFile, typeProp),
            fixes: [{
                action: "replaceValue",
                description: `Replace value of 'type' property in '${context.baseRelativePackageJsonPath}'`,
                file: packageJsonFile,
                oldValue: headerProp,
                newValue: ts.factory.createStringLiteral("commonjs")
            }]
        });
    }
}
exports.verifyPackageJsonModuleTypeProperty = verifyPackageJsonModuleTypeProperty;
