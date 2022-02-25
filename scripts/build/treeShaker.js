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
const { isExpressionIdentifier } = require("./utils");

/**
 * A fairly naive tree shaker designed to remove unused exports from an inlined module
 * @param {ts.SourceFile} sourceFile
 * @param {ts.TypeChecker} checker
 * @param {Iterable<string>} usedExports
 */
function treeShaker(sourceFile, checker, usedExports) {
    /** @type {Map<ts.Node, NodeInfo>} */
    const nodeInfo = new Map();

    // @ts-ignore
    const moduleSymbol = sourceFile.symbol;

    const exports = new Map(checker.getExportsOfModule(moduleSymbol).map(sym => [ts.symbolName(sym), sym]));
    for (const usedExport of usedExports) {
        const exportSym = exports.get(usedExport);

        /** @type {ts.Node | undefined} */
        let node = exportSym?.valueDeclaration ?? exportSym?.declarations?.[0];
        if (node) {
            // walk up `exports.foo = foo` to the expression statement
            if (ts.isPropertyAccessExpression(node)) node = node.parent.parent;
            use(node);
        }
    }

    for (const statement of sourceFile.statements) {
        if (ts.isExpressionStatement(statement)) {
            if (ts.isStringLiteral(statement.expression)) {
                // prologue directives
                use(statement);
            }
            else if (ts.isCallExpression(statement.expression)) {
                const call = statement.expression;
                if (ts.isPropertyAccessExpression(call.expression) &&
                    ts.isIdentifier(call.expression.expression) && ts.idText(call.expression.expression) === "Object" &&
                    ts.isIdentifier(call.expression.name) && ts.idText(call.expression.name) === "defineProperty" &&
                    call.arguments.length > 0
                ) {
                    const arg0 = call.arguments[0];
                    if (ts.isIdentifier(arg0)) {
                        if (ts.idText(arg0) !== "exports") {
                            // `Object.defineProperty(SomeClass, "field", ...)`
                            contingentUse(statement, arg0);
                            continue; 
                        }
                    }
                    else if (ts.isPropertyAccessExpression(arg0) &&
                        ts.isIdentifier(arg0.expression) &&
                        ts.isIdentifier(arg0.name) && ts.idText(arg0.name) === "prototype") {
                        // `Object.defineProperty(SomeClass.prototype, "accessor", ...)`
                        contingentUse(statement, arg0.expression);
                        continue;
                    }
                }
                else if (ts.isFunctionExpression(call.expression) && call.arguments.length === 1) {
                    const arg0 = call.arguments[0];
                    if (ts.isBinaryExpression(arg0) && arg0.operatorToken.kind === ts.SyntaxKind.BarBarToken &&
                        ts.isIdentifier(arg0.left) &&
                        ts.isParenthesizedExpression(arg0.right) &&
                        ts.isBinaryExpression(arg0.right.expression) && arg0.right.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
                        ts.isIdentifier(arg0.right.expression.left) &&
                        ts.isObjectLiteralExpression(arg0.right.expression.right) && arg0.right.expression.right.properties.length === 0
                    ) {
                        // var Foo;
                        // (function (Foo) { ... })(Foo || (Foo = {}));
                        contingentUse(statement, arg0.left);
                        continue;
                    }
                }
                use(statement);
            }
        }
    }

    return ts.transform(sourceFile, [context => {
        return node => ts.visitEachChild(node, visitor, context);

        /**
         * @param {ts.Node} node 
         * @returns {ts.VisitResult<ts.Node>}
         */
        function visitor(node) {
            if (ts.isNotEmittedStatement(node)) return node;
            const info = nodeInfo.get(node);
            if (info?.used) return node;
            if (info?.containsUsed) return ts.visitEachChild(node, visitor, context);
            return undefined;
        }
    }]).transformed[0];

    /**
     * @param {ts.Node} node
     */
    function getNodeInfo(node) {
        let info = nodeInfo.get(node);
        if (!info) nodeInfo.set(node, info = new NodeInfo(node));
        return info;
    }

    /**
     * @param {ts.Identifier} node 
     */
    function getReferencedNode(node) {
        if (isExpressionIdentifier(node)) {
            const referencedSym = checker.getSymbolAtLocation(node);
            if (referencedSym) {
                const flags = referencedSym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(referencedSym).flags : referencedSym.flags;
                if (flags & ts.SymbolFlags.Value && !(ts.idText(node) === "exports" && flags & ts.SymbolFlags.Module)) {
                    return referencedSym.valueDeclaration ?? referencedSym.declarations?.[0];
                }
            }
        }
    }

    /**
     * @param {ts.Node} node
     */
    function use(node) {
        const info = getNodeInfo(node);
        if (info.used) return;

        // mark used
        info.markUsed(use);

        // use references
        if (ts.isIdentifier(node)) {
            const referencedNode = getReferencedNode(node);
            if (referencedNode) use(referencedNode);
        }

        while (node.parent) {
            const parent = node.parent;
            const parentInfo = getNodeInfo(parent);
            if (parentInfo.used || parentInfo.containsUsed) break;
            if (ts.isPropertyAccessExpression(parent) ||
                ts.isElementAccessExpression(parent) ||
                ts.isArrayLiteralExpression(parent) ||
                ts.isSpreadElement(parent) ||
                ts.isObjectLiteralExpression(parent) ||
                ts.isPropertyAssignment(parent) ||
                ts.isShorthandPropertyAssignment(parent) ||
                ts.isSpreadAssignment(parent) ||
                ts.isPrefixUnaryExpression(parent) ||
                ts.isPostfixUnaryExpression(parent) ||
                ts.isBinaryExpression(parent) ||
                ts.isConditionalExpression(parent) ||
                ts.isVariableDeclaration(parent)) {
                // nodes that contain multiple branches must use all their branches
                parentInfo.markUsed(use);
            }
            else {
                parentInfo.markContainsUsed();
            }
            node = parent;
        }
    }

    /**
     * @param {ts.Node} node
     * @param {ts.Node} contingentNode
     */
    function contingentUse(node, contingentNode) {
        const info = getNodeInfo(node);
        info.addContingentUse(getNodeInfo(contingentNode), use);

        const referencedNode = ts.isIdentifier(contingentNode) && isExpressionIdentifier(contingentNode) && getReferencedNode(contingentNode);
        if (referencedNode) info.addContingentUse(getNodeInfo(referencedNode), use);
    }
}

exports.treeShaker = treeShaker;

class NodeInfo {
    #used = false;
    #containsUsed = false;
    /** @type {ts.Node} */
    #node;
    /** @type {Set<NodeInfo> | undefined} */
    #contingentUses;

    /**
     * @param {ts.Node} node
     */
    constructor(node) {
        this.#node = node;
    }

    get used() {
        return this.#used;
    }

    get containsUsed() {
        return this.#containsUsed;
    }

    /**
     * @param {(node: ts.Node) => void} use
     */
    markUsed(use) {
        if (this.#used) return;
        this.#used = true;
        ts.forEachChild(this.#node, use);
        if (this.#contingentUses) {
            for (const info of this.#contingentUses) {
                info.markUsed(use);
            }
        }
    }

    markContainsUsed() {
        if (this.#containsUsed) return;
        this.#containsUsed = true;
    }

    /**
     * Mark this node if `info` ever becomes used.
     * @param {NodeInfo} info
     * @param {(node: ts.Node) => void} use
     */
    addContingentUse(info, use) {
        if (this.#used) {
            return;
        }
        if (info.#used) {
            this.markUsed(use);
            return;
        }
        info.#contingentUses ??= new Set();
        info.#contingentUses.add(this);
    }
}
