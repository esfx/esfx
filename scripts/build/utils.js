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