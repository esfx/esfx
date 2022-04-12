// @ts-check
const { DeclarationReference, ModuleSource, GlobalSource, ComponentNavigation, ComponentReference, ComponentString, SymbolReference } = require("@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference");

/**
 * @param {import("@microsoft/tsdoc").DocDeclarationReference | DeclarationReference} declRef
 */
function isGlobal(declRef) {
    return declRef instanceof DeclarationReference && declRef.source instanceof GlobalSource;
}
exports.isGlobal = isGlobal;

/**
 * @param {import("@microsoft/tsdoc").DocDeclarationReference | DeclarationReference} declRef
 */
function getPackageName(declRef) {
    return declRef instanceof DeclarationReference ?
        declRef.source instanceof ModuleSource ? declRef.source.packageName : undefined :
        declRef.packageName;
}
exports.getPackageName = getPackageName;

/**
 * @param {import("@microsoft/tsdoc").DocDeclarationReference | DeclarationReference} declRef
 */
function getImportPath(declRef) {
    return declRef instanceof DeclarationReference ?
        declRef.source instanceof ModuleSource ? declRef.source.importPath : undefined :
        declRef.importPath;
}
exports.getImportPath = getImportPath;

/**
 * @param {import("@microsoft/tsdoc").DocDeclarationReference | DeclarationReference} declRef
 */
function * getMemberReferences(declRef) {
    if (declRef instanceof DeclarationReference) {
        if (!declRef.symbol) return;
        let componentPath = declRef.symbol.componentPath;
        let meaning = declRef.symbol.meaning;
        let overloadIndex = declRef.symbol.overloadIndex;
        const components = [];
        while (componentPath instanceof ComponentNavigation) {
            const symbol = new SymbolReference(componentPath, { meaning, overloadIndex });
            components.unshift(symbol);
            overloadIndex = undefined;
            switch (meaning) {
                case "class":
                case "interface":
                case "type":
                case "enum":
                case "namespace":
                case "function":
                case "var":
                    meaning = /** @type {typeof meaning} */("namespace");
                    break;
                case "constructor":
                    meaning = /** @type {typeof meaning} */("class");
                    break;
                case "member":
                case "event":
                    if (componentPath.navigation === ".") {
                        meaning = /** @type {typeof meaning} */("class");
                    }
                    else {
                        meaning = /** @type {typeof meaning} */("interface");
                    }
                    break;
                case "call":
                case "new":
                case "index":
                    meaning = /** @type {typeof meaning} */("interface");
                    break;
                case "complex":
                    meaning = /** @type {typeof meaning} */("type");
                    break;
            }
            componentPath = componentPath.parent;
        }
        const symbol = new SymbolReference(componentPath, { meaning, overloadIndex });
        components.unshift(symbol);
        yield* components;
    }
    else {
        yield* declRef.memberReferences;
    }
}
exports.getMemberReferences = getMemberReferences;

/**
 * @param {import("@microsoft/tsdoc").DocMemberReference | import("@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference").SymbolReference} memberReference 
 */
function getMemberSymbol(memberReference) {
    return memberReference instanceof SymbolReference ? memberReference.componentPath.component instanceof ComponentReference ? memberReference.componentPath.component.reference : undefined :
        memberReference.memberSymbol?.symbolReference;
}
exports.getMemberSymbol = getMemberSymbol;

/**
 * @param {import("@microsoft/tsdoc").DocMemberReference | import("@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference").SymbolReference} memberReference 
 */
function getMemberIdentifier(memberReference) {
    return memberReference instanceof SymbolReference ? memberReference.componentPath.component instanceof ComponentString ? memberReference.componentPath.component.text : undefined :
        memberReference.memberIdentifier?.identifier;
}
exports.getMemberIdentifier = getMemberIdentifier;

/**
 * @param {import("@microsoft/tsdoc").DocMemberReference | import("@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference").SymbolReference} memberReference 
 */
function getMemberSelector(memberReference) {
    return memberReference instanceof SymbolReference ?
        meaningToSelector(memberReference.meaning, memberReference.componentPath instanceof ComponentNavigation ? memberReference.componentPath.navigation : undefined, memberReference.overloadIndex) :
        memberReference.selector;
}
exports.getMemberSelector = getMemberSelector;

/**
 * @param {import("@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference").Meaning | undefined} meaning
 * @param {import("@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference").Navigation | undefined} navigation
 * @param {number | undefined} overloadIndex
 */
function meaningToSelector(meaning, navigation, overloadIndex) {
    if (overloadIndex !== undefined) return { selector: overloadIndex.toString(), selectorKind: "index" };
    switch (meaning) {
        case "class":
        case "interface":
        case "namespace":
        case "type":
        case "function":
        case "enum":
        case "constructor":
            return { selector: meaning, selectorKind: "system" };
        case "var":
            return { selector: "variable", selectorKind: "system" };
        case "member":
        case "event":
            switch (navigation) {
                case ".": return { selector: "static", selectorKind: "system" };
                case "#": return { selector: "instance", selectorKind: "system" };
            }
            break;
    }
}
exports.meaningToSelector = meaningToSelector;