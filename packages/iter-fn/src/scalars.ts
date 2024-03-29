/*!
   Copyright 2019 Ron Buckton

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import /*#__INLINE__*/ { isFunction, isInteger, isIterableObject, isNumber, isObject, isPositiveInteger, isUndefined } from "@esfx/internal-guards";
import { IndexedCollection } from '@esfx/collection-core';
import { HashMap } from "@esfx/collections-hashmap";
import { HashSet } from "@esfx/collections-hashset";
import { Comparer, Comparison, Equaler, EqualityComparison } from "@esfx/equatable";
import { identity, T } from '@esfx/fn';
import { Index } from "@esfx/interval";
import { HierarchyIterable } from '@esfx/iter-hierarchy';
import { Lookup } from "@esfx/iter-lookup";
import { createGroupings, flowHierarchy } from './internal/utils.js';
import { consume, ConsumeOptions, empty } from './queries.js';
import { prepend, takeRight } from './subqueries.js';

/**
 * Computes a scalar value by applying an accumulator callback over each element.
 *
 * @param source An `Iterable` object.
 * @param accumulator the callback used to compute the result.
 * @category Scalar
 */
export function reduce<T>(source: Iterable<T>, accumulator: (current: T, element: T, offset: number) => T): T;
/**
 * Computes a scalar value by applying an accumulator callback over each element.
 *
 * @param source An `Iterable` object.
 * @param accumulator the callback used to compute the result.
 * @param seed An optional seed value.
 * @category Scalar
 */
export function reduce<T, U>(source: Iterable<T>, accumulator: (current: U, element: T, offset: number) => U, seed: U, resultSelector?: (result: U, count: number) => U): U;
/**
 * Computes a scalar value by applying an accumulator callback over each element.
 *
 * @param source An `Iterable` object.
 * @param accumulator the callback used to compute the result.
 * @param seed An optional seed value.
 * @param resultSelector An optional callback used to compute the final result.
 * @category Scalar
 */
export function reduce<T, U, R>(source: Iterable<T>, accumulator: (current: U, element: T, offset: number) => U, seed: U, resultSelector: (result: U, count: number) => R): R;
export function reduce<T>(source: Iterable<T>, accumulator: (current: T, element: T, offset: number) => T, seed?: T, resultSelector: (result: T, count: number) => T = identity): T {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(accumulator)) throw new TypeError("Function expected: accumulator");
    if (!isFunction(resultSelector)) throw new TypeError("Function expected: resultSelector");
    let hasCurrent = arguments.length > 2;
    let current = seed;
    let count = 0;
    for (const value of source) {
        if (!hasCurrent) {
            hasCurrent = true;
            current = value;
        }
        else {
            current = accumulator(current!, value, count);
        }
        count++;
    }
    return resultSelector(current!, count);
}

/**
 * Computes a scalar value by applying an accumulator callback over each element in reverse.
 *
 * @param source An `Iterable` object.
 * @param accumulator the callback used to compute the result.
 * @category Scalar
 */
export function reduceRight<T>(source: Iterable<T>, accumulator: (current: T, element: T, offset: number) => T): T;
/**
 * Computes a scalar value by applying an accumulator callback over each element in reverse.
 *
 * @param source An `Iterable` object.
 * @param accumulator the callback used to compute the result.
 * @param seed An optional seed value.
 * @category Scalar
 */
export function reduceRight<T, U>(source: Iterable<T>, accumulator: (current: U, element: T, offset: number) => U, seed: U, resultSelector?: (result: U, count: number) => U): U;
/**
 * Computes a scalar value by applying an accumulator callback over each element in reverse.
 *
 * @param source An `Iterable` object.
 * @param accumulator the callback used to compute the result.
 * @param seed An optional seed value.
 * @param resultSelector An optional callback used to compute the final result.
 * @category Scalar
 */
export function reduceRight<T, U, R>(source: Iterable<T>, accumulator: (current: U, element: T, offset: number) => U, seed: U, resultSelector: (result: U, count: number) => R): R;
export function reduceRight<T>(source: Iterable<T>, accumulator: (current: T, element: T, offset: number) => T, seed?: T, resultSelector: (result: T, count: number) => T = identity): T {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(accumulator)) throw new TypeError("Function expected: accumulator");
    if (!isFunction(resultSelector)) throw new TypeError("Function expected: resultSelector");
    const sourceArray = toArray<T>(source);
    let hasCurrent = arguments.length > 2;
    let current = seed;
    let count = 0;
    for (let offset = sourceArray.length - 1; offset >= 0; offset--) {
        const value = sourceArray[offset];
        if (!hasCurrent) {
            current = value;
            hasCurrent = true;
        }
        else {
            current = accumulator(current!, value, offset);
        }
        count++;
    }
    return resultSelector(current!, count);
}

/**
 * Counts the number of elements, optionally filtering elements using the supplied callback.
 *
 * @param source An `Iterable` object.
 * @param predicate An optional callback used to match each element.
 * @category Scalar
 */
export function count<T>(source: Iterable<T>, predicate: (element: T) => boolean = T): number {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");

    if (predicate === T) {
        if (Array.isArray(source)) return source.length;
        if (source instanceof Set || source instanceof Map) return source.size;
    }

    let count = 0;
    for (const element of source) {
        if (predicate(element)) {
            count++;
        }
    }

    return count;
}

/**
 * Gets the first element, optionally filtering elements using the supplied callback.
 *
 * @param source An `Iterable` object.
 * @param predicate An optional callback used to match each element.
 * @category Scalar
 */
export function first<T, U extends T>(source: Iterable<T>, predicate: (element: T) => element is U): U | undefined;
/**
 * Gets the first element, optionally filtering elements using the supplied callback.
 *
 * @param source An `Iterable` object.
 * @param predicate An optional callback used to match each element.
 * @category Scalar
 */
export function first<T>(source: Iterable<T>, predicate?: (element: T) => boolean): T | undefined;
export function first<T>(source: Iterable<T>, predicate: (element: T) => boolean = T): T | undefined {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    for (const element of source) {
        if (predicate(element)) {
            return element;
        }
    }
    return undefined;
}

/**
 * Gets the last element of a `Iterable`, optionally filtering elements using the supplied
 * callback.
 *
 * @param source An `Iterable` object.
 * @param predicate An optional callback used to match each element.
 * @category Scalar
 */
export function last<T, U extends T>(source: Iterable<T>, predicate: (element: T) => element is U): U | undefined;
/**
 * Gets the last element of a `Iterable`, optionally filtering elements using the supplied
 * callback.
 *
 * @param source An `Iterable` object.
 * @param predicate An optional callback used to match each element.
 * @category Scalar
 */
export function last<T>(source: Iterable<T>, predicate?: (element: T) => boolean): T | undefined;
export function last<T>(source: Iterable<T>, predicate: (element: T) => boolean = T): T | undefined {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    let result: T | undefined;
    for (const element of source) {
        if (predicate(element)) {
            result = element;
        }
    }
    return result;
}

/**
 * Gets the only element, or returns `undefined`.
 *
 * @param source An `Iterable` object.
 * @param predicate An optional callback used to match each element.
 * @category Scalar
 */
export function single<T, U extends T>(source: Iterable<T>, predicate: (element: T) => element is U): U | undefined;
/**
 * Gets the only element, or returns `undefined`.
 *
 * @param source An `Iterable` object.
 * @param predicate An optional callback used to match each element.
 * @category Scalar
 */
export function single<T>(source: Iterable<T>, predicate?: (element: T) => boolean): T | undefined;
export function single<T>(source: Iterable<T>, predicate: (element: T) => boolean = T) {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    let hasResult = false;
    let result: T | undefined;
    for (const element of source) {
        if (predicate(element)) {
            if (hasResult) {
                return undefined;
            }
            hasResult = true;
            result = element;
        }
    }
    return hasResult ? result : undefined;
}

/**
 * Gets the minimum element of a `Iterable`, optionally comparing the keys of each element using the supplied callback.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to choose the key to compare.
 * @param keyComparer An optional callback used to compare the keys.
 * @category Scalar
 */
export function minBy<T, K>(source: Iterable<T>, keySelector: (value: T) => K, keyComparer: Comparison<K> | Comparer<K> = Comparer.defaultComparer): T | undefined {
    if (isFunction(keyComparer)) keyComparer = Comparer.create(keyComparer);
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!Comparer.hasInstance(keyComparer)) throw new TypeError("Comparer expected: keyComparer");
    let hasResult = false;
    let result: T | undefined;
    let resultKey: K | undefined;
    for (const element of source) {
        const key = keySelector(element);
        if (!hasResult) {
            result = element;
            resultKey = key;
            hasResult = true;
        }
        else if (keyComparer.compare(key, resultKey!) < 0) {
            result = element;
            resultKey = key;
        }
    }
    return result;
}

/**
 * Gets the minimum element of a `Iterable`, optionally comparing elements using the supplied callback.
 *
 * @param source An `Iterable` object.
 * @param comparer An optional callback used to compare two elements.
 * @category Scalar
 */
export function min<T>(source: Iterable<T>, comparer: Comparison<T> | Comparer<T> = Comparer.defaultComparer): T | undefined {
    if (isFunction(comparer)) comparer = Comparer.create(comparer);
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!Comparer.hasInstance(comparer)) throw new TypeError("Comparer expected: comparer");
    return minBy(source, identity, comparer);
}

/**
 * Gets the maximum element of a `Iterable`, optionally comparing the keys of each element using the supplied callback.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to choose the key to compare.
 * @param keyComparer An optional callback used to compare the keys.
 * @category Scalar
 */
export function maxBy<T, K>(source: Iterable<T>, keySelector: (value: T) => K, keyComparer: Comparison<K> | Comparer<K> = Comparer.defaultComparer): T | undefined {
    if (isFunction(keyComparer)) keyComparer = Comparer.create(keyComparer);
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!Comparer.hasInstance(keyComparer)) throw new TypeError("Comparer expected: keyComparer");
    let hasResult = false;
    let result: T | undefined;
    let resultKey: K | undefined;
    for (const element of source) {
        const key = keySelector(element);
        if (!hasResult) {
            result = element;
            resultKey = key;
            hasResult = true;
        }
        else if (keyComparer.compare(key, resultKey!) > 0) {
            result = element;
            resultKey = key;
        }
    }
    return result;
}

/**
 * Gets the maximum element of a `Iterable`, optionally comparing elements using the supplied callback.
 *
 * @param source An `Iterable` object.
 * @param comparer An optional callback used to compare two elements.
 * @category Scalar
 */
export function max<T>(source: Iterable<T>, comparer: Comparison<T> | Comparer<T> = Comparer.defaultComparer): T | undefined {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (isFunction(comparer)) comparer = Comparer.create(comparer);
    if (!Comparer.hasInstance(comparer)) throw new TypeError("Comparer expected: comparer");
    return maxBy(source, identity, comparer);
}

/**
 * Computes a scalar value indicating whether `source` contains any elements,
 * optionally filtering the elements using the supplied callback.
 *
 * @param source An `Iterable` object.
 * @param predicate An optional callback used to match each element.
 * @category Scalar
 */
export function some<T>(source: Iterable<T>, predicate: (element: T) => boolean = T): boolean {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    for (const element of source) {
        if (predicate(element)) {
            return true;
        }
    }
    return false;
}

/**
 * Computes a scalar value indicating whether all elements match the supplied callback.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Scalar
 */
export function every<T, U extends T>(source: Iterable<T>, predicate: (element: T) => element is U): source is Iterable<U>;
/**
 * Computes a scalar value indicating whether all elements match the supplied callback.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Scalar
 */
export function every<T>(source: Iterable<T>, predicate: (element: T) => boolean): boolean;
export function every<T>(source: Iterable<T>, predicate: (element: T) => boolean): boolean {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    let hasMatchingElements = false;
    for (const element of source) {
        if (!predicate(element)) {
            return false;
        }
        hasMatchingElements = true;
    }
    return hasMatchingElements;
}

/**
 * Unzips a sequence of tuples into a tuple of sequences.
 * @param source A `Iterable`
 * @category Scalar
 */
export function unzip<T extends readonly any[] | []>(source: Iterable<T>): { [I in keyof T]: T[I][]; };
/**
 * Unzips a sequence of tuples into a tuple of sequences.
 * @param source A `Iterable`
 * @param partSelector A callback that converts a result into a tuple.
 * @category Scalar
 */
export function unzip<T, U extends readonly any[] | []>(source: Iterable<T>, partSelector: (value: T) => U): { [I in keyof U]: U[I][]; };
export function unzip<T extends readonly any[] | []>(source: Iterable<T>, partSelector: (value: T) => T = identity): any {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(partSelector)) throw new TypeError("Function expected: partSelector");
    const result: any[][] = [];
    let length = -1;
    for (const element of source) {
        const row = partSelector(element);
        if (length === -1) {
            length = row.length;
            for (let i = 0; i < length; i++) {
                result.push([]);
            }
        }
        for (let i = 0; i < length; i++) {
            result[i].push(row[i]);
        }
    }
    return result;
}

/**
 * Invokes a callback for each element of `source`.
 *
 * @param source An `Iterable` object.
 * @param callback The callback to invoke.
 * @category Scalar
 */
export function forEach<T>(source: Iterable<T>, callback: (element: T, offset: number) => void): void {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(callback)) throw new TypeError("Function expected: callback");
    let offset = 0;
    for (const element of source) {
        callback(element, offset++);
    }
}

/**
 * Creates a Map for the elements of the Query.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select a key for each element.
 * @category Scalar
 */
export function toMap<T, K>(source: Iterable<T>, keySelector: (element: T) => K): Map<K, T>;
/**
 * Creates a Map for the elements of the Query.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select a key for each element.
 * @param elementSelector A callback that selects a value for each element.
 * @category Scalar
 */
export function toMap<T, K, V>(source: Iterable<T>, keySelector: (element: T) => K, elementSelector: (element: T) => V): Map<K, V>;
export function toMap<T, K, V>(source: Iterable<T>, keySelector: (element: T) => K, elementSelector: (element: T) => T | V = identity) {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    const map = new Map<K, T | V>();
    for (const item of source) {
        const key = keySelector(item);
        const element = elementSelector(item);
        map.set(key, element);
    }
    return map;
}

/**
 * Creates a HashMap for the elements of the Query.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select a key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Scalar
 */
export function toHashMap<T, K>(source: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): HashMap<K, T>;
/**
 * Creates a Map for the elements of the Query.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select a key for each element.
 * @param elementSelector A callback that selects a value for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Scalar
 */
export function toHashMap<T, K, V>(source: Iterable<T>, keySelector: (element: T) => K, elementSelector: (element: T) => V, keyEqualer?: Equaler<K>): HashMap<K, V>;
export function toHashMap<T, K, V>(source: Iterable<T>, keySelector: (element: T) => K, elementSelector: ((element: T) => T | V) | Equaler<K> = identity, keyEqualer?: Equaler<K>) {
    if (typeof elementSelector === "object") {
        keyEqualer = elementSelector;
        elementSelector = identity;
    }
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    if (!isUndefined(keyEqualer) && !Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: keyEqualer");
    const map = new HashMap<K, T | V>(keyEqualer);
    for (const item of source) {
        const key = keySelector(item);
        const element = elementSelector(item);
        map.set(key, element);
    }
    return map;
}

/**
 * Creates a Set for the elements of the Iterable.
 *
 * @param source An `Iterable` object.
 * @category Scalar
 */
export function toSet<T>(source: Iterable<T>): Set<T>;
/**
 * Creates a Set for the elements of the Iterable.
 *
 * @param source An `Iterable` object.
 * @param elementSelector A callback that selects a value for each element.
 * @category Scalar
 */
export function toSet<T, V>(source: Iterable<T>, elementSelector: (element: T) => V): Set<V>;
export function toSet<T, V>(source: Iterable<T>, elementSelector: (element: T) => T | V = identity) {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    const set = new Set<T | V>();
    for (const item of source) {
        const element = elementSelector(item);
        set.add(element);
    }
    return set;
}

/**
 * Creates a HashSet for the elements of the Iterable.
 *
 * @param source An `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Scalar
 */
export function toHashSet<T>(source: Iterable<T>, equaler?: Equaler<T>): HashSet<T>;
/**
 * Creates a Set for the elements of the Iterable.
 *
 * @param source An `Iterable` object.
 * @param elementSelector A callback that selects a value for each element.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Scalar
 */
export function toHashSet<T, V>(source: Iterable<T>, elementSelector: (element: T) => V, equaler?: Equaler<V>): HashSet<V>;
export function toHashSet<T>(source: Iterable<T>, elementSelector: ((element: T) => T) | Equaler<T> = identity, equaler?: Equaler<T>): HashSet<T> {
    if (typeof elementSelector !== "function") {
        equaler = elementSelector;
        elementSelector = identity;
    }
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    if (!isUndefined(equaler) && !Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    const set = new HashSet<T>(equaler);
    for (const item of source) {
        const element = elementSelector(item);
        set.add(element);
    }
    return set;
}

/**
 * Creates an Array for the elements of the `Iterable`.
 *
 * @param source An `Iterable` object.
 * @category Scalar
 */
export function toArray<T>(source: Iterable<T>): T[];
/**
 * Creates an Array for the elements of the `Iterable`.
 *
 * @param source An `Iterable` object.
 * @param elementSelector A callback that selects a value for each element.
 * @category Scalar
 */
export function toArray<T, V>(source: Iterable<T>, elementSelector: (element: T) => V): V[];
export function toArray<T>(source: Iterable<T>, elementSelector: (element: T) => T = identity): T[] {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    const result: T[] = [];
    for (const element of source) {
        result.push(elementSelector(element));
    }
    return result;
}

function makeDescriptor<K, V>(_key: K, value: V) {
    return {
        enumerable: true,
        configurable: true,
        writable: true,
        value
    };
}

/**
 * Creates an Object for the elements of `source`. Properties are added via `Object.defineProperty`.
 *
 * ```ts
 * // As a regular object
 * const obj = toObject(`"`, 1], ["y", 2]], undefined, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // function
 *
 * // with a custom prototype
 * const baseObject = { toString() { return `${this.x}:${this.y}` } };
 * const obj = toObject(`"`, 1], ["y", 2]], baseObject, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // function
 * obj.toString(); // "x",1:"y",2
 *
 * // with a null prototype
 * const obj = toObject(`"`, 1], ["y", 2]], null, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // undefined
 * ```
 *
 * @param source An `Iterable` object.
 * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
 * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
 * @param keySelector A callback used to select a key for each element.
 * @category Scalar
 */
export function toObject<T, TProto extends object, K extends PropertyKey>(source: Iterable<T>, prototype: TProto, keySelector: (element: T) => K): TProto & Record<K, T>;
/**
 * Creates an Object for the elements of `source`. Properties are added via `Object.defineProperty`.
 *
 * ```ts
 * // As a regular object
 * const obj = toObject(`"`, 1], ["y", 2]], undefined, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // function
 *
 * // with a custom prototype
 * const baseObject = { toString() { return `${this.x}:${this.y}` } };
 * const obj = toObject(`"`, 1], ["y", 2]], baseObject, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // function
 * obj.toString(); // "x",1:"y",2
 *
 * // with a null prototype
 * const obj = toObject(`"`, 1], ["y", 2]], null, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // undefined
 * ```
 *
 * @param source An `Iterable` object.
 * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
 * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
 * @param keySelector A callback used to select a key for each element.
 * @category Scalar
 */
export function toObject<T, TProto extends object>(source: Iterable<T>, prototype: TProto, keySelector: (element: T) => PropertyKey): TProto & Record<PropertyKey, T>;
/**
 * Creates an Object for the elements of `source`. Properties are added via `Object.defineProperty`.
 *
 * ```ts
 * // As a regular object
 * const obj = toObject(`"`, 1], ["y", 2]], undefined, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // function
 *
 * // with a custom prototype
 * const baseObject = { toString() { return `${this.x}:${this.y}` } };
 * const obj = toObject(`"`, 1], ["y", 2]], baseObject, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // function
 * obj.toString(); // "x",1:"y",2
 *
 * // with a null prototype
 * const obj = toObject(`"`, 1], ["y", 2]], null, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // undefined
 * ```
 *
 * @param source An `Iterable` object.
 * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
 * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
 * @param keySelector A callback used to select a key for each element.
 * @category Scalar
 */
export function toObject<T, K extends PropertyKey>(source: Iterable<T>, prototype: object | null | undefined, keySelector: (element: T) => K): Record<K, T>;
/**
 * Creates an Object for the elements of `source`. Properties are added via `Object.defineProperty`.
 *
 * ```ts
 * // As a regular object
 * const obj = toObject(`"`, 1], ["y", 2]], undefined, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // function
 *
 * // with a custom prototype
 * const baseObject = { toString() { return `${this.x}:${this.y}` } };
 * const obj = toObject(`"`, 1], ["y", 2]], baseObject, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // function
 * obj.toString(); // "x",1:"y",2
 *
 * // with a null prototype
 * const obj = toObject(`"`, 1], ["y", 2]], null, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // undefined
 * ```
 *
 * @param source An `Iterable` object.
 * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
 * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
 * @param keySelector A callback used to select a key for each element.
 * @category Scalar
 */
export function toObject<T>(source: Iterable<T>, prototype: object | null | undefined, keySelector: (element: T) => PropertyKey): Record<PropertyKey, T>;
/**
 * Creates an Object for the elements of `source`. Properties are added via `Object.defineProperty`.
 *
 * ```ts
 * // As a regular object
 * const obj = toObject(`"`, 1], ["y", 2]], undefined, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 *
 * // with a custom prototype
 * const baseObject = { toString() { return `${this.x}:${this.y}` } };
 * const obj = toObject(`"`, 1], ["y", 2]], baseObject, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 * obj.toString(); // 1:2
 *
 * // with a null prototype
 * const obj = toObject(`"`, 1], ["y", 2]], null, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // undefined
 * ```
 *
 * @param source An `Iterable` object.
 * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
 * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
 * @param keySelector A callback used to select a key for each element.
 * @param elementSelector A callback that selects a value for each element.
 * @param descriptorSelector A callback that defines the `PropertyDescriptor` for each property.
 * @category Scalar
 */
export function toObject<T, TProto extends object, K extends PropertyKey, V>(source: Iterable<T>, prototype: TProto, keySelector: (element: T) => K, elementSelector: (element: T) => V, descriptorSelector?: (key: K, value: V) => TypedPropertyDescriptor<V>): TProto & Record<K, V>;
/**
 * Creates an Object for the elements of `source`. Properties are added via `Object.defineProperty`.
 *
 * ```ts
 * // As a regular object
 * const obj = toObject(`"`, 1], ["y", 2]], undefined, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 *
 * // with a custom prototype
 * const baseObject = { toString() { return `${this.x}:${this.y}` } };
 * const obj = toObject(`"`, 1], ["y", 2]], baseObject, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 * obj.toString(); // 1:2
 *
 * // with a null prototype
 * const obj = toObject(`"`, 1], ["y", 2]], null, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // undefined
 * ```
 *
 * @param source An `Iterable` object.
 * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
 * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
 * @param keySelector A callback used to select a key for each element.
 * @param elementSelector A callback that selects a value for each element.
 * @param descriptorSelector A callback that defines the `PropertyDescriptor` for each property.
 * @category Scalar
 */
export function toObject<T, TProto extends object, V>(source: Iterable<T>, prototype: TProto, keySelector: (element: T) => PropertyKey, elementSelector: (element: T) => V, descriptorSelector?: (key: PropertyKey, value: V) => TypedPropertyDescriptor<V>): TProto & Record<PropertyKey, V>;
/**
 * Creates an Object for the elements of `source`. Properties are added via `Object.defineProperty`.
 *
 * ```ts
 * // As a regular object
 * const obj = toObject(`"`, 1], ["y", 2]], undefined, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 *
 * // with a custom prototype
 * const baseObject = { toString() { return `${this.x}:${this.y}` } };
 * const obj = toObject(`"`, 1], ["y", 2]], baseObject, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 * obj.toString(); // 1:2
 *
 * // with a null prototype
 * const obj = toObject(`"`, 1], ["y", 2]], null, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // undefined
 * ```
 *
 * @param source An `Iterable` object.
 * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
 * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
 * @param keySelector A callback used to select a key for each element.
 * @param elementSelector A callback that selects a value for each element.
 * @param descriptorSelector A callback that defines the `PropertyDescriptor` for each property.
 * @category Scalar
 */
export function toObject<T, K extends PropertyKey, V>(source: Iterable<T>, prototype: object | null | undefined, keySelector: (element: T) => K, elementSelector: (element: T) => V, descriptorSelector?: (key: K, value: V) => TypedPropertyDescriptor<V>): Record<K, V>;
/**
 * Creates an Object for the elements of `source`. Properties are added via `Object.defineProperty`.
 *
 * ```ts
 * // As a regular object
 * const obj = toObject(`"`, 1], ["y", 2]], undefined, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 *
 * // with a custom prototype
 * const baseObject = { toString() { return `${this.x}:${this.y}` } };
 * const obj = toObject(`"`, 1], ["y", 2]], baseObject, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 * obj.toString(); // 1:2
 *
 * // with a null prototype
 * const obj = toObject(`"`, 1], ["y", 2]], null, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // undefined
 * ```
 *
 * @param source An `Iterable` object.
 * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
 * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
 * @param keySelector A callback used to select a key for each element.
 * @param elementSelector A callback that selects a value for each element.
 * @param descriptorSelector A callback that defines the `PropertyDescriptor` for each property.
 * @category Scalar
 */
export function toObject<T, V>(source: Iterable<T>, prototype: object | null | undefined, keySelector: (element: T) => PropertyKey, elementSelector: (element: T) => V, descriptorSelector?: (key: PropertyKey, value: V) => TypedPropertyDescriptor<V>): Record<PropertyKey, V>;
/**
 * Creates an Object for the elements of `source`. Properties are added via `Object.defineProperty`.
 *
 * ```ts
 * // As a regular object
 * const obj = toObject(`"`, 1], ["y", 2]], undefined, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 *
 * // with a custom prototype
 * const baseObject = { toString() { return `${this.x}:${this.y}` } };
 * const obj = toObject(`"`, 1], ["y", 2]], baseObject, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 * obj.toString(); // 1:2
 *
 * // with a null prototype
 * const obj = toObject(`"`, 1], ["y", 2]], null, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // undefined
 * ```
 *
 * @param source An `Iterable` object.
 * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
 * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
 * @param keySelector A callback used to select a key for each element.
 * @param elementSelector A callback that selects a value for each element.
 * @param descriptorSelector A callback that defines the `PropertyDescriptor` for each property.
 * @category Scalar
 */
export function toObject<T, V>(source: Iterable<T>, prototype: object | null | undefined, keySelector: (element: T) => PropertyKey, elementSelector: (element: T) => V, descriptorSelector?: (key: PropertyKey, value: V) => PropertyDescriptor): object;
export function toObject<T>(source: Iterable<T>, prototype: object | null = Object.prototype, keySelector: (element: T) => PropertyKey, elementSelector: (element: T) => T = identity, descriptorSelector: (key: PropertyKey, value: T) => PropertyDescriptor = makeDescriptor): object {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isObject(prototype) && prototype !== null) throw new TypeError("Object expected: prototype");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    if (!isFunction(descriptorSelector)) throw new TypeError("Function expected: descriptorSelector");
    const obj = prototype === Object.prototype ? {} : Object.create(prototype);
    for (const item of source) {
        const key = keySelector(item);
        const element = elementSelector(item);
        const descriptor = descriptorSelector(key, element);
        Object.defineProperty(obj, key, descriptor);
    }
    return obj;
}

/**
 * Creates a Lookup for the elements of the Query.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select a key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Scalar
 */
export function toLookup<T, K>(source: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Lookup<K, T>;
/**
 * Creates a Lookup for the elements of the Query.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select a key for each element.
 * @param elementSelector A callback that selects a value for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Scalar
 */
export function toLookup<T, K, V>(source: Iterable<T>, keySelector: (element: T) => K, elementSelector: (element: T) => V, keyEqualer?: Equaler<K>): Lookup<K, V>;
export function toLookup<T, K, V>(source: Iterable<T>, keySelector: (element: T) => K, elementSelector: ((element: T) => T | V) | Equaler<K> = identity, keyEqualer: Equaler<K> = Equaler.defaultEqualer) {
    if (typeof elementSelector === "object") {
        keyEqualer = elementSelector;
        elementSelector = identity;
    }
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    if (!Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: keyEqualer");
    return new Lookup(createGroupings(source, keySelector, keyEqualer, elementSelector), keyEqualer);
}

/**
 * Pass the entire source to the provided callback, returning a scalar result. Useful as the last step
 * in a query.
 *
 * @param source An `Iterable` object.
 * @param callback A callback function.
 * @category Subquery
 */
export function into<T, S extends Iterable<T>, R>(source: S, callback: (source: S) => R): R {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(callback)) throw new TypeError("Function expected: callback");
    return callback(source);
}

/**
 * Computes the sum for a series of numbers.
 *
 * @param source An `Iterable` object.
 * @category Scalar
 */
export function sum(source: Iterable<number>): number;
/**
 * Computes the sum for a series of numbers.
 *
 * @param source An `Iterable` object.
 * @param elementSelector A callback used to convert a value in `source` to a number.
 * @category Scalar
 */
export function sum<T>(source: Iterable<T>, elementSelector: (element: T) => number): number;
export function sum(source: Iterable<number>, elementSelector: (element: number) => number = identity): number {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    let sum = 0;
    for (const value of source) {
        const result = elementSelector(value);
        if (!isNumber(result)) throw new TypeError("Number expected");
        sum += result;
    }
    return sum;
}

/**
 * Computes the average for a series of numbers.
 *
 * @param source An `Iterable` object.
 * @category Scalar
 */
export function average(source: Iterable<number>): number;
/**
 * Computes the average for a series of numbers.
 *
 * @param source An `Iterable` object.
 * @param elementSelector A callback used to convert a value in `source` to a number.
 * @category Scalar
 */
export function average<T>(source: Iterable<T>, elementSelector: (element: T) => number): number;
export function average(source: Iterable<number>, elementSelector: (element: number) => number = identity): number {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    let sum = 0;
    let count = 0;
    for (const value of source) {
        const result = elementSelector(value);
        if (!isNumber(result)) throw new TypeError("Number expected");
        sum += result;
        count++;
    }
    return count > 0 ? sum / count : 0;
}

const noCacheAndLeaveOpen: ConsumeOptions = { cacheElements: false, leaveOpen: true };
const cacheAndClose: ConsumeOptions = { cacheElements: true, leaveOpen: false };

/**
 * Creates a tuple whose first element is an `Iterable` containing the first span of
 * elements that match the supplied predicate, and whose second element is an `Iterable`
 * containing the remaining elements.
 *
 * The first `Iterable` is eagerly evaluated, while the second `Iterable` is lazily
 * evaluated.
 *
 * @param source An `Iterable` object.
 * @param predicate The predicate used to match elements.
 * @category Scalar
 */
export function span<TNode, T extends TNode, U extends T>(source: HierarchyIterable<TNode, T>, predicate: (element: T, offset: number) => element is U): [HierarchyIterable<TNode, U>, HierarchyIterable<TNode, T>];
/**
 * Creates a tuple whose first element is an `Iterable` containing the first span of
 * elements that match the supplied predicate, and whose second element is an `Iterable`
 * containing the remaining elements.
 *
 * The first `Iterable` is eagerly evaluated, while the second `Iterable` is lazily
 * evaluated.
 *
 * @param source An `Iterable` object.
 * @param predicate The predicate used to match elements.
 * @category Scalar
 */
export function span<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, predicate: (element: T, offset: number) => boolean): [HierarchyIterable<TNode, T>, HierarchyIterable<TNode, T>];
/**
 * Creates a tuple whose first element is an `Iterable` containing the first span of
 * elements that match the supplied predicate, and whose second element is an `Iterable`
 * containing the remaining elements.
 *
 * The first `Iterable` is eagerly evaluated, while the second `Iterable` is lazily
 * evaluated.
 *
 * @param source An `Iterable` object.
 * @param predicate The predicate used to match elements.
 * @category Scalar
 */
export function span<T, U extends T>(source: Iterable<T>, predicate: (element: T, offset: number) => element is U): [Iterable<U>, Iterable<T>];
/**
 * Creates a tuple whose first element is an `Iterable` containing the first span of
 * elements that match the supplied predicate, and whose second element is an `Iterable`
 * containing the remaining elements.
 *
 * The first `Iterable` is eagerly evaluated, while the second `Iterable` is lazily
 * evaluated.
 *
 * @param source An `Iterable` object.
 * @param predicate The predicate used to match elements.
 * @category Scalar
 */
export function span<T>(source: Iterable<T>, predicate: (element: T, offset: number) => boolean): [Iterable<T>, Iterable<T>];
export function span<T>(source: Iterable<T>, predicate: (element: T, offset: number) => boolean): [Iterable<T>, Iterable<T>] {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    const prefix: T[] = [];
    const iterator = source[Symbol.iterator]();
    let offset = 0;
    for (const value of consume(iterator, noCacheAndLeaveOpen)) {
        if (!predicate(value, offset++)) {
            const remaining = prepend(consume(iterator, cacheAndClose), value);
            return [
                flowHierarchy({ [Symbol.iterator]() { return prefix[Symbol.iterator](); } }, source),
                flowHierarchy(remaining, source)
            ];
        }
        prefix.push(value);
    }
    return [
        flowHierarchy({ [Symbol.iterator]() { return prefix[Symbol.iterator](); } }, source),
        flowHierarchy(empty<T>(), source)
    ];
}

/**
 * Creates a tuple whose first element is an `Iterable` containing the first span of
 * elements that do not match the supplied predicate, and whose second element is an `Iterable`
 * containing the remaining elements.
 *
 * The first `Iterable` is eagerly evaluated, while the second `Iterable` is lazily
 * evaluated.
 *
 * @param source An `Iterable` object.
 * @param predicate The predicate used to match elements.
 * @category Scalar
 */
export function spanUntil<T>(source: HierarchyIterable<T>, predicate: (element: T, offset: number) => boolean): [HierarchyIterable<T>, HierarchyIterable<T>];
/**
 * Creates a tuple whose first element is an `Iterable` containing the first span of
 * elements that do not match the supplied predicate, and whose second element is an `Iterable`
 * containing the remaining elements.
 *
 * The first `Iterable` is eagerly evaluated, while the second `Iterable` is lazily
 * evaluated.
 *
 * @param source An `Iterable` object.
 * @param predicate The predicate used to match elements.
 * @category Scalar
 */
export function spanUntil<T>(source: Iterable<T>, predicate: (element: T, offset: number) => boolean): [Iterable<T>, Iterable<T>];
export function spanUntil<T>(source: Iterable<T>, predicate: (element: T, offset: number) => boolean): [Iterable<T>, Iterable<T>] {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    const prefix: T[] = [];
    const iterator = source[Symbol.iterator]();
    let offset = 0;
    for (const value of consume(iterator, noCacheAndLeaveOpen)) {
        if (predicate(value, offset++)) {
            const remaining = prepend(consume(iterator, cacheAndClose), value);
            return [
                flowHierarchy({ [Symbol.iterator]() { return prefix[Symbol.iterator](); } }, source),
                flowHierarchy(remaining, source)
            ];
        }
        prefix.push(value);
    }
    return [
        flowHierarchy({ [Symbol.iterator]() { return prefix[Symbol.iterator](); } }, source),
        flowHierarchy(empty<T>(), source)
    ];
}

/**
 * Computes a scalar value indicating whether the key for every element in `left` corresponds to a matching key
 * in `right` at the same position.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @category Scalar
 */
export function correspondsBy<T, K>(left: Iterable<T>, right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): boolean;
/**
 * Computes a scalar value indicating whether the key for every element in `left` corresponds to a matching key
 * in `right` at the same position.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param leftKeySelector A callback used to select the key for each element in `left`.
 * @param rightKeySelector A callback used to select the key for each element in `right`.
 * @param keyEqualer An optional callback used to compare the equality of two keys.
 * @category Scalar
 */
export function correspondsBy<T, U, K>(left: Iterable<T>, right: Iterable<U>, leftKeySelector: (element: T) => K, rightKeySelector: (element: U) => K, keyEqualer?: EqualityComparison<K> | Equaler<K>): boolean;
export function correspondsBy<T, K>(left: Iterable<T>, right: Iterable<T>, leftKeySelector: (element: T) => K, rightKeySelector: ((element: T) => K) | Equaler<K> = leftKeySelector, keyEqualer: EqualityComparison<K> | Equaler<K> = Equaler.defaultEqualer): boolean {
    if (typeof rightKeySelector === "object") {
        keyEqualer = rightKeySelector;
        rightKeySelector = leftKeySelector;
    }
    if (isFunction(keyEqualer)) keyEqualer = Equaler.create(keyEqualer);
    if (!isIterableObject(left)) throw new TypeError("Iterable expected: left");
    if (!isIterableObject(right)) throw new TypeError("Iterable expected: right");
    if (!isFunction(leftKeySelector)) throw new TypeError("Function expected: leftKeySelector");
    if (!isFunction(rightKeySelector)) throw new TypeError("Function expected: rightKeySelector");
    if (!Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: keyEqualer");
    const leftIterator = left[Symbol.iterator]();
    let leftResult: IteratorResult<T> | undefined;
    try {
        const rightIterator = right[Symbol.iterator]();
        let rightResult: IteratorResult<T> | undefined;
        try {
            for (;;) {
                leftResult = leftIterator.next();
                rightResult = rightIterator.next();
                if (leftResult.done && rightResult.done) return true;
                if (Boolean(leftResult.done) !== Boolean(rightResult.done) || !keyEqualer.equals(leftKeySelector(leftResult.value), rightKeySelector(rightResult.value))) return false;
            }
        }
        finally {
            if (rightResult && !rightResult.done) rightIterator.return?.();
        }
    }
    finally {
        if (leftResult && !leftResult.done) leftIterator.return?.();
    }
}

/**
 * Computes a scalar value indicating whether every element in `left` corresponds to a matching element
 * in `right` at the same position.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param equaler An optional callback used to compare the equality of two elements.
 * @category Scalar
 */
export function corresponds<T>(left: Iterable<T>, right: Iterable<T>, equaler?: EqualityComparison<T> | Equaler<T>): boolean;
/**
 * Computes a scalar value indicating whether every element in `left` corresponds to a matching element
 * in `right` at the same position.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param equaler An optional callback used to compare the equality of two elements.
 * @category Scalar
 */
export function corresponds<T, U>(left: Iterable<T>, right: Iterable<U>, equaler: (left: T, right: U) => boolean): boolean;
export function corresponds<T, U>(left: Iterable<T>, right: Iterable<U>, equaler: EqualityComparison<T | U> | Equaler<T | U> = Equaler.defaultEqualer): boolean {
    return correspondsBy(left, right, identity, identity, equaler);
}

/**
 * Finds the value at the provided offset. A negative offset starts from the
 * last element.
 *
 * @param source An `Iterable` object.
 * @param offset An offset.
 * @category Scalar
 */
export function elementAt<T>(source: Iterable<T>, offset: number | Index): T | undefined {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    let isFromEnd = false;
    if (isNumber(offset)) {
        if (!isInteger(offset)) throw new RangeError("Argument out of range: offset");
        isFromEnd = offset < 0;
        if (isFromEnd) offset = -offset;
    }
    else {
        if (!(offset instanceof Index)) throw new TypeError("Number or Index expected: offset");
        isFromEnd = offset.isFromEnd;
        offset = offset.value;
    }
    if (isFromEnd) {
        if (offset === 0) {
            return undefined;
        }
        if (offset === 1) {
            return last(source);
        }
        const array: T[] = [];
        for (const element of source) {
            if (array.length >= offset) {
                array.shift();
            }
            array.push(element);
        }
        return array.length - offset >= 0 ? array[array.length - offset] : undefined;
    }
    for (const element of source) {
        if (offset === 0) {
            return element;
        }
        offset--;
    }
    return undefined;
}

export { elementAt as nth };

/**
 * Computes a scalar value indicating whether the elements of this Query start
 * with the same sequence of elements in another Iterable.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param equaler A callback used to compare the equality of two elements.
 * @category Scalar
 */
export function startsWith<T>(left: Iterable<T>, right: Iterable<T>, equaler?: EqualityComparison<T> | Equaler<T>): boolean;
/**
 * Computes a scalar value indicating whether the elements of this Query start
 * with the same sequence of elements in another Iterable.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param equaler A callback used to compare the equality of two elements.
 * @category Scalar
 */
export function startsWith<T, U>(left: Iterable<T>, right: Iterable<U>, equaler: (left: T, right: U) => boolean): boolean;
export function startsWith<T>(left: Iterable<T>, right: Iterable<T>, equaler: EqualityComparison<T> | Equaler<T> = Equaler.defaultEqualer): boolean {
    if (isFunction(equaler)) equaler = Equaler.create(equaler);
    if (!isIterableObject(left)) throw new TypeError("Iterable expected: left");
    if (!isIterableObject(right)) throw new TypeError("Iterable expected: right");
    if (!Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    const leftIterator = left[Symbol.iterator]();
    let leftResult: IteratorResult<T> | undefined;
    try {
        const rightIterator = right[Symbol.iterator]();
        let rightResult: IteratorResult<T> | undefined;
        try {
            for (;;) {
                leftResult = leftIterator.next();
                rightResult = rightIterator.next();
                if (rightResult.done) return true;
                if (leftResult.done || !equaler.equals(leftResult.value, rightResult.value)) return false;
            }
        }
        finally {
            if (rightResult && !rightResult.done) rightIterator.return?.();
        }
    }
    finally {
        if (leftResult && !leftResult.done) leftIterator.return?.();
    }
}

/**
 * Computes a scalar value indicating whether the elements of `left` end
 * with the same sequence of elements in `right`.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param equaler An optional callback used to compare the equality of two elements.
 * @category Scalar
 */
export function endsWith<T>(left: Iterable<T>, right: Iterable<T>, equaler?: EqualityComparison<T> | Equaler<T>): boolean;
/**
 * Computes a scalar value indicating whether the elements of `left` end
 * with the same sequence of elements in `right`.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param equaler An optional callback used to compare the equality of two elements.
 * @category Scalar
 */
export function endsWith<T, U>(left: Iterable<T>, right: Iterable<U>, equaler: (left: T, right: U) => boolean): boolean;
export function endsWith<T>(left: Iterable<T>, right: Iterable<T>, equaler: EqualityComparison<T> | Equaler<T> = Equaler.defaultEqualer): boolean {
    if (isFunction(equaler)) equaler = Equaler.create(equaler);
    if (!isIterableObject(left)) throw new TypeError("Iterable expected: left");
    if (!isIterableObject(right)) throw new TypeError("Iterable expected: right");
    if (!Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    const rightArray = toArray(right);
    const numElements = rightArray.length;
    if (numElements <= 0) {
        return true;
    }
    const leftArray = toArray(takeRight(left, numElements));
    if (leftArray.length < numElements) {
        return false;
    }
    for (let i = 0; i < numElements; i++) {
        if (!equaler.equals(leftArray[i], rightArray[i])) {
            return false;
        }
    }
    return true;
}

/**
 * Computes a scalar value indicating whether the provided value is included in an `Iterable`.
 *
 * @param source An `Iterable` object.
 * @param value A value.
 * @param equaler An optional callback used to compare the equality of two elements.
 * @category Scalar
 */
export function includes<T>(source: Iterable<T>, value: T, equaler?: EqualityComparison<T> | Equaler<T>): boolean;
/**
 * Computes a scalar value indicating whether the provided value is included in an `Iterable`.
 *
 * @param source An `Iterable` object.
 * @param value A value.
 * @param equaler An optional callback used to compare the equality of two elements.
 * @category Scalar
 */
export function includes<T, U>(source: Iterable<T>, value: U, equaler: (left: T, right: U) => boolean): boolean;
export function includes<T>(source: Iterable<T>, value: T, equaler: EqualityComparison<T> | Equaler<T> = Equaler.defaultEqualer): boolean {
    if (isFunction(equaler)) equaler = Equaler.create(equaler);
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    for (const element of source) {
        if (equaler.equals(value, element)) {
            return true;
        }
    }
    return false;
}

/**
 * Computes a scalar value indicating whether the elements of `left` include
 * an exact sequence of elements from `right`.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param equaler A callback used to compare the equality of two elements.
 * @category Scalar
 */
export function includesSequence<T>(left: Iterable<T>, right: Iterable<T>, equaler?: EqualityComparison<T> | Equaler<T>): boolean;
/**
 * Computes a scalar value indicating whether the elements of `left` include
 * an exact sequence of elements from `right`.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param equaler A callback used to compare the equality of two elements.
 * @category Scalar
 */
export function includesSequence<T, U>(left: Iterable<T>, right: Iterable<U>, equaler: (left: T, right: U) => boolean): boolean;
export function includesSequence<T>(left: Iterable<T>, right: Iterable<T>, equaler: EqualityComparison<T> | Equaler<T> = Equaler.defaultEqualer): boolean {
    if (isFunction(equaler)) equaler = Equaler.create(equaler);
    if (!isIterableObject(left)) throw new TypeError("Iterable expected: left");
    if (!isIterableObject(right)) throw new TypeError("Iterable expected: other");
    if (!Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    const rightArray = toArray(right);
    const numRightElements = rightArray.length;
    if (numRightElements <= 0) {
        return true;
    }
    const span: T[] = [];
    for (const leftValue of left) {
        for (;;) {
            const rightValue = rightArray[span.length];
            if (equaler.equals(leftValue, rightValue)) {
                if (span.length + 1 >= numRightElements) {
                    return true;
                }
                span.push(leftValue);
            }
            else if (span.length > 0) {
                span.shift();
                continue;
            }
            break;
        }
    }
    return false;
}

class ArrayWrapper<T> {
    constructor(private array: T[]) { }
    get [IndexedCollection.size](): number { return this.array.length; }
    [IndexedCollection.setAt](index: number, value: T): boolean {
        this.array[index] = value;
        return true;
    }
}

/**
 * Writes each element of a source iterable to a destination. The destination must already
 * have enough space to write the requested number of elements (i.e. arrays are *not* resized).
 *
 * @param source An `Iterable` object.
 * @param collection The destination array or `IndexedCollection`.
 * @param start The offset into the array at which to start writing.
 * @param count The number of elements to write to the array.
 * @category Scalar
 */
export function copyTo<T, U extends IndexedCollection<T> | T[]>(source: Iterable<T>, collection: U, start: number = 0, count?: number): U {
    const target = IndexedCollection.hasInstance(collection) ? collection :
        Array.isArray(collection) ? new ArrayWrapper<T>(collection) :
        undefined;

    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (target === undefined) throw new TypeError("IndexedCollection or Array expected: collection");
    if (!isNumber(start)) throw new TypeError("Number expected: start");
    if (!isPositiveInteger(start)) throw new RangeError("Argument out of range: start");

    const size = target[IndexedCollection.size];
    if (!isUndefined(count)) {
        if (!isNumber(count)) throw new TypeError("Number expected: count");
        if (!isPositiveInteger(count)) throw new RangeError("Argument out of range: count");
    }
    else {
        count = size - start;
    }

    if (start + count > size) throw new RangeError("Argument out of range: count");

    if (count > 0) {
        for (const element of source) {
            if (count > 0) {
                target[IndexedCollection.setAt](start++, element);
                count--;
            }
            else {
                break;
            }
        }
    }

    return collection;
}
