// @ts-check

/**
 * @typedef {import("typescript").PropertyAssignment & { readonly parent: JsonObjectLiteralExpression; readonly name: import("typescript").StringLiteral; readonly initializer: PropertyAssignmentInitializer }} JsonPropertyAssignment
 * @typedef {import("typescript").ObjectLiteralExpression & { readonly properties: import("typescript").NodeArray<JsonPropertyAssignment> }} JsonObjectLiteralExpression
 * @typedef {import("typescript").JsonObjectExpression & { readonly parent: JsonPropertyAssignment }} PropertyAssignmentInitializer
 * @typedef {import("typescript").ArrayLiteralExpression & { readonly elements: import("typescript").NodeArray<import("typescript").JsonObjectExpression>} } JsonArrayLiteralExpression
 */

/**
 * @typedef Diagnostic
 * @property {string} message
 * @property {string} [location]
 * @property {string} [relatedLocation]
 * @property {import("./codeFix").CodeFix[]} [fixes]
 * @property {boolean} [fixed]
 */

/**
 * @typedef PackageVerifierContext
 * @property {{ basePath, internalPath, packagesPath }} paths
 * @property {string} basePath
 * @property {string} packageName
 * @property {string} packagePath
 * @property {string} baseRelativePackageJsonPath
 * @property {string} [baseRelativePackageLockJsonPath]
 * @property {string} baseRelativePackageTsconfigJsonPath
 * @property {Map<string, import("typescript").JsonSourceFile>} expectedContainerProjects
 * @property {import("typescript").JsonSourceFile} packageJsonFile
 * @property {import("typescript").ObjectLiteralExpression} [packageJsonObject]
 * @property {import("typescript").JsonSourceFile} [packageLockJsonFile]
 * @property {import("typescript").ObjectLiteralExpression} [packageLockJsonObject]
 * @property {import("./codeFix").AppendPropertyCodeFix} [dependenciesFix]
 * @property {import("typescript").ObjectLiteralExpression} [dependencies]
 * @property {import("./codeFix").AppendPropertyCodeFix} [devDependenciesFix]
 * @property {import("typescript").ObjectLiteralExpression} [devDependencies]
 * @property {import("typescript").JsonSourceFile} packageTsconfigJsonFile
 * @property {import("typescript").ObjectLiteralExpression} [packageTsconfigObject]
 * @property {import("./codeFix").AppendPropertyCodeFix} [referencesFix]
 * @property {import("typescript").ArrayLiteralExpression} [references]
 * @property {Map<string, import("typescript").StringLiteral>} expectedProjects
 * @property {Map<string, import("typescript").StringLiteral>} actualProjects
 * @property {import("../resolver/types").PackageJsonExports} generatedExportsMap
 * @property {import("../resolver/types").PackageJsonExports} [actualExportsMap]
 * @property {(diagnostic: Diagnostic) => void} addError
 * @property {(diagnostic: Diagnostic) => void} addWarning
 * @property {(sourceFile: import("typescript").SourceFile, location: import("typescript").TextRange) => string} formatLocation
 */

/**
 * @typedef {(context: PackageVerifierContext) => "continue" | "break" | void} PackageVerifierRule
 */

/**
 * @typedef ContainerVerifierContext
 * @property {{ basePath, internalPath, packagesPath }} paths
 * @property {string} basePath
 * @property {string} baseRelativeContainerTsconfigJsonPath
 * @property {Map<string, import("typescript").JsonSourceFile>} knownFiles
 * @property {Map<string, import("typescript").JsonSourceFile>} expectedContainerProjects
 * @property {Map<string, import("typescript").StringLiteral>?} actualContainerProjects
 * @property {import("typescript").JsonSourceFile} containerTsconfigJsonFile
 * @property {import("typescript").ObjectLiteralExpression} [containerTsconfigObject]
 * @property {import("./codeFix").AppendPropertyCodeFix} [referencesFix]
 * @property {import("typescript").ArrayLiteralExpression} [references]
 * @property {(file: import("typescript").JsonSourceFile) => Map<string, import("typescript").StringLiteral>} collectProjectReferences
 * @property {(diagnostic: Diagnostic) => void} addError
 * @property {(diagnostic: Diagnostic) => void} addWarning
 * @property {(sourceFile: import("typescript").SourceFile, location: import("typescript").TextRange) => string} formatLocation
 */

/**
 * @typedef {(context: ContainerVerifierContext) => "continue" | "break" | void} ContainerVerifierRule
 */

module.exports = {};
