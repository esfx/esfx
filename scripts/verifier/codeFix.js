// @ts-check
const ts = require("typescript");
const assert = require("assert");
const { tryCast, toPath } = require("./utils");

/**
 * @typedef CodeFixBase
 * @property {ts.JsonSourceFile} [file]
 * @property {string} [description]
 */

/**
 * @typedef ResolvedCodeFixBase
 * @property {ts.JsonSourceFile} file
 * @property {string} [description]
 */

/**
 * @typedef BatchCodeFixBase
 * @property {"batch"} action
 * @property {Exclude<CodeFix, BatchCodeFix>[]} fixes
 * @property {never} [antecedent]
 */

/**
 * @typedef ResolvedBatchCodeFixBase
 * @property {"batch"} action
 * @property {Exclude<ResolvedCodeFix, ResolvedBatchCodeFix>[]} fixes
 * @property {never} [antecedent]
 */

/**
 * @typedef {CodeFixBase & BatchCodeFixBase} BatchCodeFix
 * @typedef {ResolvedCodeFixBase & ResolvedBatchCodeFixBase} ResolvedBatchCodeFix
 */

/**
 * @typedef AddFileCodeFixBase
 * @property {"addFile"} action
 * @property {string} newFileName
 * @property {readonly ts.Statement[]} body
 * @property {never} [antecedent]
 */

/**
 * @typedef ResolvedAddFileCodeFixBase
 * @property {"addFile"} action
 * @property {string} newFileName
 * @property {readonly ts.Statement[]} body
 * @property {never} [antecedent]
 */

/**
 * @typedef {CodeFixBase & AddFileCodeFixBase} AddFileCodeFix
 * @typedef {ResolvedCodeFixBase & ResolvedAddFileCodeFixBase} ResolvedAddFileCodeFix
 */

/**
 * @typedef RemovePropertyCodeFixBase
 * @property {"removeProperty"} action
 * @property {ts.ObjectLiteralExpression} [object]
 * @property {ts.PropertyAssignment | import("./types").PropertyAssignmentInitializer} property
 * @property {never} [antecedent]
 */

/**
 * @typedef ResolvedRemovePropertyCodeFixBase
 * @property {"removeProperty"} action
 * @property {ts.ObjectLiteralExpression} object
 * @property {ts.PropertyAssignment} property
 * @property {never} [antecedent]
 */

/**
 * @typedef {CodeFixBase & RemovePropertyCodeFixBase} RemovePropertyCodeFix
 * @typedef {ResolvedCodeFixBase & ResolvedRemovePropertyCodeFixBase} ResolvedRemovePropertyCodeFix
 */

/**
 * @typedef RemoveElementCodeFixBase
 * @property {"removeElement"} action
 * @property {ts.ArrayLiteralExpression} [array]
 * @property {ts.ObjectLiteralExpression} element
 * @property {never} [antecedent]
 */

/**
 * @typedef ResolvedRemoveElementCodeFixBase
 * @property {"removeElement"} action
 * @property {ts.ArrayLiteralExpression} array
 * @property {ts.ObjectLiteralExpression} element
 * @property {never} [antecedent]
 */

/**
 * @typedef {CodeFixBase & RemoveElementCodeFixBase} RemoveElementCodeFix
 * @typedef {ResolvedCodeFixBase & ResolvedRemoveElementCodeFixBase} ResolvedRemoveElementCodeFix
 */

/**
 * @typedef AppendPropertyCodeFixBase
 * @property {"appendProperty"} action
 * @property {ts.ObjectLiteralExpression} object
 * @property {ts.PropertyAssignment} property
 * @property {AppendPropertyCodeFix} [antecedent] When set, ensures the provided code-fix is applied before this code fix is applied.
 */

/**
 * @typedef {CodeFixBase & AppendPropertyCodeFixBase} AppendPropertyCodeFix
 * @typedef {ResolvedCodeFixBase & AppendPropertyCodeFixBase} ResolvedAppendPropertyCodeFix
 */

/**
 * @typedef InsertPropertyCodeFixBase
 * @property {"insertProperty"} action
 * @property {ts.PropertyAssignment} afterProperty
 * @property {ts.PropertyAssignment} property
 * @property {never} [antecedent]
 */

/**
 * @typedef {CodeFixBase & InsertPropertyCodeFixBase} InsertPropertyCodeFix
 * @typedef {ResolvedCodeFixBase & InsertPropertyCodeFixBase} ResolvedInsertPropertyCodeFix
 */

/**
 * @typedef AppendElementCodeFixBase
 * @property {"appendElement"} action
 * @property {ts.ArrayLiteralExpression} array
 * @property {import("typescript").JsonObjectExpression} element
 * @property {AppendPropertyCodeFix} [antecedent] When set, ensures the provided code-fix is applied before this code fix is applied.
 */

/**
 * @typedef {CodeFixBase & AppendElementCodeFixBase} AppendElementCodeFix
 * @typedef {ResolvedCodeFixBase & AppendElementCodeFixBase} ResolvedAppendElementCodeFix
 */

/**
 * @typedef ReplaceValueCodeFixBase
 * @property {"replaceValue"} action
 * @property {ts.Expression} oldValue
 * @property {ts.Expression} newValue
 * @property {never} [antecedent]
 */

/**
 * @typedef {CodeFixBase & ReplaceValueCodeFixBase} ReplaceValueCodeFix
 * @typedef {ResolvedCodeFixBase & ReplaceValueCodeFixBase} ResolvedReplaceValueCodeFix
 */

/**
 * @typedef {BatchCodeFix | AddFileCodeFix | RemovePropertyCodeFix | RemoveElementCodeFix | AppendPropertyCodeFix | AppendElementCodeFix | InsertPropertyCodeFix | ReplaceValueCodeFix} CodeFix
 */

/**
 * @typedef {ResolvedBatchCodeFix | ResolvedAddFileCodeFix | ResolvedRemovePropertyCodeFix | ResolvedRemoveElementCodeFix | ResolvedAppendPropertyCodeFix | ResolvedAppendElementCodeFix | ResolvedInsertPropertyCodeFix | ResolvedReplaceValueCodeFix} ResolvedCodeFix
 */

/**
 *
 * @param {AppendPropertyCodeFix | InsertPropertyCodeFix | AppendElementCodeFix} fix
 * @param {import("typescript").JsonObjectExpression} expression
 */
function updateFix(fix, expression) {
    if (fix.action === "appendElement") {
        fix.element = expression;
    }
    else {
        fix.property = ts.factory.updatePropertyAssignment(fix.property, fix.property.name, expression);
    }
}

/**
 * @template {ts.Node} T
 * @param {ts.NodeArray<T>} list
 * @param {T} startNode
 * @param {T?} endNode
 * @param {boolean} includeEnd
 */
function removeNodeRange(list, startNode, endNode, includeEnd) {
    assert(includeEnd || endNode);
    const startIndex = list.indexOf(startNode);
    const endIndex = 
        startNode === endNode ? startIndex :
        includeEnd ? endNode ? list.indexOf(endNode) : -1 :
        endNode ? list.indexOf(endNode) :
        list.length;
    assert(startIndex >= 0);
    assert(endIndex >= startIndex);
    const nodes = [...list.slice(0, startIndex), ...list.slice(endIndex + (includeEnd ? 1 : 0))];
    return ts.setTextRange(ts.factory.createNodeArray(nodes, list.hasTrailingComma), list);
}

/**
 * @template {ts.Node} T
 * @param {ts.NodeArray<T>} list
 * @param {T} startNode
 * @param {T} endNode
 * @param {readonly T[]} newNodes
 */
function replaceNodeRange(list, startNode, endNode, newNodes) {
    const startIndex = list.indexOf(startNode);
    const endIndex = startNode === endNode ? startIndex : list.indexOf(endNode);
    assert(startIndex >= 0);
    assert(endIndex >= startIndex);
    const nodes = [...list.slice(0, startIndex), ...newNodes, ...list.slice(endIndex + 1)];
    return ts.setTextRange(ts.factory.createNodeArray(nodes, list.hasTrailingComma), list);
}

/**
 * @template {ts.Node} T
 * @param {ts.NodeArray<T>} list 
 * @param {"before" | "after" | "atEnd" | "atStart"} position 
 * @param {T?} relativeTo
 * @param {readonly T[]} newNodes
 */
function insertNodes(list, position, relativeTo, newNodes) {
    let nodes;
    switch (position) {
        case "before":
        case "after":
            assert(relativeTo);
            const index = list.indexOf(relativeTo);
            assert(index >= 0);
            const offset = position === "before" ? 0 : 1;
            nodes = [...list.slice(0, index + offset), ...newNodes, ...list.slice(index + offset)];
            break;
        case "atStart":
            nodes = [...newNodes, ...list];
            break;
        case "atEnd":
            nodes = [...list, ...newNodes];
            break;
    }
    return ts.setTextRange(ts.factory.createNodeArray(nodes, list.hasTrailingComma), list);
}

/**
 * 
 * @param {ts.Node?} node 
 * @returns {node is ts.PropertyAssignment?}
 */
function isOptionalPropertyAssignment(node) {
    return node === undefined || ts.isPropertyAssignment(node);
}

/**
 * @param {ts.Node} node 
 * @returns {node is import("typescript").JsonObjectExpression}
 */
function isJsonExpression(node) {
    return ts.isObjectLiteralExpression(node)
        || ts.isArrayLiteralExpression(node)
        || ts.isStringLiteral(node)
        || ts.isNumericLiteral(node)
        || node.kind === ts.SyntaxKind.TrueKeyword
        || node.kind === ts.SyntaxKind.FalseKeyword
        || node.kind === ts.SyntaxKind.NullKeyword;
}

/**
 * @param {ts.Node} node 
 * @returns {node is import("typescript").JsonObjectExpression?}
 */
function isOptionalJsonExpression(node) {
    return node === undefined || isJsonExpression(node);
}

/**
 * @param {import("./textChanges").ChangeTracker} tracker
 * @param {AppendPropertyCodeFix | InsertPropertyCodeFix | AppendElementCodeFix} fix
 * @returns {import("./textChanges").ChangeTracker}
 */
function createObjectLiteralMutator(tracker, fix) {
    const expression = fix.action === "appendElement" ? fix.element : fix.property.initializer;
    assert(ts.isObjectLiteralExpression(expression));
    return {
        ...tracker,
        delete(_, node) {
            assert(ts.isPropertyAssignment(node));
            assert(expression.properties.includes(node));
            updateFix(fix, ts.factory.updateObjectLiteralExpression(expression, removeNodeRange(expression.properties, node, node, true)));
        },
        deleteNode(_, node) {
            assert(ts.isPropertyAssignment(node));
            assert(expression.properties.includes(node));
            updateFix(fix, ts.factory.updateObjectLiteralExpression(expression, removeNodeRange(expression.properties, node, node, true)));
        },
        deleteNodeRange(_, startNode, endNode) {
            assert(ts.isPropertyAssignment(startNode));
            assert(ts.isPropertyAssignment(endNode));
            updateFix(fix, ts.factory.updateObjectLiteralExpression(expression, removeNodeRange(expression.properties, startNode, endNode, true)));
        },
        deleteNodeRangeExcludingEnd(_, startNode, endNode) {
            assert(ts.isPropertyAssignment(startNode));
            assert(isOptionalPropertyAssignment(endNode));
            updateFix(fix, ts.factory.updateObjectLiteralExpression(expression, removeNodeRange(expression.properties, startNode, endNode, false)));
        },
        replaceRange() { throw new Error(); },
        replaceNode(_, oldNode, newNode) {
            assert(ts.isPropertyAssignment(oldNode));
            assert(ts.isPropertyAssignment(newNode));
            updateFix(fix, ts.factory.updateObjectLiteralExpression(expression, replaceNodeRange(expression.properties, oldNode, oldNode, [newNode])));
        },
        replaceNodeWithNodes(_, oldNode, newNodes) {
            assert(ts.isPropertyAssignment(oldNode));
            assert(newNodes.every(ts.isPropertyAssignment));
            updateFix(fix, ts.factory.updateObjectLiteralExpression(expression, replaceNodeRange(expression.properties, oldNode, oldNode, newNodes)));
        },
        replaceRangeWithText() { throw new Error(); },
        replaceNodeRange(_, startNode, endNode, newNode) {
            assert(ts.isPropertyAssignment(startNode));
            assert(ts.isPropertyAssignment(endNode));
            assert(ts.isPropertyAssignment(newNode));
            updateFix(fix, ts.factory.updateObjectLiteralExpression(expression, replaceNodeRange(expression.properties, startNode, endNode, [newNode])));
        },
        insertNodeBefore(_, beforeNode, newNode, blankLineBetween) {
            assert(ts.isPropertyAssignment(beforeNode));
            assert(ts.isPropertyAssignment(newNode));
            // @ts-ignore
            if (blankLineBetween) ts.setStartsOnNewLine(newNode, true);
            updateFix(fix, ts.factory.updateObjectLiteralExpression(expression, insertNodes(expression.properties, "before", beforeNode, [newNode])));
        },
        insertNodeAtObjectStart(_, parent, newChild) {
            assert(parent === expression);
            assert(ts.isPropertyAssignment(newChild));
            updateFix(fix, ts.factory.updateObjectLiteralExpression(expression, insertNodes(expression.properties, "atStart", undefined, [newChild])))
        },
        insertNodeInListAfter(_, afterNode, newNode) {
            assert(ts.isPropertyAssignment(afterNode));
            assert(ts.isPropertyAssignment(newNode));
            updateFix(fix, ts.factory.updateObjectLiteralExpression(expression, insertNodes(expression.properties, "after", afterNode, [newNode])));
        },
        insertNodeAtEndOfList(_, list, node) {
            assert(list === expression.properties);
            assert(ts.isPropertyAssignment(node));
            updateFix(fix, ts.factory.updateObjectLiteralExpression(expression, insertNodes(expression.properties, "atEnd", undefined, [node])));
        },
        insertNodeAt() { throw new Error(); }
    }
}
exports.createObjectLiteralMutator = createObjectLiteralMutator;

/**
 * @param {import("./textChanges").ChangeTracker} tracker
 * @param {AppendPropertyCodeFix | InsertPropertyCodeFix | AppendElementCodeFix} fix
 * @returns {import("./textChanges").ChangeTracker}
 */
function createArrayLiteralMutator(tracker, fix) {
    const expression = fix.action === "appendElement" ? fix.element : fix.property.initializer;
    assert(ts.isArrayLiteralExpression(expression));
    return {
        ...tracker,
        delete(_, node) {
            assert(isJsonExpression(node));
            assert(expression.elements.includes(node));
            updateFix(fix, ts.factory.updateArrayLiteralExpression(expression, removeNodeRange(expression.elements, node, node, true)));
        },
        deleteNode(_, node) {
            assert(isJsonExpression(node));
            assert(expression.elements.includes(node));
            updateFix(fix, ts.factory.updateArrayLiteralExpression(expression, removeNodeRange(expression.elements, node, node, true)));
        },
        deleteNodeRange(_, startNode, endNode) {
            assert(isJsonExpression(startNode));
            assert(isJsonExpression(endNode));
            updateFix(fix, ts.factory.updateArrayLiteralExpression(expression, removeNodeRange(expression.elements, startNode, endNode, true)));
        },
        deleteNodeRangeExcludingEnd(_, startNode, endNode) {
            assert(isJsonExpression(startNode));
            assert(isOptionalJsonExpression(endNode));
            updateFix(fix, ts.factory.updateArrayLiteralExpression(expression, removeNodeRange(expression.elements, startNode, endNode, false)));
        },
        replaceRange() { throw new Error(); },
        replaceNode(_, oldNode, newNode) {
            assert(isJsonExpression(oldNode));
            assert(isJsonExpression(newNode));
            updateFix(fix, ts.factory.updateArrayLiteralExpression(expression, replaceNodeRange(expression.elements, oldNode, oldNode, [newNode])));
        },
        replaceNodeWithNodes(_, oldNode, newNodes) {
            assert(isJsonExpression(oldNode));
            assert(newNodes.every(isJsonExpression));
            updateFix(fix, ts.factory.updateArrayLiteralExpression(expression, replaceNodeRange(expression.elements, oldNode, oldNode, newNodes)));
        },
        replaceRangeWithText() { throw new Error(); },
        replaceNodeRange(_, startNode, endNode, newNode) {
            assert(isJsonExpression(startNode));
            assert(isJsonExpression(endNode));
            assert(isJsonExpression(newNode));
            updateFix(fix, ts.factory.updateArrayLiteralExpression(expression, replaceNodeRange(expression.elements, startNode, endNode, [newNode])));
        },
        insertNodeBefore(_, beforeNode, newNode, blankLineBetween) {
            assert(isJsonExpression(beforeNode));
            assert(isJsonExpression(newNode));
            // @ts-ignore
            if (blankLineBetween) ts.setStartsOnNewLine(newNode, true);
            updateFix(fix, ts.factory.updateArrayLiteralExpression(expression, insertNodes(expression.elements, "before", beforeNode, [newNode])));
        },
        insertNodeAtObjectStart(_, parent, newChild) {
            throw new Error();
        },
        insertNodeInListAfter(_, afterNode, newNode) {
            assert(isJsonExpression(afterNode));
            assert(isJsonExpression(newNode));
            updateFix(fix, ts.factory.updateArrayLiteralExpression(expression, insertNodes(expression.elements, "after", afterNode, [newNode])));
        },
        insertNodeAtEndOfList(_, list, node) {
            assert(list === expression.elements);
            assert(isJsonExpression(node));
            updateFix(fix, ts.factory.updateArrayLiteralExpression(expression, insertNodes(expression.elements, "atEnd", undefined, [node])));
        },
        insertNodeAt() { throw new Error(); }
    }
}
exports.createArrayLiteralMutator = createArrayLiteralMutator;

/**
 * @param {AppendPropertyCodeFix | InsertPropertyCodeFix | AppendElementCodeFix} antecedent
 * @param {import("./textChanges").ChangeTracker} tracker 
 */
function chainAntecedent(antecedent, tracker) {
    if (antecedent) {
        const expression = antecedent.action === "appendElement" ? antecedent.element : antecedent.property.initializer;
        if (ts.isObjectLiteralExpression(expression)) {
            tracker = createObjectLiteralMutator(tracker, antecedent);
        }
        else if (ts.isArrayLiteralExpression(expression)) {
            tracker = createArrayLiteralMutator(tracker, antecedent);
        }
    }
    return tracker;
}

/**
 * @param {ts.Node} node
 */
function getJsonSourceFile(node) {
    const sourceFile = node.getSourceFile();
    const scriptKind = /** @type {*} */(sourceFile).scriptKind;
    if (scriptKind !== ts.ScriptKind.JSON) throw new TypeError(`Wrong language version for file '${sourceFile.fileName}'. Expected JSON, received ${scriptKind === undefined ? "undefined" : ts.ScriptKind[scriptKind]}`);
    // if (sourceFile.languageVersion !== ts.ScriptTarget.JSON) throw new TypeError(`Wrong language version for file '${sourceFile.fileName}'. Expected JSON, received ${ts.ScriptTarget[sourceFile.languageVersion]}`);
    return /** @type {ts.JsonSourceFile} */(sourceFile);
}

/**
 * @param {CodeFix} fix
 * @returns {asserts fix is ResolvedCodeFix}
 */
function resolveFix(fix) {
    switch (fix.action) {
        case "batch":
            fix.fixes.forEach(resolveFix);
            break;
        case "addFile":
            break;
        case "removeProperty":
            if (!ts.isPropertyAssignment(fix.property)) fix.property = fix.property.parent;
            fix.file ??= getJsonSourceFile(fix.property);
            fix.object ??= fix.property.parent;
            break;
        case "removeElement":
            fix.file ??= getJsonSourceFile(fix.element);
            fix.array ??= tryCast(fix.element.parent, ts.isArrayLiteralExpression) ?? assert.fail("Parent was not an array literal");
            break;
        case "appendProperty":
            fix.file ??= getJsonSourceFile(fix.object);
            break;
        case "appendElement":
            fix.file ??= getJsonSourceFile(fix.array);
            break;
        case "insertProperty":
            fix.file ??= getJsonSourceFile(fix.afterProperty);
            break;
        case "replaceValue":
            fix.file ??= getJsonSourceFile(fix.oldValue);
            break;
    }
}
exports.resolveFix = resolveFix;

/**
 * @param {CodeFix} fix
 * @param {import("./textChanges").ChangeTracker} tracker
 * @param {Set<CodeFix>} fixed
 */
function applyFix(fix, tracker, fixed) {
    if (fixed.has(fix)) return;
    resolveFix(fix);

    const originalTracker = tracker;
    fixed.add(fix);

    tracker = chainAntecedent(fix.antecedent, tracker);
    switch (fix.action) {
        case "batch": {
            for (const child of fix.fixes) applyFix(child, tracker, fixed);
            break;
        }
        case "addFile": {
            const newFileName = toPath(fix.newFileName);
            tracker.createNewFile(fix.file ?? ts.createSourceFile(newFileName, "", ts.ScriptTarget.JSON, false, ts.ScriptKind.JSON), newFileName, fix.body);
            break;
        }
        case "removeProperty":
            tracker.delete(fix.file, fix.property);
            break;
        case "removeElement":
            tracker.delete(fix.file, fix.element);
            break;
        case "appendProperty":
            tracker.insertNodeAtEndOfList(fix.file, fix.object.properties, fix.property);
            break;
        case "appendElement":
            tracker.insertNodeAtEndOfList(fix.file, fix.array.elements, fix.element);
            break;
        case "insertProperty":
            tracker.insertNodeInListAfter(fix.file, fix.afterProperty, fix.property, fix.afterProperty.parent.properties);
            break;
        case "replaceValue":
            tracker.replaceNode(fix.file, fix.oldValue, fix.newValue);
            break;
    }

    tracker = originalTracker;
    if (fix.antecedent) {
        applyFix(fix.antecedent, tracker, fixed);
    }
}
exports.applyFix = applyFix;

/**
 * @param {CodeFix} fix
 */
 function getFixDescription(fix) {
    if (fix.description) return fix.description;
    switch (fix.action) {
        case "addFile": return "Create a new file";
        case "appendElement": return "Add element to end of array";
        case "removeElement": return "Remove element from array";
        case "appendProperty": return "Add property to object";
        case "insertProperty": return "Insert property into object";
        case "removeProperty": return "Remove property from object";
        case "replaceValue": return "Replace value";
        default: return "Fix this?";
    }
}
exports.getFixDescription = getFixDescription;
