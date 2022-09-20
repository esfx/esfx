// @ts-check
const { Stats } = require("fs");

/**
 * @type {<T, A extends any[], R>(f: (this: T, ...args: A) => R) => (this_: T, ...args: A) => R}
 */
const uncurryThis = Function.prototype.bind.bind(Function.prototype.call);
module.exports = {
    uncurryThis,

    Object,
    ObjectKeys: Object.keys,
    ObjectValues: Object.values,
    ObjectEntries: Object.entries,
    ObjectGetOwnPropertyNames: Object.getOwnPropertyNames,
    ObjectGetOwnPropertyDescriptor: Object.getOwnPropertyDescriptor,
    ObjectIsExtensible: Object.isExtensible,
    ObjectPrototypeHasOwnProperty: /** @type {(this_: Object, ...args: Parameters<Object["hasOwnProperty"]>) => ReturnType<Object["hasOwnProperty"]>} */(uncurryThis(Object.prototype.hasOwnProperty)),
    ObjectPrototypeToString: /** @type {(this_: Object, ...args: Parameters<Object["toString"]>) => ReturnType<Object["toString"]>} */(uncurryThis(Object.prototype.toString)),

    Array,
    ArrayFrom: Array.from,
    ArrayIsArray: Array.isArray,
    ArrayPrototypePush: /** @type {<T>(this_: T[], ...args: Parameters<T[]["push"]>) => ReturnType<T[]["push"]>} */(uncurryThis(Array.prototype.push)),
    ArrayPrototypeIndexOf: /** @type {<T>(this_: T[], ...args: Parameters<T[]["indexOf"]>) => ReturnType<T[]["indexOf"]>} */(uncurryThis(Array.prototype.indexOf)),
    ArrayPrototypeSlice: /** @type {<T>(this_: T[], ...args: Parameters<T[]["slice"]>) => ReturnType<T[]["slice"]>} */(uncurryThis(Array.prototype.slice)),
    ArrayPrototypeSort: /** @type {<T>(this_: T[], ...args: Parameters<T[]["sort"]>) => ReturnType<T[]["sort"]>} */(uncurryThis(Array.prototype.sort)),
    ArrayPrototypeFilter: /** @type {<T>(this_: T[], ...args: Parameters<T[]["filter"]>) => ReturnType<T[]["filter"]>} */(uncurryThis(Array.prototype.filter)),

    String,
    StringPrototypeStartsWith: /** @type {(this_: String, ...args: Parameters<String["startsWith"]>) => ReturnType<String["startsWith"]>} */(uncurryThis(String.prototype.startsWith)),
    StringPrototypeEndsWith: /** @type {(this_: String, ...args: Parameters<String["endsWith"]>) => ReturnType<String["endsWith"]>} */(uncurryThis(String.prototype.endsWith)),
    StringPrototypeSlice: /** @type {(this_: String, ...args: Parameters<String["slice"]>) => ReturnType<String["slice"]>} */(uncurryThis(String.prototype.slice)),
    StringPrototypeSubstr: /** @type {(this_: String, ...args: Parameters<String["substr"]>) => ReturnType<String["substr"]>} */(uncurryThis(String.prototype.substr)),
    StringPrototypeReplace: /** @type {(this_: String, searchValue: string | RegExp, replace: string) => string} */(/** @type {*} */(uncurryThis(String.prototype.replace))),
    StringPrototypeLastIndexOf: /** @type {(this_: String, ...args: Parameters<String["lastIndexOf"]>) => ReturnType<String["lastIndexOf"]>} */(uncurryThis(String.prototype.lastIndexOf)),

    RegExp,
    RegExpPrototypeExec: /** @type {(this_: RegExp, ...args: Parameters<RegExp["exec"]>) => ReturnType<RegExp["exec"]>} */(uncurryThis(RegExp.prototype.exec)),
    RegExpPrototypeTest: /** @type {(this_: RegExp, ...args: Parameters<RegExp["test"]>) => ReturnType<RegExp["test"]>} */(uncurryThis(RegExp.prototype.test)),

    Map,
    MapPrototypeGet: /** @type {<K, V>(this_: Map<K, V>, ...args: Parameters<Map<K, V>["get"]>) => ReturnType<Map<K, V>["get"]>} */(uncurryThis(Map.prototype.get)),
    MapPrototypeSet: /** @type {<K, V>(this_: Map<K, V>, ...args: Parameters<Map<K, V>["set"]>) => ReturnType<Map<K, V>["set"]>} */(uncurryThis(Map.prototype.set)),
    MapPrototypeHas: /** @type {<K, V>(this_: Map<K, V>, ...args: Parameters<Map<K, V>["has"]>) => ReturnType<Map<K, V>["has"]>} */(uncurryThis(Map.prototype.has)),
    MapPrototypeClear: /** @type {<K, V>(this_: Map<K, V>, ...args: Parameters<Map<K, V>["clear"]>) => ReturnType<Map<K, V>["clear"]>} */(uncurryThis(Map.prototype.clear)),

    Set,
    SetPrototypeAdd: /** @type {<T>(this_: Set<T>, ...args: Parameters<Set<T>["add"]>) => ReturnType<Set<T>["add"]>} */(uncurryThis(Set.prototype.add)),
    SetPrototypeHas: /** @type {<T>(this_: Set<T>, ...args: Parameters<Set<T>["has"]>) => ReturnType<Set<T>["has"]>} */(uncurryThis(Set.prototype.has)),

    Stats,
    StatsPrototypeIsFile: /** @type {<T>(this_: Stats, ...args: Parameters<Stats["isFile"]>) => ReturnType<Stats["isFile"]>} */(uncurryThis(Stats.prototype.isFile)),
    StatsPrototypeIsFIFO: /** @type {<T>(this_: Stats, ...args: Parameters<Stats["isFIFO"]>) => ReturnType<Stats["isFIFO"]>} */(uncurryThis(Stats.prototype.isFIFO)),
    StatsPrototypeIsDirectory: /** @type {<T>(this_: Stats, ...args: Parameters<Stats["isDirectory"]>) => ReturnType<Stats["isDirectory"]>} */(uncurryThis(Stats.prototype.isDirectory)),

    Error,
    ErrorCaptureStackTrace: Error.captureStackTrace,

    TypeError,

    JSONParse: JSON.parse,
    JSONStringify: JSON.stringify,
};
