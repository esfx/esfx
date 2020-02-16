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

function mixin(base, ...args) {
    return args.reduceRight((c, f) => f(c), base);
}

/** @type {{
 <T extends YamlDocumenterConstructor, A extends YamlDocumenterConstructor, B extends YamlDocumenterConstructor, C extends YamlDocumenterConstructor, D extends YamlDocumenterConstructor>(base: T, ...args: [(t: T) => A, (a: A) => B, (b: B) => C, (c: C) => D]): D;
 <T extends YamlDocumenterConstructor, A extends YamlDocumenterConstructor, B extends YamlDocumenterConstructor, C extends YamlDocumenterConstructor>(base: T, ...args: [(t: T) => A, (a: A) => B, (b: B) => C]): C;
 <T extends YamlDocumenterConstructor, A extends YamlDocumenterConstructor, B extends YamlDocumenterConstructor>(base: T, ...args: [(t: T) => A, (a: A) => B]): B;
 <T extends YamlDocumenterConstructor, A extends YamlDocumenterConstructor>(base: T, ...args: [(t: T) => A]): A;
 <T extends YamlDocumenterConstructor, A extends ((t: T) => T)[]>(base: T, ...args: A): T;
}} */
exports.mixin = mixin;