// @ts-check
const ts = require("typescript");
const { DocCommentEnhancer } = require("@microsoft/api-extractor/lib/enhancers/DocCommentEnhancer");
const { DocLinkTag } = require("@microsoft/tsdoc");
const { AstReferenceResolver, ResolverFailure } = require("@microsoft/api-extractor/lib/analyzer/AstReferenceResolver");
const { AstDeclaration } = require("@microsoft/api-extractor/lib/analyzer/AstDeclaration");
const { AstModule } = require("@microsoft/api-extractor/lib/analyzer/AstModule");
const { AstSymbol } = require("@microsoft/api-extractor/lib/analyzer/AstSymbol");
const { DeclarationReference } = require("@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference");
const { isGlobal, getPackageName, getImportPath, getMemberReferences, getMemberSymbol, getMemberIdentifier, getMemberSelector } = require("../utils/declarationReferenceUtils");

DocCommentEnhancer.prototype["_checkForBrokenLinksRecursive"] = function (astDeclaration, node) {
    if (node instanceof DocLinkTag) {
        if (node.codeDestination) {
            // Is it referring to the working package?  If not, we don't do any link validation, because
            // AstReferenceResolver doesn't support it yet (but ModelReferenceResolver does of course).
            // Tracked by:  https://github.com/microsoft/rushstack/issues/1195
            if (node.codeDestination.packageName === undefined ||
                node.codeDestination.packageName === this["_collector"].workingPackage.name) {
                const referencedAstDeclaration = this["_collector"].astReferenceResolver.resolve(node.codeDestination, astDeclaration);
                if (referencedAstDeclaration instanceof ResolverFailure) {
                    this["_collector"].messageRouter.addAnalyzerIssue("ae-unresolved-link" /* UnresolvedLink */, 'The @link reference could not be resolved: ' + referencedAstDeclaration.reason, astDeclaration);
                }
            }
        }
    }
    for (const childNode of node.getChildNodes()) {
        this["_checkForBrokenLinksRecursive"](astDeclaration, childNode);
    }
};

DocCommentEnhancer.prototype["_applyInheritDoc"] = function (astDeclaration, docComment, inheritDocTag) {
    if (!inheritDocTag.declarationReference) {
        this["_collector"].messageRouter.addAnalyzerIssue("ae-unresolved-inheritdoc-base" /* UnresolvedInheritDocBase */, 'The @inheritDoc tag needs a TSDoc declaration reference; signature matching is not supported yet', astDeclaration);
        return;
    }
    if (!(inheritDocTag.declarationReference.packageName === undefined ||
        inheritDocTag.declarationReference.packageName === this["_collector"].workingPackage.name)) {
        return;
    }
    const referencedAstDeclaration = this["_collector"].astReferenceResolver.resolve(inheritDocTag.declarationReference, astDeclaration);
    if (referencedAstDeclaration instanceof ResolverFailure) {
        this["_collector"].messageRouter.addAnalyzerIssue("ae-unresolved-inheritdoc-reference" /* UnresolvedInheritDocReference */, 'The @inheritDoc reference could not be resolved: ' + referencedAstDeclaration.reason, astDeclaration);
        return;
    }
    this["_analyzeApiItem"](referencedAstDeclaration);
    const referencedMetadata = this["_collector"].fetchApiItemMetadata(referencedAstDeclaration);
    if (referencedMetadata.tsdocComment) {
        this["_copyInheritedDocs"](docComment, referencedMetadata.tsdocComment);
    }
};

const prevResolve = AstReferenceResolver.prototype.resolve;
AstReferenceResolver.prototype.resolve = resolveAmbiguousReference;

/**
 * @this {AstReferenceResolver}
 * @param {import("@microsoft/tsdoc").DocDeclarationReference | DeclarationReference} declarationReference
 * @param {AstDeclaration} [astDeclaration]
 */
function resolveAmbiguousReference(declarationReference, astDeclaration) {
    if (!astDeclaration) return prevResolve.call(this, declarationReference);

    if (isGlobal(declarationReference)) {
        return new ResolverFailure("Cannot resolve a global source.");
    }

    const packageName = getPackageName(declarationReference);
    if (packageName !== undefined) {
        return resolveForPackage.call(this, declarationReference, this["_workingPackage"]);
    }

    if (astDeclaration !== undefined) {
        let currentAstDeclaration = astDeclaration;
        while (currentAstDeclaration) {
            const result = resolveForItems.call(this, declarationReference, new Set([currentAstDeclaration]));
            if (!(result instanceof ResolverFailure)) {
                return result;
            }
            currentAstDeclaration = currentAstDeclaration.parent;
        }
    }

    return resolveForPackage.call(this, declarationReference, this["_workingPackage"]);
}

/**
 * @this {AstReferenceResolver}
 * @param {import("@microsoft/tsdoc").DocDeclarationReference | DeclarationReference} declarationReference
 * @param {import("@microsoft/api-extractor/lib/collector/WorkingPackage").WorkingPackage} workingPackage
 */
function resolveForPackage(declarationReference, workingPackage) {
    const packageName = getPackageName(declarationReference);
    if (packageName !== undefined &&
        packageName !== workingPackage.name) {
        return new ResolverFailure('External package references are not supported');
    }

    const importPath = getImportPath(declarationReference);
    if (importPath) {
        return new ResolverFailure('Import paths are not supported');
    }

    const astModule = this["_astSymbolTable"].fetchAstModuleFromWorkingPackage(workingPackage.entryPointSourceFile);
    return resolveForItems.call(this, declarationReference, new Set([astModule]));
}

/**
 * @this {AstReferenceResolver}
 * @param {import("@microsoft/tsdoc").DocDeclarationReference | DeclarationReference} declarationReference
 * @param {ReadonlySet<AstDeclaration | AstModule>} currentItems
 */
function resolveForItems(declarationReference, currentItems) {
    /** @type {string | undefined} */
    let lastIdentifier = undefined;
    /** @type {ResolverFailure | undefined} */
    let lastFailure;
    for (const memberReference of getMemberReferences(declarationReference)) {
        if (getMemberSymbol(memberReference)) return new ResolverFailure('ECMAScript symbol selectors are not supported');

        const memberName = getMemberIdentifier(memberReference);
        if (memberName === undefined) return new ResolverFailure('The member identifier is missing in the root member reference');

        /** @type {Map<AstDeclaration | AstModule, readonly AstDeclaration[]>} */
        const currentItemsWithFoundMembers = new Map();
        for (const currentItem of currentItems) {
            let matchingChildren;
            if (currentItem instanceof AstModule) {
                const rootAstEntity = this["_astSymbolTable"].tryGetExportOfAstModule(memberName, currentItem);
                if (rootAstEntity instanceof AstSymbol) {
                    matchingChildren = rootAstEntity.astDeclarations;
                }
                else {
                    matchingChildren = [];
                }
            }
            else {
                matchingChildren = currentItem.findChildrenWithName(memberName);
            }
            if (matchingChildren.length === 0) {
                if (currentItemsWithFoundMembers.size === 0) {
                    lastFailure = currentItem instanceof AstModule ?
                        new ResolverFailure(`The package "${this["_workingPackage"].name}" does not have an export "${memberName}"`) :
                        new ResolverFailure(`No member was found with name "${memberName}"`);
                }
            }
            else {
                currentItemsWithFoundMembers.set(currentItem, matchingChildren);
                lastFailure = undefined;
            }
        }

        if (lastFailure) return lastFailure;

        /** @type {Set<AstDeclaration>} */
        const nextItems = new Set();
        for (const matchingChildren of currentItemsWithFoundMembers.values()) {
            const selector = getMemberSelector(memberReference);
            if (selector === undefined) {
                for (const member of matchingChildren) {
                    nextItems.add(member);
                }
            }
            else {
                const selectedDeclaration = this["_selectDeclaration"](matchingChildren, { selector }, memberName);
                if (selectedDeclaration instanceof ResolverFailure) {
                    if (nextItems.size === 0) {
                        lastFailure = selectedDeclaration;
                    }
                }
                else {
                    nextItems.add(selectedDeclaration);
                    lastFailure = undefined;
                }
            }
        }

        if (lastFailure) return lastFailure;
        if (nextItems.size === 0) new ResolverFailure(`No member was found with name "${memberName}"`);

        lastIdentifier = memberName;
        currentItems = nextItems;
    }

    if (lastFailure) return lastFailure;
    if (lastIdentifier === undefined) return new ResolverFailure('Package references are not supported');

    const candidates = [...currentItems];
    if (candidates.length === 1) {
        return candidates[0];
    }

    // Handle a possibly ambiguous match
    candidates.sort(compareAstDeclarations);

    // Pick a preferred resolution
    let result = candidates[0];
    for (const currentItem of candidates.slice(1)) {
        const preferredItem = pickItem(result, currentItem);
        if (preferredItem === undefined) {
            return new ResolverFailure(`No member was found with name "${lastIdentifier}"`);
        }
        result = preferredItem;
    }

    if (result instanceof AstDeclaration) return result
    return new ResolverFailure(`No member was found with name "${lastIdentifier}"`);
}

/**
 * Compute a weight for an item to be used when sorting.
 * @param {ts.SyntaxKind} itemKind
 */
function getWeightForItemKind(itemKind) {
    switch (itemKind) {
        case ts.SyntaxKind.Unknown:
        default:
            return 0;

        // file
        case ts.SyntaxKind.SourceFile:
            return 3;

        // top-level value declarations
        case ts.SyntaxKind.ClassDeclaration:
            return 4;
        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.VariableDeclaration:
            return 5;
        case ts.SyntaxKind.EnumDeclaration:
            return 6;
        case ts.SyntaxKind.ModuleDeclaration:
            return 7;

        // top-level type declarations
        case ts.SyntaxKind.InterfaceDeclaration:
        case ts.SyntaxKind.TypeAliasDeclaration:
            return 8;

        // value member declarations
        case ts.SyntaxKind.Constructor:
        case ts.SyntaxKind.EnumMember:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.PropertyDeclaration:
            return 9;

        // signatures
        case ts.SyntaxKind.CallSignature:
        case ts.SyntaxKind.ConstructSignature:
        case ts.SyntaxKind.IndexSignature:
        case ts.SyntaxKind.MethodSignature:
        case ts.SyntaxKind.PropertySignature:
            return 10;
    }
}

/**
 * @param {AstDeclaration | AstModule} left
 * @param {AstDeclaration | AstModule} right
 */
function compareAstDeclarations(left, right) {
    const leftWeight = left instanceof AstDeclaration ? getWeightForItemKind(left.declaration.kind) : 2;
    const rightWeight = right instanceof AstDeclaration ? getWeightForItemKind(right.declaration.kind) : 2;
    return leftWeight - rightWeight;
}

/**
 * @param {AstDeclaration | AstModule | undefined} left
 * @param {AstDeclaration | AstModule | undefined} right
 */
function pickItem(left, right) {
    if (left === right || right === undefined) return left;
    if (left === undefined) return right;
    if (left instanceof AstModule) return right;
    if (right instanceof AstModule) return left;

    // if ambiguity in declarations of same kind, pick neither
    if (left.declaration.kind === right.declaration.kind) return undefined;

    // prefer a class over an interface that augments it
    if (left.declaration.kind === ts.SyntaxKind.ClassDeclaration && right.declaration.kind === ts.SyntaxKind.InterfaceDeclaration) return left;
    if (right.declaration.kind === ts.SyntaxKind.ClassDeclaration && left.declaration.kind === ts.SyntaxKind.InterfaceDeclaration) return right;

    // prefer a class over a namespace that augments it
    if (left.declaration.kind === ts.SyntaxKind.ClassDeclaration && right.declaration.kind === ts.SyntaxKind.ModuleDeclaration) return left;
    if (right.declaration.kind === ts.SyntaxKind.ClassDeclaration && left.declaration.kind === ts.SyntaxKind.ModuleDeclaration) return right;

    // prefer a function over a namespace that augments it
    if (left.declaration.kind === ts.SyntaxKind.FunctionDeclaration && right.declaration.kind === ts.SyntaxKind.ModuleDeclaration) return left;
    if (right.declaration.kind === ts.SyntaxKind.FunctionDeclaration && left.declaration.kind === ts.SyntaxKind.ModuleDeclaration) return right;

    // prefer an enum over a namespace that augments it
    if (left.declaration.kind === ts.SyntaxKind.EnumDeclaration && right.declaration.kind === ts.SyntaxKind.ModuleDeclaration) return left;
    if (right.declaration.kind === ts.SyntaxKind.EnumDeclaration && left.declaration.kind === ts.SyntaxKind.ModuleDeclaration) return right;

    // prefer an interface over a namespace (since you are most likely referring to the type)
    if (left.declaration.kind === ts.SyntaxKind.InterfaceDeclaration && right.declaration.kind === ts.SyntaxKind.ModuleDeclaration) return left;
    if (right.declaration.kind === ts.SyntaxKind.InterfaceDeclaration && left.declaration.kind === ts.SyntaxKind.ModuleDeclaration) return right;

    // for any other collision, pick neither
    return undefined;
}

