// @ts-check
/**
 * @template T
 * @typedef {import("@microsoft/api-extractor-model/lib/mixins/Mixin").Constructor<T>} Constructor
 */
/**
 * @template T
 * @typedef {import("@microsoft/api-extractor-model/lib/mixins/Mixin").PropertiesOf<T>} PropertiesOf
 */
/**
 * @typedef {import("@microsoft/api-documenter/lib/documenters/YamlDocumenter").YamlDocumenter} YamlDocumenter
 * @typedef {Constructor<YamlDocumenter> & PropertiesOf<typeof import("@microsoft/api-documenter/lib/documenters/YamlDocumenter").YamlDocumenter>} YamlDocumenterConstructor
 */

/**
 * @template M
 * @template {<T extends YamlDocumenterConstructor>(baseClass: T) => T & (new (...args: any[]) => M)} F
 * @param {F} mixinFunction 
 * @returns {F}
 */
function defineMixin(mixinFunction) {
    return mixinFunction;
}

exports.defineMixin = defineMixin;