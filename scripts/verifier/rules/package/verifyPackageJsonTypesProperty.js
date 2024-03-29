// @ts-check
const ts = require("typescript");
const { pickProperty, getExportsMapCardinality, pickPropertyMatching } = require("../../utils");

/**
 * Verifies the `"types"` field of `<package>/package.json` is correct.
 *
 * @type {import("../../types").PackageVerifierRule}
 */
function verifyPackageJsonTypesProperty(context) {
    const { packageJsonFile, packageJsonObject, packageTsconfigObject, baseRelativePackageJsonPath, generatedExportsMap, actualExportsMap, formatLocation, addWarning } = context;
    if (!packageJsonObject) return;

    const headerProp =
        pickProperty(packageJsonObject, "exports") ||
        pickProperty(packageJsonObject, "main") ||
        pickProperty(packageJsonObject, "type") ||
        pickProperty(packageJsonObject, "description") ||
        pickProperty(packageJsonObject, "version") ||
        pickProperty(packageJsonObject, "name");

    const exportsMapCardinality = getExportsMapCardinality(actualExportsMap || generatedExportsMap);
    const outDir = pickPropertyMatching(pickProperty(packageTsconfigObject, "compilerOptions"), "outDir", ts.isStringLiteral);
    const declarationDir = pickPropertyMatching(pickProperty(packageTsconfigObject, "compilerOptions"), "declarationDir", ts.isStringLiteral);

    const expectedTypes =
        declarationDir ? "./dist/types/index.d.ts" :
        outDir?.text.endsWith("dist/cjs") ? "./dist/cjs/index.d.ts" :
        outDir?.text.endsWith("dist/esm") ? "./dist/esm/index.d.ts" :
        exportsMapCardinality === "many" ? "index" :
        "./dist/index.d.ts";
    
    const typesProp = pickProperty(packageJsonObject, "types");
    if (!typesProp) {
        if (exportsMapCardinality !== "none") {
            addWarning({
                message: `Expected 'package.json' to have a 'types' property whose value is '${expectedTypes}'`,
                location: formatLocation(packageJsonFile, packageJsonObject),
                fixes: headerProp && [{
                    action: "insertProperty",
                    description: `Add missing 'types' property to '${baseRelativePackageJsonPath}'`,
                    file: packageJsonFile,
                    afterProperty: headerProp.parent,
                    property: ts.factory.createPropertyAssignment(
                        ts.factory.createStringLiteral("types"),
                        ts.factory.createStringLiteral(expectedTypes)
                    )
                }]
            });
        }
    }
    else {
        if (!ts.isStringLiteral(typesProp) || typesProp.text !== expectedTypes) {
            addWarning({
                message: `Expected 'package.json' to have a 'types' property whose value is '${expectedTypes}'${ts.isStringLiteral(typesProp) ? `, got '${typesProp.text}' instead` : ""}`,
                location: formatLocation(packageJsonFile, typesProp),
                fixes: [{
                    action: "replaceValue",
                    description: `Replace value of 'types' property in '${baseRelativePackageJsonPath}'`,
                    file: packageJsonFile,
                    oldValue: typesProp,
                    newValue: ts.factory.createStringLiteral(expectedTypes)
                }]
            });
        }
    }
}
exports.verifyPackageJsonTypesProperty = verifyPackageJsonTypesProperty;
