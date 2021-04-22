// @ts-check
const ts = require("typescript");
const diff = require("diff");
const { forEachChild } = require("typescript");
const chalk = /** @type {typeof import("chalk").default} */(/** @type {*} */(require("chalk")));

/** @enum {number} */
const LeadingTriviaOption = {
    Exclude: /** @type {number} */(/** @type {*} */(ts).textChanges.LeadingTriviaOption.Exclude),
    IncludeAll: /** @type {number} */(/** @type {*} */(ts).textChanges.LeadingTriviaOption.IncludeAll),
    JSDoc: /** @type {number} */(/** @type {*} */(ts).textChanges.LeadingTriviaOption.JSDoc),
    StartLine: /** @type {number} */(/** @type {*} */(ts).textChanges.LeadingTriviaOption.StartLine),
};
exports.LeadingTriviaOption = LeadingTriviaOption;

/** @enum {number} */
const TrailingTriviaOption = {
    Exclude: /** @type {number} */(/** @type {*} */(ts).textChanges.TrailingTriviaOption.Exclude),
    ExcludeWhitespace: /** @type {number} */(/** @type {*} */(ts).textChanges.TrailingTriviaOption.ExcludeWhitespace),
    Include: /** @type {number} */(/** @type {*} */(ts).textChanges.TrailingTriviaOption.Include),
};
exports.TrailingTriviaOption = TrailingTriviaOption;

/**
 * @typedef ConfigurableStart
 * @property {LeadingTriviaOption} [leadingTriviaOption]
 */

/**
 * @typedef ConfigurableEnd
 * @property {TrailingTriviaOption} [trailingTriviaOption]
 */

/**
 * @typedef {ConfigurableStart & ConfigurableEnd} ConfigurableStartEnd
 */

/**
 * @typedef InsertNodeOptions
 * @property {string} [prefix]
 * @property {string} [suffix]
 * @property {number} [indentation]
 * @property {number} [delta]
 * @property {boolean} [preserveLeadingWhitespace]
 */

/**
 * @typedef {ConfigurableStartEnd & InsertNodeOptions} ChangeNodeOptions
 */

/**
 * @typedef {InsertNodeOptions & { joiner?: string }} ReplaceWithMultipleNodesOptions
 */

/**
 * @typedef FormatContext
 * @property {ts.FormatCodeSettings} options
 * @property {() => undefined} getRules
 */

/**
 * @typedef TextChangesContext
 * @property {Partial<ts.LanguageServiceHost>} host
 * @property {FormatContext} formatContext
 * @property {ts.UserPreferences} preferences
 */

/**
 * @typedef ChangeTracker
 * @property {(sourceFile: ts.SourceFile, range: ts.TextRange) => void} deleteRange
 * @property {(sourceFile: ts.SourceFile, node: ts.Node) => void} delete
 * @property {(sourceFile: ts.SourceFile, node: ts.Node, options?: ConfigurableStartEnd) => void} deleteNode
 * @property {(sourceFile: ts.SourceFile, startNode: ts.Node, endNode: ts.Node, options?: ConfigurableStartEnd) => void} deleteNodeRange
 * @property {(sourceFile: ts.SourceFile, startNode: ts.Node, endNode: ts.Node | undefined, options?: ConfigurableStartEnd) => void} deleteNodeRangeExcludingEnd
 * @property {(sourceFile: ts.SourceFile, range: ts.TextRange, newNode: ts.Node, options?: InsertNodeOptions) => void} replaceRange
 * @property {(sourceFile: ts.SourceFile, oldNode: ts.Node, newNode: ts.Node, options?: ChangeNodeOptions) => void} replaceNode
 * @property {(sourceFile: ts.SourceFile, oldNode: ts.Node, newNodes: readonly ts.Node[], options?: ChangeNodeOptions) => void} replaceNodeWithNodes
 * @property {(sourceFile: ts.SourceFile, range: ts.TextRange, text: string) => void} replaceRangeWithText
 * @property {(sourceFile: ts.SourceFile, startNode: ts.Node, endNode: ts.Node, newNode: ts.Node, options?: ChangeNodeOptions) => void} replaceNodeRange
 * @property {(sourceFile: ts.SourceFile, node: ts.Node) => ts.Token<ts.SyntaxKind.CommaToken> | undefined} nextCommaToken
 * @property {(sourceFile: ts.SourceFile, beforeNode: ts.Node, newNode: ts.Node, blankLineBetween?: boolean, options?: ConfigurableStartEnd) => void} insertNodeBefore
 * @property {(sourceFile: ts.SourceFile, parent: ts.ObjectLiteralExpression, newChild: ts.Node) => void} insertNodeAtObjectStart
 * @property {(sourceFile: ts.SourceFile, afterNode: ts.Node, newNode: ts.Node, containingList?: ts.NodeArray<ts.Node>) => void} insertNodeInListAfter
 * @property {(sourceFile: ts.SourceFile, list: ts.NodeArray<ts.Node>, newNode: ts.Node) => void} insertNodeAtEndOfList
 * @property {(sourceFile: ts.SourceFile, pos: number, newNode: ts.Node, options?: InsertNodeOptions) => void} insertNodeAt
 * @property {() => ts.FileTextChanges[]} getChanges
 */

/**
 * @param {(tracker: ChangeTracker) => void} cb
 * @returns {ts.FileTextChanges[]}
 */
function trackChanges(cb) {
    /** @type {ts.LanguageServiceHost} */
    const host = {
        getCompilationSettings: () => ({}),
        getScriptFileNames: () => [],
        getScriptVersion: () => "1",
        getScriptSnapshot: () => undefined,
        getCurrentDirectory: () => "",
        getDefaultLibFileName: () => "",
        getNewLine: () => "\n"
    };
    const context = {
        host,
        formatContext: /** @type {*}*/(ts).formatting.getFormatContext(ts.getDefaultFormatCodeSettings(host.getNewLine?.()), host),
        preferences: {
            quotePreference: "double"
        }
    };
    const tracker = wrapChangeTracker(/** @type {*} */(ts).textChanges.ChangeTracker.fromContext(context));
    cb(tracker);
    return tracker.getChanges();
}
exports.trackChanges = trackChanges;

/**
 * @param {ChangeTracker} tracker
 * @returns {ChangeTracker}
 */
function wrapChangeTracker(tracker) {
    /** @type {Map<ts.Node | ts.NodeArray<ts.Node>, ts.TextRange>} */
    const positions = new Map();
    return {
        deleteRange(sourceFile, range) {
            collectPositions(sourceFile);
            tracker.deleteRange(sourceFile, range);
        },
        delete(sourceFile, node) {
            collectPositions(sourceFile);
            collectPositions(node);
            deleteExtraneousComma(tracker, sourceFile, node);
            tracker.delete(sourceFile, node)
        },
        deleteNode(sourceFile, node, options) {
            collectPositions(sourceFile);
            collectPositions(node);
            deleteExtraneousComma(tracker, sourceFile, node);
            tracker.deleteNode(sourceFile, node, options);
        },
        deleteNodeRange(sourceFile, startNode, endNode, options) {
            collectPositions(sourceFile);
            collectPositions(startNode);
            collectPositions(endNode);
            tracker.deleteNodeRange(sourceFile, startNode, endNode, options);
        },
        deleteNodeRangeExcludingEnd(sourceFile, startNode, endNode, options) {
            collectPositions(sourceFile);
            collectPositions(startNode);
            collectPositions(endNode);
            tracker.deleteNodeRangeExcludingEnd(sourceFile, startNode, endNode, options);
        },
        replaceRange(sourceFile, range, newNode, options) {
            collectPositions(sourceFile);
            collectPositions(newNode);
            tracker.replaceRange(sourceFile, range, newNode, options);
        },
        replaceNode(sourceFile, oldNode, newNode, options) {
            collectPositions(sourceFile);
            collectPositions(oldNode);
            collectPositions(newNode);
            tracker.replaceNode(sourceFile, oldNode, newNode, options);
        },
        replaceNodeWithNodes(sourceFile, oldNode, newNodes, options) {
            collectPositions(sourceFile);
            collectPositions(oldNode);
            newNodes.forEach(collectPositions);
            tracker.replaceNodeWithNodes(sourceFile, oldNode, newNodes, options);
        },
        replaceRangeWithText(sourceFile, range, text) {
            collectPositions(sourceFile);
            tracker.replaceRangeWithText(sourceFile, range, text);
        },
        replaceNodeRange(sourceFile, startNode, endNode, newNode, options) {
            collectPositions(sourceFile);
            collectPositions(startNode);
            collectPositions(endNode);
            collectPositions(newNode);
            tracker.replaceNodeRange(sourceFile, startNode, endNode, newNode, options);
        },
        nextCommaToken: tracker.nextCommaToken?.bind(tracker),
        insertNodeBefore(sourceFile, beforeNode, newNode, blankLineBetween, options) {
            collectPositions(sourceFile);
            collectPositions(beforeNode);
            collectPositions(newNode);
            tracker.insertNodeBefore(sourceFile, beforeNode, newNode, blankLineBetween, options);
        },
        insertNodeAtObjectStart(sourceFile, parent, newChild) {
            collectPositions(sourceFile);
            collectPositions(parent);
            collectPositions(newChild);
            tracker.insertNodeAtObjectStart(sourceFile, parent, newChild);
        },
        insertNodeInListAfter(sourceFile, afterNode, newNode, containingList) {
            collectPositions(sourceFile);
            collectPositions(afterNode);
            collectPositions(newNode);
            if (!containingList) {
                containingList =
                    ts.isObjectLiteralExpression(afterNode.parent) ? afterNode.parent.properties :
                    ts.isArrayLiteralExpression(afterNode.parent) ? afterNode.parent.elements :
                    undefined;
            }
            containingList?.forEach(collectPositions);
            tracker.insertNodeInListAfter(sourceFile, afterNode, newNode, containingList);
        },
        insertNodeAtEndOfList(sourceFile, list, newNode) {
            collectPositions(sourceFile);
            collectPositions(list);
            collectPositions(newNode);
            if (list.hasTrailingComma) {
                if (list.length) {
                    tracker.insertNodeAt(sourceFile, list.end, newNode, { prefix: "\n" });
                }
                else {
                    tracker.insertNodeAt(sourceFile, list.pos, newNode, {});
                }
                return;
            }
            tracker.insertNodeAtEndOfList(sourceFile, list, newNode);
        },
        insertNodeAt(sourceFile, pos, newNode, options) {
            collectPositions(sourceFile);
            collectPositions(newNode);
            tracker.insertNodeAt(sourceFile, pos, newNode, options);
        },
        getChanges() {
            const changes = tracker.getChanges();
            restorePositions();
            return changes;
        }
    };

    /**
     * @param {ts.Node | ts.NodeArray<ts.Node> | undefined} node
     */
    function collectPositions(node) {
        if (!node) return;
        if (positions.has(node)) return;
        positions.set(node, { pos: node.pos, end: node.end });
        if (/** @type {(value: any) => value is readonly any[]} */(Array.isArray)(node)) {
            node.forEach(collectPositions);
        }
        else {
            forEachChild(node, collectPositions, collectPositions);
        }
    }

    function restorePositions() {
        for (const [value, textRange] of positions) {
            Object.assign(value, textRange);
        }
    }
}

/**
 * @param {ChangeTracker} tracker
 * @param {ts.SourceFile} sourceFile
 * @param {ts.Node} node
 */
function deleteExtraneousComma(tracker, sourceFile, node) {
    if (!node.parent) return;
    /** @type {readonly ts.Node[] | undefined} */
    const siblings =
        ts.isObjectLiteralExpression(node.parent) ? node.parent.properties :
        ts.isArrayLiteralExpression(node.parent) ? node.parent.elements :
        undefined;
    if (!siblings) return;
    const trailingComma = tracker.nextCommaToken(sourceFile, node);
    if (trailingComma) {
        tracker.deleteNode(sourceFile, trailingComma, { leadingTriviaOption: LeadingTriviaOption.Exclude });
    }
    else {
        // check for a leading comma
        const index = siblings.indexOf(node);
        if (index > 0) {
            const previousSibling = siblings[index - 1];
            const leadingComma = tracker.nextCommaToken(sourceFile, previousSibling);
            if (leadingComma) {
                tracker.deleteNode(sourceFile, leadingComma, { trailingTriviaOption: TrailingTriviaOption.Exclude });
            }
        }
    }
}

/**
 * @param {string} text
 * @param {readonly ts.TextChange[]} changes
 * @returns {string}
 */
function applyChanges(text, changes) {
    return /** @type {*} */(ts).textChanges.applyChanges(text, changes);
}
exports.applyChanges = applyChanges;

/**
 * @param {string} fileName
 * @param {string} beforeText
 * @param {string} afterText
 */
function createPatch(fileName, beforeText, afterText) {
    const patch = diff.createPatch(fileName, beforeText, afterText, undefined, undefined, { context: 2 });
    const patchLines = patch.split(/\r?\n/g).slice(2).map(line =>
        line.startsWith("---") ? chalk.blue(line) :
        line.startsWith("+++") ? chalk.blue(line) :
        line.startsWith("@@") ? chalk.yellow(line) :
        line.startsWith("+") ? chalk.green(line) :
        line.startsWith("-") ? chalk.red(line) :
        line);
    return patchLines.join("\n");
}
exports.createPatch = createPatch;
