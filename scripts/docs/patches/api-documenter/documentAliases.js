// @ts-check
const { YamlDocumenter } = require("@microsoft/api-documenter/lib/documenters/YamlDocumenter");
const { DeclarationReference, ComponentRoot, ModuleSource } = require('@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference');

const prev_onCustomizeYamlItem = YamlDocumenter.prototype["onCustomizeYamlItem"];

/**
 * @param {import("@microsoft/api-documenter/lib/yaml/IYamlApiFile").IYamlItem} yamlItem
 */
YamlDocumenter.prototype["onCustomizeYamlItem"] = function (yamlItem) {
    prev_onCustomizeYamlItem.call(this, yamlItem);
    if (!yamlItem.uid) return;

    const uid = DeclarationReference.parse(yamlItem.uid);
    if (uid.isEmpty) return;

    if (!uid.symbol) {
        if (uid.source instanceof ModuleSource && uid.source.scopeName === "@esfx") {
            recordAlias(uid.source.unscopedPackageName);
        }
        return;
    }

    // only add aliases for the first overload (if overloaded)
    if (uid.symbol.overloadIndex === 1 || uid.symbol.overloadIndex === undefined) {
        // given `@esfx/package!Type#foo:member(1)`:

        // @esfx/package!Type#foo:member
        recordAlias(uid
            .withOverloadIndex(undefined));

        // @esfx/package!Type#foo:1
        recordAlias(uid
            .withMeaning(undefined));

        // @esfx/package!Type#foo
        recordAlias(uid
            .withOverloadIndex(undefined)
            .withMeaning(undefined));

        // Type#foo:member(1)
        recordAlias(uid
            .withSource(undefined));

        // Type#foo:member
        recordAlias(uid
            .withSource(undefined)
            .withOverloadIndex(undefined));

        // Type#foo:1
        recordAlias(uid
            .withSource(undefined)
            .withMeaning(undefined));

        // Type#foo
        recordAlias(uid
            .withSource(undefined)
            .withOverloadIndex(undefined)
            .withMeaning(undefined));

        // foo:member(1)
        recordAlias(uid
            .withSource(undefined)
            .withComponentPath(new ComponentRoot(uid.symbol.componentPath.component)));

        // foo:member
        recordAlias(uid
            .withSource(undefined)
            .withComponentPath(new ComponentRoot(uid.symbol.componentPath.component))
            .withOverloadIndex(undefined));
        
        // foo:1
        recordAlias(uid
            .withSource(undefined)
            .withComponentPath(new ComponentRoot(uid.symbol.componentPath.component))
            .withMeaning(undefined));

        // foo
        recordAlias(uid
            .withSource(undefined)
            .withComponentPath(new ComponentRoot(uid.symbol.componentPath.component))
            .withOverloadIndex(undefined)
            .withMeaning(undefined));
    }

    /**
     * @param {DeclarationReference | string} alias
     */
    function recordAlias(alias) {
        // @ts-ignore
        const aliases = (yamlItem.alias ??= []);
        alias = alias.toString();
        if (alias !== yamlItem.uid && !aliases.includes(alias)) aliases.push(alias);
    }
};