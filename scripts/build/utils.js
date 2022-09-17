/*!
   Copyright 2022 Ron Buckton

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

// @ts-check
const ts = require("typescript");

/**
 * @param {ts.Identifier} node
 */
function isExpressionIdentifier(node) {
    const parent = node.parent;
    if (!parent) throw new TypeError("This function is only valid for bound nodes.");
    return ts.isPropertyAccessExpression(parent) ? parent.expression === node :
        ts.isArrowFunction(parent) ? parent.body === node :
        (
            ts.isVariableDeclaration(parent) ||
            ts.isParameter(parent) ||
            ts.isPropertyDeclaration(parent) ||
            ts.isPropertyAssignment(parent) ||
            ts.isBindingElement(parent)
        ) ? parent.initializer === node :
        (
            ts.isIfStatement(parent) ||
            ts.isDoStatement(parent) ||
            ts.isWhileStatement(parent) ||
            ts.isSwitchStatement(parent) ||
            ts.isCaseClause(parent) ||
            ts.isForInStatement(parent) ||
            ts.isForOfStatement(parent) ||
            ts.isReturnStatement(parent) ||
            ts.isThrowStatement(parent)
        ) ? parent.expression === node :
        ts.isExportAssignment(parent) ? parent.expression === node :
        ts.isComputedPropertyName(parent) ||
        ts.isArrayLiteralExpression(parent) ||
        ts.isElementAccessExpression(parent) ||
        ts.isCallExpression(parent) ||
        ts.isNewExpression(parent) ||
        ts.isTaggedTemplateExpression(parent) ||
        ts.isParenthesizedExpression(parent) ||
        ts.isDeleteExpression(parent) ||
        ts.isTypeOfExpression(parent) ||
        ts.isVoidExpression(parent) ||
        ts.isAwaitExpression(parent) ||
        ts.isPrefixUnaryExpression(parent) ||
        ts.isPostfixUnaryExpression(parent) ||
        ts.isBinaryExpression(parent) ||
        ts.isConditionalExpression(parent) ||
        ts.isYieldExpression(parent) ||
        ts.isSpreadElement(parent) ||
        ts.isSpreadAssignment(parent) ||
        ts.isTemplateSpan(parent) ||
        ts.isExpressionWithTypeArguments(parent) ||
        ts.isExpressionStatement(parent) ||
        ts.isShorthandPropertyAssignment(parent);
}

exports.isExpressionIdentifier = isExpressionIdentifier;

/** @typedef {ts.CallExpression & { readonly expression: ts.Identifier, readonly arguments: ts.NodeArray<ts.Expression> & readonly [ts.StringLiteral] }} StaticRequireCall */
/** @typedef {ts.VariableStatement & { readonly declarationList: ts.VariableDeclarationList & { readonly declarations: ts.NodeArray<ts.VariableDeclaration> & readonly [ts.VariableDeclaration & { readonly initializer: StaticRequireCall }] } }} CommonJSImportStatement */
/** @typedef {ts.ImportDeclaration & { readonly importClause: ts.ImportClause, readonly moduleSpecifier: ts.StringLiteral } } ImportDeclarationWithBindings */

/**
 * @param {ts.Node} node
 * @returns {node is ImportDeclarationWithBindings}
 */
function isImportDeclarationWithBindings(node) {
    return ts.isImportDeclaration(node) && !!node.importClause &&
        ts.isStringLiteral(node.moduleSpecifier);
}
exports.isImportDeclarationWithBindings = isImportDeclarationWithBindings;

/**
 * @param {ts.Node} node
 * @returns {node is StaticRequireCall}
 */
function isStaticRequireCall(node) {
    return ts.isCallExpression(node) && node.arguments.length === 1 &&
        ts.isIdentifier(node.expression) && ts.idText(node.expression) === "require" &&
        ts.isStringLiteral(node.arguments[0]);
}
exports.isStaticRequireCall = isStaticRequireCall;

/**
 * @param {ts.Node} node
 * @returns {node is CommonJSImportStatement}
 */
function isCommonJSImportStatement(node) {
    return ts.isVariableStatement(node) && node.declarationList.declarations.length === 1 &&
        !!node.declarationList.declarations[0].initializer &&
        isStaticRequireCall(node.declarationList.declarations[0].initializer);
}
exports.isCommonJSImportStatement = isCommonJSImportStatement;

/**
 * Gets the module specifier string of an import-like statement.
 * @param {ImportDeclarationWithBindings | CommonJSImportStatement} node
 */
function getEffectiveModuleSpecifierOfImportDeclarationLike(node) {
    return ts.isImportDeclaration(node) ?
        node.moduleSpecifier.text :
        node.declarationList.declarations[0].initializer.arguments[0].text;
}
exports.getEffectiveModuleSpecifierOfImportDeclarationLike = getEffectiveModuleSpecifierOfImportDeclarationLike;

/**
 * Gets the module specifier string of an import-like statement.
 * @param {ImportDeclarationWithBindings | CommonJSImportStatement} node
 */
function getEffectiveDefaultImportOfImportDeclarationLike(node) {
    return ts.isImportDeclaration(node) ? node.importClause.name : undefined;
}
exports.getEffectiveDefaultImportOfImportDeclarationLike = getEffectiveDefaultImportOfImportDeclarationLike;

/**
 * Gets the module specifier string of an import-like statement.
 * @param {ImportDeclarationWithBindings | CommonJSImportStatement} node
 */
function getEffectiveNamespaceImportOfImportDeclarationLike(node) {
    return ts.isImportDeclaration(node) ?
        node.importClause.namedBindings && ts.isNamespaceImport(node.importClause.namedBindings) ?
            node.importClause.namedBindings.name :
            undefined :
        ts.isIdentifier(node.declarationList.declarations[0].name) ?
            node.declarationList.declarations[0].name :
            undefined;
}
exports.getEffectiveNamespaceImportOfImportDeclarationLike = getEffectiveNamespaceImportOfImportDeclarationLike;

/**
 * Gets the module specifier string of an import-like statement.
 * @param {ImportDeclarationWithBindings | CommonJSImportStatement} node
 */
function getEffectiveNamedImportsOfImportDeclarationLike(node) {
    return ts.isImportDeclaration(node) ?
        node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings) ?
            node.importClause.namedBindings :
            undefined :
        ts.isObjectBindingPattern(node.declarationList.declarations[0].name) ?
            node.declarationList.declarations[0].name :
            undefined;
}
exports.getEffectiveNamedImportsOfImportDeclarationLike = getEffectiveNamedImportsOfImportDeclarationLike;

/**
 * @param {ts.Symbol} symbol
 */
function tryGetImportDeclarationLikeOfSymbol(symbol) {
    /** @type {ts.Node | undefined} */
    let node = symbol.valueDeclaration ?? symbol.declarations?.[0];
    if (!node) return;
    if (ts.isImportSpecifier(node)) node = node.parent.parent.parent;
    if (ts.isNamedImports(node)) node = node.parent.parent;
    if (ts.isNamespaceImport(node)) node = node.parent.parent;
    if (ts.isImportClause(node)) node = node.parent;
    if (ts.isImportDeclaration(node)) return isImportDeclarationWithBindings(node) ? node : undefined;
    if (ts.isVariableDeclaration(node)) node = node.parent.parent;
    if (isCommonJSImportStatement(node)) return node;
}
exports.tryGetImportDeclarationLikeOfSymbol = tryGetImportDeclarationLikeOfSymbol;

/**
 * @param {ts.Expression} node
 */
function isPotentiallyInlinableCallee(node, allowParenthesizedExpression = true) {
    return ts.isPropertyAccessExpression(node) ?
            ts.isIdentifier(node.expression) &&
            ts.isIdentifier(node.name) :
        ts.isElementAccessExpression(node) ?
            ts.isIdentifier(node.expression) &&
            ts.isStringLiteral(node.argumentExpression) :
        allowParenthesizedExpression && ts.isParenthesizedExpression(node) ?
            ts.isBinaryExpression(node.expression) &&
            node.expression.operatorToken.kind === ts.SyntaxKind.CommaToken &&
            (ts.isNumericLiteral(node.expression.left) || ts.isVoidExpression(node.expression.left) && ts.isNumericLiteral(node.expression.left.expression)) &&
            isPotentiallyInlinableCallee(node.expression.right, /*allowParenthesizedExpression*/ false) :
        ts.isIdentifier(node);
}
exports.isPotentiallyInlinableCallee = isPotentiallyInlinableCallee;

/**
 * @template {ts.Declaration} T
 * @param {ts.Symbol} symbol
 * @param {T["kind"]} kind
 * @returns {T | undefined}
 */
function getDeclarationOfKind(symbol, kind) {
    return /** @type {T | undefined} */(symbol.declarations?.find(decl => decl.kind === kind));
}
exports.getDeclarationOfKind = getDeclarationOfKind;

/**
 * @param {ts.SourceFile} sourceFile
 */
function isExternalOrCommonJsModule(sourceFile) {
    // @ts-ignore
    return ts.isExternalModule(sourceFile) || !!sourceFile.commonJsModuleIndicator;
}
exports.isExternalOrCommonJsModule = isExternalOrCommonJsModule;

/**
 * @param {ts.SourceFile} sourceFile
 * @param {ts.TypeChecker} checker
 * @returns {ts.Symbol | undefined}
 */
function getModuleSymbol(sourceFile, checker) {
    if (isExternalOrCommonJsModule(sourceFile)) {
        // @ts-ignore
        return sourceFile.symbol && checker.getMergedSymbol(sourceFile.symbol);
    }
}
exports.getModuleSymbol = getModuleSymbol;

/**
 * @template {ts.Node} T
 * @param {T} node
 * @param {ts.TransformationContext} context
 */
function cloneNode(node, context) {
    const { factory } = context;
    return ts.visitNode(node, function visitor(n) {
        // ensure we always create a new tree by always recreating leaf nodes
        if (ts.isIdentifier(n)) return update(factory.createIdentifier(ts.idText(n)), n);
        if (ts.isPrivateIdentifier(n)) return update(factory.createPrivateIdentifier(ts.idText(n)), n);
        if (ts.isStringLiteral(n)) return update(factory.createStringLiteral(n.text), n);
        if (ts.isNumericLiteral(n)) return update(factory.createNumericLiteral(n.text), n);
        if (ts.isRegularExpressionLiteral(n)) return update(factory.createRegularExpressionLiteral(n.text), n);
        if (ts.isNoSubstitutionTemplateLiteral(n)) return update(factory.createNoSubstitutionTemplateLiteral(n.text, n.rawText), n);
        if (ts.isTemplateHead(n)) return update(factory.createTemplateHead(n.text, n.rawText), n);
        if (ts.isTemplateMiddle(n)) return update(factory.createTemplateMiddle(n.text, n.rawText), n);
        if (ts.isTemplateTail(n)) return update(factory.createTemplateTail(n.text, n.rawText), n);
        if (ts.isToken(n)) return update(factory.createToken(/** @type {number}*/(n.kind)), n);
        if (ts.isBinaryExpression(n)) return update(factory.createBinaryExpression(ts.visitNode(n.left, visitor), n.operatorToken.kind, ts.visitNode(n.right, visitor)), n);
        if (ts.isConditionalExpression(n)) return update(factory.createConditionalExpression(ts.visitNode(n.condition, visitor), ts.visitNode(n.questionToken, visitor), ts.visitNode(n.whenTrue, visitor), ts.visitNode(n.colonToken, visitor), ts.visitNode(n.whenFalse, visitor)), n);
        return ts.visitEachChild(n, visitor, context);
    });

    /**
     * @param {ts.Node} node
     * @param {ts.Node} original
     */
    function update(node, original) {
        return ts.setSourceMapRange(ts.setOriginalNode(node, original), { pos: original.pos, end: original.end, source: original.getSourceFile() });
    }
}
exports.cloneNode = cloneNode;

/**
 * @param {ts.Node} node
 * @returns {node is ts.AssignmentExpression<ts.AssignmentOperatorToken>}
 */
function isAssignmentExpression(node) {
    return ts.isBinaryExpression(node)
        && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment
        && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment;
}
exports.isAssignmentExpression = isAssignmentExpression;

/**
 * @param {ts.Node} node
 */
function isSimpleAssignmentTarget(node) {
    if (ts.isObjectLiteralExpression(node) ||
        ts.isArrayLiteralExpression(node)) {
        return false;
    }

    let parent = node.parent;
    while (ts.isParenthesizedExpression(parent)) {
        node = parent;
        parent = node.parent;
    }
    return isAssignmentExpression(parent) && node === parent.left;
}
exports.isSimpleAssignmentTarget = isSimpleAssignmentTarget;

/**
 * @param {ts.Node} node
 * @returns {node is ts.Node & { readonly parent: ts.AssignmentExpression }}
 */
function isAssignmentTarget(node) {
    if (isSimpleAssignmentTarget(node)) return true;
    if (isAssignmentExpression(node.parent) && node.parent.left === node) return true;
    if (ts.isPropertyAssignment(node.parent)) return node.parent.initializer === node && isAssignmentTarget(node.parent.parent);
    if (ts.isShorthandPropertyAssignment(node.parent)) return node.parent.name === node && isAssignmentTarget(node.parent.parent);
    if (ts.isSpreadAssignment(node.parent)) return node.parent.expression === node && isAssignmentExpression(node.parent.parent);
    if (ts.isSpreadElement(node.parent)) return node.parent.expression === node && isAssignmentExpression(node.parent.parent);
    if (ts.isArrayLiteralExpression(node.parent)) return isAssignmentExpression(node.parent);
    return false;
}
exports.isAssignmentTarget = isAssignmentTarget;