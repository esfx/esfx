// @ts-check
const { ModelReferenceResolver } = require("@microsoft/api-extractor-model/lib/model/ModelReferenceResolver");
const { ApiItemContainerMixin } = require("@microsoft/api-extractor-model/lib/mixins/ApiItemContainerMixin");
const { ApiItemKind } = require("@microsoft/api-extractor-model/lib/items/ApiItem");
const { ApiDeclaredItem } = require("@microsoft/api-extractor-model/lib/items/ApiDeclaredItem");
const { ApiModel } = require("@microsoft/api-extractor-model/lib/model/ApiModel");
const { BetaOrLegacyDocDeclarationReference } = require("../tsdoc/betaOrLegacyDocDeclarationReference");
const { DeclarationReference, ComponentNavigation, ComponentReference, ComponentString, SymbolReference } = require("@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference");
const { meaningToSelector, isGlobal, getPackageName, getImportPath, getMemberReferences } = require("../utils/declarationReferenceUtils");

/** @typedef {import("@microsoft/api-extractor-model/lib/model/ApiPackage").ApiPackage} ApiPackage */
/** @typedef {import("@microsoft/api-extractor-model/lib/model/ApiClass").ApiClass} ApiClass */
/** @typedef {import("@microsoft/api-extractor-model/lib/model/ApiNamespace").ApiNamespace} ApiNamespace */
/** @typedef {import("@microsoft/api-extractor-model/lib/items/ApiItem").ApiItem} ApiItem */
/** @typedef {import("@microsoft/api-extractor-model/lib/model/ModelReferenceResolver").IResolveDeclarationReferenceResult} IResolveDeclarationReferenceResult */
/** @typedef {ApiItem & ApiItemContainerMixin} ApiItemContainer */

/**
 * @param {import("@microsoft/tsdoc").DocDeclarationReference | DeclarationReference} declarationReference
 * @param {ApiItem | undefined} contextApiItem
 */
ModelReferenceResolver.prototype.resolve = resolveAmbiguousReference;

/**
 * @this {ApiModel}
 * @param {import("@microsoft/tsdoc").DocDeclarationReference | DeclarationReference} declarationReference
 * @param {ApiItem | undefined} contextApiItem
 */
function resolveAmbiguousReference(declarationReference, contextApiItem) {
    /** @type {IResolveDeclarationReferenceResult} */
    const result = {
        resolvedApiItem: undefined,
        errorMessage: undefined
    };

    if (isGlobal(declarationReference)) {
        result.errorMessage = `Cannot resolve a global source.`;
        return result;
    }

    const packageName = getPackageName(declarationReference);

    // Is this an absolute reference?
    if (packageName !== undefined) {
        // @ts-ignore
        const apiPackage = this._apiModel.tryGetPackageByName(packageName);
        if (apiPackage === undefined) {
            result.errorMessage = `The package "${packageName}" could not be located`;
            return result;
        }
        return resolveForPackage.call(this, declarationReference, apiPackage);
    }

    /** @type {import("@microsoft/api-extractor-model/lib/model/ApiPackage").ApiPackage | undefined} */
    let apiPackage = undefined;

    // If the package name is omitted, try to infer it from the context
    if (contextApiItem !== undefined) {
        // try to infer from local context by walking up the AST
        let currentApiItem = contextApiItem;
        while (currentApiItem) {
            const result = resolveForItems.call(this, declarationReference, new Set([currentApiItem]));
            if (result.errorMessage === undefined) {
                return result;
            }
            currentApiItem = currentApiItem.parent;
        }

        apiPackage = contextApiItem.getAssociatedPackage();
    }

    if (apiPackage === undefined) {
        result.errorMessage =
            `The reference does not include a package name, and the package could not be inferred` +
                ` from the context`;
        return result;
    }

    const importPath = getImportPath(declarationReference) || '';

    // First, try to resolve using the package for the context item
    /** @type {IResolveDeclarationReferenceResult} */
    const packageResult = resolveForPackage.call(this, declarationReference, apiPackage);
    if (packageResult.resolvedApiItem !== undefined || importPath !== '') {
        return packageResult;
    }

    // Next, try to resolve from the packages of any types in the item (as they likely come from imports)
    // starting with the nearest top-level declaration
    switch (contextApiItem.kind) {
        case ApiItemKind.Constructor:
        case ApiItemKind.EnumMember:
        case ApiItemKind.Method:
        case ApiItemKind.Property:
        case ApiItemKind.CallSignature:
        case ApiItemKind.ConstructSignature:
        case ApiItemKind.IndexSignature:
        case ApiItemKind.MethodSignature:
        case ApiItemKind.PropertySignature:
            contextApiItem = contextApiItem.parent;
            break;
    }

    /** @type {Map<string, ApiPackage | undefined>} */
    const packages = new Map();
    packages.set(apiPackage.name, undefined);
    // @ts-ignore
    collectReferencedPackagesOfItem(contextApiItem, this._apiModel, packages);

    // try to find the item amongst the collected packages
    /** @type {IResolveDeclarationReferenceResult[]} */
    const referencedResults = [];
    for (const referencedApiPackage of packages.values()) {
        if (referencedApiPackage === undefined) {
            continue;
        }

        /** @type {IResolveDeclarationReferenceResult} */
        const referencedResult = resolveForPackage.call(this, declarationReference, referencedApiPackage);
        if (referencedResult.resolvedApiItem !== undefined) {
            referencedResults.push(referencedResult);
        }
    }

    // if we found no matches in referenced projects, fall back to this project's result error.
    if (referencedResults.length === 0) {
        return packageResult;
    }

    // if we found exactly one match, return it.
    if (referencedResults.length === 1) {
        return referencedResults[0];
    }

    // otherwise, there were multiple ambiguous matches
    result.errorMessage = `The member reference could not be found`;
    return result;
}

/**
 * @param {ApiItem} item
 * @param {ApiModel} apiModel
 * @param {Map<string, ApiPackage | undefined>} packages
 */
function collectReferencedPackagesOfItem(item, apiModel, packages) {
    if (item instanceof ApiDeclaredItem) {
        for (const token of item.excerpt.tokens) {
            if (token.canonicalReference !== undefined &&
                token.canonicalReference.source !== undefined) {
                if ("packageName" in token.canonicalReference.source) {
                    const packageName = token.canonicalReference.source.packageName;
                    if (packages.has(packageName)) continue;
                    packages.set(packageName, apiModel.tryGetPackageByName(packageName));
                }
            }
        }
    }
    for (const member of item.members) {
        collectReferencedPackagesOfItem(member, apiModel, packages);
    }
}

/**
 * @param {import("@microsoft/tsdoc").DocMemberReference | import("@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference").SymbolReference} memberReference 
 */
function getMemberSymbol(memberReference) {
    return memberReference instanceof SymbolReference ? memberReference.componentPath.component instanceof ComponentReference ? memberReference.componentPath.component.reference : undefined :
        memberReference.memberSymbol.symbolReference;
}

/**
 * @param {import("@microsoft/tsdoc").DocMemberReference | import("@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference").SymbolReference} memberReference 
 */
function getMemberIdentifier(memberReference) {
    return memberReference instanceof SymbolReference ? memberReference.componentPath.component instanceof ComponentString ? memberReference.componentPath.component.text : undefined :
        memberReference.memberIdentifier.identifier;
}

/**
 * @param {import("@microsoft/tsdoc").DocMemberReference | import("@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference").SymbolReference} memberReference 
 */
function getMemberSelector(memberReference) {
    return memberReference instanceof SymbolReference ?
        meaningToSelector(memberReference.meaning, memberReference.componentPath instanceof ComponentNavigation ? memberReference.componentPath.navigation : undefined, memberReference.overloadIndex) :
        memberReference.selector;
}

/**
 * @this {ModelReferenceResolver}
 * @param {import("@microsoft/tsdoc").DocDeclarationReference | DeclarationReference} declarationReference
 * @param {import("@microsoft/api-extractor-model/lib/model/ApiPackage").ApiPackage} apiPackage
 */
function resolveForPackage(declarationReference, apiPackage) {
    /** @type {IResolveDeclarationReferenceResult} */
    const result = {
        resolvedApiItem: undefined,
        errorMessage: undefined
    };

    const importPath = getImportPath(declarationReference) || '';
    const foundEntryPoints = apiPackage.findEntryPointsByPath(importPath);
    if (foundEntryPoints.length !== 1) {
        result.errorMessage = `The import path "${importPath}" could not be resolved`;
        return result;
    }

    /** @type {ReadonlySet<ApiItem>} */
    const currentItems = new Set([foundEntryPoints[0]]);
    return resolveForItems.call(this, declarationReference, currentItems);
}

/**
 * @this {ModelReferenceResolver}
 * @param {import("@microsoft/tsdoc").DocDeclarationReference | DeclarationReference} declarationReference
 * @param {ReadonlySet<ApiItem>} currentItems
 */
function resolveForItems(declarationReference, currentItems) {
    /** @type {IResolveDeclarationReferenceResult} */
    const result = {
        resolvedApiItem: undefined,
        errorMessage: undefined
    };

    /** @type {string | undefined} */
    let lastIdentifier = undefined;
    // Now search for the member reference
    for (const memberReference of getMemberReferences(declarationReference)) {
        const memberSymbol = getMemberSymbol(memberReference);
        if (memberSymbol !== undefined) {
            result.errorMessage = `Symbols are not yet supported in declaration references`;
            return result;
        }

        const identifier = getMemberIdentifier(memberReference);
        if (identifier === undefined) {
            result.errorMessage = `Missing member identifier`;
            return result;
        }

        /** @type {Set<ApiItemContainer>} */
        const currentItemsAsContainers = new Set();
        for (const currentItem of currentItems) {
            if (!ApiItemContainerMixin.isBaseClassOf(currentItem)) {
                // For example, {@link MyClass.myMethod.X} is invalid because methods cannot contain members
                if (currentItems.size === 0 && currentItemsAsContainers.size === 0) {
                    result.errorMessage = `Unable to resolve ${JSON.stringify(identifier)} because ${currentItem.getScopedNameWithinPackage()} cannot act as a container`;
                }
            }
            else {
                currentItemsAsContainers.add(currentItem);
                result.errorMessage = undefined;
            }
        }

        // exit early if we have an error
        if (result.errorMessage !== undefined) {
            return result;
        }

        /** @type {Map<ApiItemContainer, readonly ApiItem[]>} */
        const currentItemsWithFoundMembers = new Map();
        for (const currentItem of currentItemsAsContainers) {
            const foundMembers = currentItem.findMembersByName(identifier);
            if (foundMembers.length === 0) {
                if (currentItemsWithFoundMembers.size === 0) {
                    result.errorMessage = `The member reference ${JSON.stringify(identifier)} was not found`;
                }
            }
            else {
                currentItemsWithFoundMembers.set(currentItem, foundMembers);
                result.errorMessage = undefined;
            }
        }

        // exit early if we have an error
        if (result.errorMessage !== undefined) {
            return result;
        }

        /** @type {Set<ApiItem>} */
        const nextItems = new Set();
        for (const foundMembers of currentItemsWithFoundMembers.values()) {
            const memberSelector = getMemberSelector(memberReference);
            if (memberSelector === undefined) {
                for (const member of foundMembers) {
                    nextItems.add(member);
                }
            }
            else {
                /** @type {IResolveDeclarationReferenceResult} */
                let memberSelectorResult;
                switch (memberSelector.selectorKind) {
                    case "system" /* System */:
                        // @ts-ignore
                        memberSelectorResult = this._selectUsingSystemSelector(foundMembers, memberSelector, identifier);
                        break;
                    case "index" /* Index */:
                        // @ts-ignore
                        memberSelectorResult = this._selectUsingIndexSelector(foundMembers, memberSelector, identifier);
                        break;
                    default:
                        result.errorMessage = `The selector "${memberSelector.selector}" is not a supported selector type`;
                        return result;
                }
                if (memberSelectorResult.resolvedApiItem === undefined) {
                    if (nextItems.size === 0) {
                        result.errorMessage = memberSelectorResult.errorMessage;
                    }
                }
                else {
                    nextItems.add(memberSelectorResult.resolvedApiItem);
                    result.errorMessage = undefined;
                }
            }
        }

        // exit early if we have an error
        if (result.errorMessage !== undefined) {
            return result;
        }

        if (nextItems.size === 0) {
            result.errorMessage = `The member reference ${JSON.stringify(identifier)} was not found`;
            return result;
        }

        lastIdentifier = identifier;
        currentItems = nextItems;
    }

    // exit if we have an error
    if (result.errorMessage !== undefined) {
        return result;
    }

    // TODO: assert that currentItems.size should never be zero

    const candidates = [...currentItems];
    if (candidates.length === 1) {
        result.resolvedApiItem = candidates[0];
        return result;
    }

    // Handle a possibly ambiguous match
    candidates.sort(compareApiItems);

    // Pick a preferred resolution
    result.resolvedApiItem = candidates[0];
    for (const currentItem of candidates.slice(1)) {
        const preferredItem = pickItem(result.resolvedApiItem, currentItem);
        if (preferredItem === undefined) {
            const importPath = getImportPath(declarationReference) || '';
            result.errorMessage = lastIdentifier !== undefined ?
                `The member reference ${JSON.stringify(lastIdentifier)} was ambiguous` :
                `Member references could not be resolved from import path "${importPath}"`;
            return result;
        }
        result.resolvedApiItem = preferredItem;
    }

    return result;
}

/**
 * Compute a weight for an item to be used when sorting.
 * @param {ApiItemKind} itemKind
 */
function getWeightForItemKind(itemKind) {
    switch (itemKind) {
        case ApiItemKind.None:
        default:
            return 0;

        // model
        case ApiItemKind.Model:
            return 1;

        // package
        case ApiItemKind.Package:
            return 2;

        // file
        case ApiItemKind.EntryPoint:
            return 3;

        // top-level value declarations
        case ApiItemKind.Class:
            return 4;
        case ApiItemKind.Function:
        case ApiItemKind.Variable:
            return 5;
        case ApiItemKind.Enum:
            return 6;
        case ApiItemKind.Namespace:
            return 7;

        // top-level type declarations
        case ApiItemKind.Interface:
        case ApiItemKind.TypeAlias:
            return 8;

        // value member declarations
        case ApiItemKind.Constructor:
        case ApiItemKind.EnumMember:
        case ApiItemKind.Method:
        case ApiItemKind.Property:
            return 9;

        // signatures
        case ApiItemKind.CallSignature:
        case ApiItemKind.ConstructSignature:
        case ApiItemKind.IndexSignature:
        case ApiItemKind.MethodSignature:
        case ApiItemKind.PropertySignature:
            return 10;
    }
}

/**
 * @param {ApiItem} left
 * @param {ApiItem} right
 */
function compareApiItems(left, right) {
    return getWeightForItemKind(left.kind) - getWeightForItemKind(right.kind);
}

/**
 * @param {ApiItem | undefined} left
 * @param {ApiItem | undefined} right
 */
function pickItem(left, right) {
    if (left === right || right === undefined) return left;
    if (left === undefined) return right;

    // if ambiguity in declarations of same kind, pick neither
    if (left.kind === right.kind) return undefined;

    // prefer a class over an interface that augments it
    if (left.kind === ApiItemKind.Class && right.kind === ApiItemKind.Interface) return left;
    if (right.kind === ApiItemKind.Class && left.kind === ApiItemKind.Interface) return right;

    // prefer a class over a namespace that augments it
    if (left.kind === ApiItemKind.Class && right.kind === ApiItemKind.Namespace) return left;
    if (right.kind === ApiItemKind.Class && left.kind === ApiItemKind.Namespace) return right;

    // prefer a function over a namespace that augments it
    if (left.kind === ApiItemKind.Function && right.kind === ApiItemKind.Namespace) return left;
    if (right.kind === ApiItemKind.Function && left.kind === ApiItemKind.Namespace) return right;

    // prefer an enum over a namespace that augments it
    if (left.kind === ApiItemKind.Enum && right.kind === ApiItemKind.Namespace) return left;
    if (right.kind === ApiItemKind.Enum && left.kind === ApiItemKind.Namespace) return right;

    // prefer an interface over a namespace (since you are most likely referring to the type)
    if (left.kind === ApiItemKind.Interface && right.kind === ApiItemKind.Namespace) return left;
    if (right.kind === ApiItemKind.Interface && left.kind === ApiItemKind.Namespace) return right;

    // for any other collision, pick neither
    return undefined;
}

const prevResolveDeclarationReference = ApiModel.prototype.resolveDeclarationReference;
ApiModel.prototype.resolveDeclarationReference = function (declRef, apiItem) {
    if (declRef instanceof BetaOrLegacyDocDeclarationReference && declRef.betaDeclarationReference) {
        declRef = declRef.betaDeclarationReference;
    }
    if (declRef instanceof DeclarationReference) {
        const result = prevResolveDeclarationReference.call(this, declRef, apiItem);
        if (!result.errorMessage) return result;
        return resolveAmbiguousReference.call(this["_resolver"], declRef, apiItem);
    }
    return prevResolveDeclarationReference.call(this, declRef, apiItem);
};
