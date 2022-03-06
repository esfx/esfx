const { YamlDocumenter } = require("@microsoft/api-documenter/lib/documenters/YamlDocumenter");
const { DeclarationReference } = require('@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference');

/** @type {WeakMap<YamlDocumenter, Set<string>>} */
const weakKnownAliases = new WeakMap();

/**
 *
 * @param {import("@microsoft/api-documenter/lib/yaml/IYamlApiFile").IYamlItem} yamlItem
 */
YamlDocumenter.prototype.onCustomizeYamlItem = function (yamlItem) {
    if (!yamlItem.uid) return;
    let knownAliases = weakKnownAliases.get(this);
    if (!knownAliases) weakKnownAliases.set(this, knownAliases = new Set());
    const uid = DeclarationReference.parse(yamlItem.uid);
    if (uid.isEmpty) return;
    if (!uid.symbol) {
        if (uid.source.scopeName === "@esfx") {
            tryRecordAlias(uid.source.unscopedPackageName);
        }
        return;
    }
    switch (uid.symbol.meaning) {
        case "function":
        case "constructor":
        case "call":
        case "new":
            if (uid.symbol.overloadIndex === 1) {
                tryRecordAlias(uid.withSymbol(uid.symbol.withOverloadIndex(undefined)).toString());
                tryRecordAlias(uid.withSymbol(uid.symbol.withOverloadIndex(undefined).withMeaning(undefined)).toString());
            }
            break;
        case "class":
        case "interface":
        case "type":
        case "enum":
        case "namespace":
        case "var":
            tryRecordAlias(uid.withSymbol(uid.symbol.withMeaning(undefined)).toString());
            break;
    }

    function tryRecordAlias(alias) {
        if (knownAliases.has(alias)) return;
        knownAliases.add(alias);
        yamlItem.alias ??= [];
        yamlItem.alias.push(alias);
    }
};