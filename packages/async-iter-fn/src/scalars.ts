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

import /*#__INLINE__*/ { isAsyncIterableObject, isFunction, isInteger, isIterableObject, isNumber, isObject, isPositiveInteger, isUndefined } from '@esfx/internal-guards';
import { toAsyncIterable } from '@esfx/async-iter-fromsync';
import { AsyncHierarchyIterable } from '@esfx/async-iter-hierarchy';
import { IndexedCollection } from '@esfx/collection-core';
import { HashMap } from "@esfx/collections-hashmap";
import { HashSet } from "@esfx/collections-hashset";
import { Comparer, Comparison, Equaler, EqualityComparison } from "@esfx/equatable";
import { identity, T } from '@esfx/fn';
import { Index } from "@esfx/interval";
import { HierarchyIterable } from '@esfx/iter-hierarchy';
import { Lookup } from "@esfx/iter-lookup";
import { createGroupingsAsync, flowHierarchy } from './internal/utils.js';
import { consumeAsync, ConsumeAsyncOptions, emptyAsync } from './queries.js';
import { prependAsync, takeRightAsync } from './subqueries.js';

/**
 * Computes a scalar value by applying an accumulator callback over each element.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param accumulator the callback used to compute the result.
 * @category Scalar
 */
export function reduceAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, accumulator: (current: T, element: T, offset: number) => PromiseLike<T> | T): Promise<T>;
/**
 * Computes a scalar value by applying an accumulator callback over each element.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param accumulator the callback used to compute the result.
 * @category Scalar
 * @param seed An optional seed value.
 */
export function reduceAsync<T, U>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, accumulator: (current: U, element: T, offset: number) => PromiseLike<U> | U, seed: U): Promise<U>;
/**
 * Computes a scalar value by applying an accumulator callback over each element.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param accumulator the callback used to compute the result.
 * @param seed An optional seed value.
 * @param resultSelector An optional callback used to compute the final result.
 * @category Scalar
 */
export function reduceAsync<T, U, R>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, accumulator: (current: U, element: T, offset: number) => PromiseLike<U> | U, seed: U, resultSelector: (result: U, count: number) => R | PromiseLike<R>): Promise<R>;
export function reduceAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, accumulator: (current: T, element: T, offset: number) => PromiseLike<T> | T, seed?: T, resultSelector: (result: T, count: number) => PromiseLike<T> | T = identity): Promise<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(accumulator)) throw new TypeError("Function expected: accumulator");
    if (!isFunction(resultSelector)) throw new TypeError("Function expected: resultSelector");
    return reduceAsyncCore(source, accumulator, arguments.length > 2, seed, resultSelector);
}

async function reduceAsyncCore<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, accumulator: (current: T, element: T, offset: number) => PromiseLike<T> | T, hasCurrent: boolean, current?: T, resultSelector: (result: T, count: number) => PromiseLike<T> | T = identity): Promise<T> {
    let count = 0;
    for await (const value of toAsyncIterable(source)) {
        if (!hasCurrent) {
            hasCurrent = true;
            current = value;
        }
        else {
            current = await accumulator(current!, value, count);
        }
        count++;
    }
    return resultSelector(current!, count);
}

/**
 * Computes a scalar value by applying an accumulator callback over each element in reverse.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param accumulator the callback used to compute the result.
 * @category Scalar
 */
export function reduceRightAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, accumulator: (current: T, element: T, offset: number) => PromiseLike<T> | T): Promise<T>;
/**
 * Computes a scalar value by applying an accumulator callback over each element in reverse.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param accumulator the callback used to compute the result.
 * @param seed An optional seed value.
 * @category Scalar
 */
export function reduceRightAsync<T, U>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, accumulator: (current: U, element: T, offset: number) => PromiseLike<U> | U, seed: U): Promise<U>;
/**
 * Computes a scalar value by applying an accumulator callback over each element in reverse.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param accumulator the callback used to compute the result.
 * @param seed An optional seed value.
 * @param resultSelector An optional callback used to compute the final result.
 * @category Scalar
 */
export function reduceRightAsync<T, U, R>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, accumulator: (current: U, element: T, offset: number) => PromiseLike<U> | U, seed: U, resultSelector: (result: U, count: number) => R | PromiseLike<R>): Promise<R>;
export function reduceRightAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, accumulator: (current: T, element: T, offset: number) => PromiseLike<T> | T, seed?: T, resultSelector: (result: T, count: number) => PromiseLike<T> | T = identity): Promise<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(accumulator)) throw new TypeError("Function expected: accumulator");
    if (!isFunction(resultSelector)) throw new TypeError("Function expected: resultSelector");
    return reduceRightAsyncCore(source, accumulator, arguments.length > 2, seed, resultSelector);
}

async function reduceRightAsyncCore<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, accumulator: (current: T, element: T, offset: number) => PromiseLike<T> | T, hasCurrent: boolean, current: T | undefined, resultSelector: (result: T, count: number) => PromiseLike<T> | T): Promise<T> {
    const sourceArray = await toArrayAsync(source);
    let count = 0;
    for (let offset = sourceArray.length - 1; offset >= 0; offset--) {
        const value = sourceArray[offset];
        if (!hasCurrent) {
            current = value;
            hasCurrent = true;
        }
        else {
            current = await accumulator(current!, value, offset);
        }
        count++;
    }
    return resultSelector(current!, count);
}

/**
 * Counts the number of elements, optionally filtering elements using the supplied callback.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate An optional callback used to match each element.
 * @category Scalar
 */
export function countAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean = T): Promise<number> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return countAsyncCore(source, predicate);
}

async function countAsyncCore<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean): Promise<number> {
    if (predicate === T) {
        if (Array.isArray(source)) return source.length;
        if (source instanceof Set || source instanceof Map) return source.size;
    }

    let count = 0;
    for await (const element of source) {
        if (predicate === T || await predicate(element)) {
            count++;
        }
    }

    return count;
}

/**
 * Gets the first element, optionally filtering elements using the supplied callback.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate An optional callback used to match each element.
 * @category Scalar
 */
export function firstAsync<T, U extends T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => element is U): Promise<U | undefined>;
/**
 * Gets the first element, optionally filtering elements using the supplied callback.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate An optional callback used to match each element.
 * @category Scalar
 */
export function firstAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate?: (element: T) => PromiseLike<boolean> | boolean): Promise<T | undefined>;
export function firstAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean = T): Promise<T | undefined> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return firstAsyncCore(source, predicate);
}

async function firstAsyncCore<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean): Promise<T | undefined> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    for await (const element of source) {
        const result = predicate(element);
        if (typeof result === "boolean" ? result : await result) {
            return element;
        }
    }
    return undefined;
}

/**
 * Gets the last element of an `AsyncIterable` or `Iterable`, optionally filtering elements using the supplied
 * callback.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate An optional callback used to match each element.
 * @category Scalar
 */
export function lastAsync<T, U extends T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => element is U): Promise<U | undefined>;
/**
 * Gets the last element of an `AsyncIterable` or `Iterable`, optionally filtering elements using the supplied
 * callback.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate An optional callback used to match each element.
 * @category Scalar
 */
export function lastAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate?: (element: T) => PromiseLike<boolean> | boolean): Promise<T | undefined>;
export function lastAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean = T): Promise<T | undefined> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return lastAsyncCore(source, predicate);
}

async function lastAsyncCore<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean): Promise<T | undefined> {
    let last: T | undefined;
    for await (const element of source) {
        const result = predicate(element);
        if (typeof result === "boolean" ? result : await result) {
            last = element;
        }
    }
    return last;
}

/**
 * Gets the only element, or returns `undefined`.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate An optional callback used to match each element.
 * @category Scalar
 */
export function singleAsync<T, U extends T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => element is U): Promise<U | undefined>;
/**
 * Gets the only element, or returns `undefined`.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate An optional callback used to match each element.
 * @category Scalar
 */
export function singleAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate?: (element: T) => PromiseLike<boolean> | boolean): Promise<T | undefined>;
export function singleAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean = T) {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return singleAsyncCore(source, predicate);
}

async function singleAsyncCore<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean) {
    let hasResult = false;
    let single: T | undefined;
    for await (const element of source) {
        const result = predicate(element);
        if (typeof result === "boolean" ? result : await result) {
            if (hasResult) {
                return undefined;
            }
            hasResult = true;
            single = element;
        }
    }
    return hasResult ? single : undefined;
}

/**
 * Gets the minimum element of an `AsyncIterable`, optionally comparing the keys of each element using the supplied callback.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to choose the key to compare.
 * @param keyComparer An optional callback used to compare the keys.
 * @category Scalar
 */
export function minByAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (value: T) => K, keyComparer: Comparison<K> | Comparer<K> = Comparer.defaultComparer): Promise<T | undefined> {
    if (typeof keyComparer === "function") keyComparer = Comparer.create(keyComparer);
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!Comparer.hasInstance(keyComparer)) throw new TypeError("Comparer expected: keyComparer");
    return minByAsyncCore(source, keySelector,keyComparer);
}

async function minByAsyncCore<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (value: T) => K, keyComparer: Comparer<K>): Promise<T | undefined> {
    let hasResult = false;
    let result: T | undefined;
    let resultKey: K | undefined;
    for await (const element of source) {
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
 * Gets the minimum element of an `AsyncIterable`, optionally comparing elements using the supplied callback.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param comparer An optional callback used to compare two elements.
 * @category Scalar
 */
export function minAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, comparer: Comparison<T> | Comparer<T> = Comparer.defaultComparer): Promise<T | undefined> {
    if (typeof comparer === "function") comparer = Comparer.create(comparer);
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!Comparer.hasInstance(comparer)) throw new TypeError("Comparer expected: comparer");
    return minByAsyncCore(source, identity, comparer);
}

/**
 * Gets the maximum element of an `AsyncIterable`, optionally comparing the keys of each element using the supplied callback.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to choose the key to compare.
 * @param keyComparer An optional callback used to compare the keys.
 * @category Scalar
 */
export function maxByAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (value: T) => K, keyComparer: Comparison<K> | Comparer<K> = Comparer.defaultComparer): Promise<T | undefined> {
    if (typeof keyComparer === "function") keyComparer = Comparer.create(keyComparer);
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!Comparer.hasInstance(keyComparer)) throw new TypeError("Comparer expected: keyComparer");
    return maxByAsyncCore(source, keySelector, keyComparer);
}

async function maxByAsyncCore<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (value: T) => K, keyComparer: Comparer<K>): Promise<T | undefined> {
    let hasResult = false;
    let result: T | undefined;
    let resultKey: K | undefined;
    for await (const element of source) {
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
 * Gets the maximum element of an `AsyncIterable`, optionally comparing elements using the supplied callback.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param comparer An optional callback used to compare two elements.
 * @category Scalar
 */
export function maxAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, comparer: Comparison<T> | Comparer<T> = Comparer.defaultComparer): Promise<T | undefined> {
    if (typeof comparer === "function") comparer = Comparer.create(comparer);
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!Comparer.hasInstance(comparer)) throw new TypeError("Comparer expected: comparer");
    return maxByAsyncCore(source, identity, comparer);
}

/**
 * Computes a scalar value indicating whether `source` contains any elements,
 * optionally filtering the elements using the supplied callback.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate An optional callback used to match each element.
 * @category Scalar
 */
export function someAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean = T): Promise<boolean> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return someAsyncCore(source, predicate);
}

async function someAsyncCore<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean): Promise<boolean> {
    for await (const element of source) {
        const result = predicate(element);
        if (typeof result === "boolean" ? result : await result) {
            return true;
        }
    }
    return false;
}

/**
 * Computes a scalar value indicating whether all elements match the supplied callback.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Scalar
 */
export function everyAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean): Promise<boolean> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return everyAsyncCore(source, predicate);
}

async function everyAsyncCore<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean): Promise<boolean> {
    let hasMatchingElements = false;
    for await (const element of source) {
        const result = predicate(element);
        if (!(typeof result === "boolean" ? result : await result)) {
            return false;
        }
        hasMatchingElements = true;
    }
    return hasMatchingElements;
}

/**
 * Unzips a sequence of tuples into a tuple of sequences.
 * @param source An `AsyncIterable` or `Iterable`
 * @category Scalar
 */
export function unzipAsync<T extends readonly any[] | []>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): Promise<{ -readonly [I in keyof T]: T[I][]; }>;
/**
 * Unzips a sequence of tuples into a tuple of sequences.
 * @param source An `AsyncIterable` or `Iterable`
 * @param partSelector A callback that converts a result into a tuple.
 * @category Scalar
 */
export function unzipAsync<T, U extends readonly any[] | []>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, partSelector: (value: T) => PromiseLike<U> | U): Promise<{ -readonly [I in keyof U]: U[I][]; }>
export function unzipAsync<T extends readonly any[] | []>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, partSelector: (value: T) => PromiseLike<T> | T = identity): Promise<any> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(partSelector)) throw new TypeError("Function expected: partSelector");
    return unzipAsyncCore(source, partSelector);
}

async function unzipAsyncCore<T extends readonly any[] | []>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, partSelector: (value: T) => PromiseLike<T> | T): Promise<any> {
    const result: any[][] = [];
    let length = -1;
    for await (const element of source) {
        const row = await partSelector(element);
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
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param callback The callback to invoke.
 * @category Scalar
 */
export function forEachAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, callback: (element: T, offset: number) => void | PromiseLike<void>): Promise<void> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(callback)) throw new TypeError("Function expected: callback");
    return forEachAsyncCore(source, callback);
}

async function forEachAsyncCore<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, callback: (element: T, offset: number) => void | PromiseLike<void>): Promise<void> {
    let offset = 0;
    for await (const element of source) {
        const result = callback(element, offset++);
        if (typeof result !== "undefined") await result;
    }
}

/**
 * Creates a Map for the elements of the `AsyncIterable`.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select a key for each element.
 * @category Scalar
 */
export function toMapAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K): Promise<Map<K, T>>;
/**
 * Creates a Map for the elements of the `AsyncIterable`.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select a key for each element.
 * @param elementSelector A callback that selects a value for each element.
 * @category Scalar
 */
export function toMapAsync<T, K, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V): Promise<Map<K, V>>;
export function toMapAsync<T, K, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<T | V> | T | V = identity) {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    return toMapAsyncCore(source, keySelector, elementSelector);
}

 async function toMapAsyncCore<T, K, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<T | V> | T | V) {
    const map = new Map<K, T | V>();
    for await (const item of source) {
        const key = keySelector(item);
        const element = await elementSelector(item);
        map.set(key, element);
    }
    return map;
}

/**
 * Creates a `HashMap` for the elements of the source.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select a key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Scalar
 */
export function toHashMapAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Promise<HashMap<K, T>>;
/**
 * Creates a `HashMap` for the elements of the source.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select a key for each element.
 * @param elementSelector A callback that selects a value for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Scalar
 */
export function toHashMapAsync<T, K, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, keyEqualer?: Equaler<K>): Promise<HashMap<K, V>>;
export function toHashMapAsync<T, K, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, elementSelector: ((element: T) => PromiseLike<T | V> | T | V) | Equaler<K> = identity, keyEqualer?: Equaler<K>) {
    if (typeof elementSelector === "object") {
        keyEqualer = elementSelector;
        elementSelector = identity;
    }
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    if (!isUndefined(keyEqualer) && !Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: keyEqualer");
    return toHashMapAsyncCore(source, keySelector, elementSelector);
}

async function toHashMapAsyncCore<T, K, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<T | V> | T | V, keyEqualer?: Equaler<K>) {
    const map = new HashMap<K, T | V>(keyEqualer);
    for await (const item of source) {
        const key = keySelector(item);
        const element = await elementSelector(item);
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
export function toSetAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): Promise<Set<T>>;
/**
 * Creates a Set for the elements of the Iterable.
 *
 * @param source An `Iterable` object.
 * @param elementSelector A callback that selects a value for each element.
 * @category Scalar
 */
export function toSetAsync<T, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, elementSelector: (element: T) => PromiseLike<V> | V): Promise<Set<V>>;
export function toSetAsync<T, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, elementSelector: (element: T) => PromiseLike<T | V> | T | V = identity) {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    return toSetAsyncCore(source, elementSelector);
}

async function toSetAsyncCore<T, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, elementSelector: (element: T) => PromiseLike<T | V> | T | V) {
    const set = new Set<T | V>();
    for await (const item of source) {
        const element = await elementSelector(item);
        set.add(element);
    }
    return set;
}

/**
 * Creates a `HashSet` for the elements of the `AsyncIterable`.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Scalar
 */
export function toHashSetAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): Promise<HashSet<T>>;
/**
 * Creates a `HashSet` for the elements of the `AsyncIterable`.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param elementSelector A callback that selects a value for each element.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Scalar
 */
export function toHashSetAsync<T, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, elementSelector: (element: T) => PromiseLike<V> | V, equaler?: Equaler<V>): Promise<HashSet<V>>;
export function toHashSetAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, elementSelector: ((element: T) => PromiseLike<T> | T) | Equaler<T> = identity, equaler?: Equaler<T>): Promise<Set<T> | HashSet<T>> {
    if (typeof elementSelector !== "function") {
        equaler = elementSelector;
        elementSelector = identity;
    }
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    if (!isUndefined(equaler) && !Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return toHashSetAsyncCore(source, elementSelector, equaler);
}

async function toHashSetAsyncCore<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, elementSelector: (element: T) => PromiseLike<T> | T = identity, equaler?: Equaler<T>): Promise<Set<T> | HashSet<T>> {
    const set = new HashSet<T>(equaler);
    for await (const item of source) {
        const element = await elementSelector(item);
        set.add(element);
    }
    return set;
}

/**
 * Creates an Array for the elements of the `AsyncIterable`.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @category Scalar
 */
export function toArrayAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): Promise<T[]>;
/**
 * Creates an Array for the elements of the `AsyncIterable`.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param elementSelector A callback that selects a value for each element.
 * @category Scalar
 */
export function toArrayAsync<T, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, elementSelector: (element: T) => PromiseLike<V> | V): Promise<V[]>;
export function toArrayAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, elementSelector: (element: T) => PromiseLike<T> | T = identity): Promise<T[]> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    return toArrayAsyncCore(source, elementSelector);
}

async function toArrayAsyncCore<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, elementSelector: (element: T) => PromiseLike<T> | T): Promise<T[]> {
    const result: T[] = [];
    for await (const item of source) {
        result.push(elementSelector === identity ? item : await elementSelector(item));
    }
    return result;
}

/**
 * Creates an Object for the elements of `source`. Properties are added via `Object.defineProperty`.
 *
 * ```ts
 * // As a regular object
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], undefined, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // function
 *
 * // with a custom prototype
 * const baseObject = { toString() { return `${this.x}:${this.y}` } };
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], baseObject, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // function
 * obj.toString(); // "x",1:"y",2
 *
 * // with a null prototype
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], null, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // undefined
 * ```
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
 * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
 * @param keySelector A callback used to select a key for each element.
 * @category Scalar
 */
export function toObjectAsync<T, TProto extends object, K extends PropertyKey>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, prototype: TProto, keySelector: (element: T) => K): Promise<TProto & Record<K, T>>;
/**
 * Creates an Object for the elements of `source`. Properties are added via `Object.defineProperty`.
 *
 * ```ts
 * // As a regular object
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], undefined, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // function
 *
 * // with a custom prototype
 * const baseObject = { toString() { return `${this.x}:${this.y}` } };
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], baseObject, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // function
 * obj.toString(); // "x",1:"y",2
 *
 * // with a null prototype
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], null, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // undefined
 * ```
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
 * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
 * @param keySelector A callback used to select a key for each element.
 * @category Scalar
 */
export function toObjectAsync<T, TProto extends object>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, prototype: TProto, keySelector: (element: T) => PropertyKey): Promise<TProto & Record<PropertyKey, T>>;
/**
 * Creates an Object for the elements of `source`. Properties are added via `Object.defineProperty`.
 *
 * ```ts
 * // As a regular object
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], undefined, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // function
 *
 * // with a custom prototype
 * const baseObject = { toString() { return `${this.x}:${this.y}` } };
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], baseObject, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // function
 * obj.toString(); // "x",1:"y",2
 *
 * // with a null prototype
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], null, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // undefined
 * ```
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
 * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
 * @param keySelector A callback used to select a key for each element.
 * @category Scalar
 */
export function toObjectAsync<T, K extends PropertyKey>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, prototype: object | null | undefined, keySelector: (element: T) => K): Promise<Record<K, T>>;
/**
 * Creates an Object for the elements of `source`. Properties are added via `Object.defineProperty`.
 *
 * ```ts
 * // As a regular object
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], undefined, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // function
 *
 * // with a custom prototype
 * const baseObject = { toString() { return `${this.x}:${this.y}` } };
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], baseObject, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // function
 * obj.toString(); // "x",1:"y",2
 *
 * // with a null prototype
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], null, a => a[0]);
 * obj.x; // ["x", 1]
 * obj.y; // ["y", 2]
 * typeof obj.toString; // undefined
 * ```
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
 * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
 * @param keySelector A callback used to select a key for each element.
 * @category Scalar
 */
export function toObjectAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, prototype: object | null | undefined, keySelector: (element: T) => PropertyKey): Promise<Record<PropertyKey, T>>;
/**
 * Creates an Object for the elements of `source`. Properties are added via `Object.defineProperty`.
 *
 * ```ts
 * // As a regular object
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], undefined, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 *
 * // with a custom prototype
 * const baseObject = { toString() { return `${this.x}:${this.y}` } };
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], baseObject, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 * obj.toString(); // 1:2
 *
 * // with a null prototype
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], null, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // undefined
 * ```
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
 * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
 * @param keySelector A callback used to select a key for each element.
 * @param elementSelector A callback that selects a value for each element.
 * @param descriptorSelector A callback that defines the `PropertyDescriptor` for each property.
 * @category Scalar
 */
export function toObjectAsync<T, TProto extends object, K extends PropertyKey, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, prototype: TProto, keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, descriptorSelector?: (key: K, value: V) => TypedPropertyDescriptor<V>): Promise<TProto & Record<K, V>>;
/**
 * Creates an Object for the elements of `source`. Properties are added via `Object.defineProperty`.
 *
 * ```ts
 * // As a regular object
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], undefined, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 *
 * // with a custom prototype
 * const baseObject = { toString() { return `${this.x}:${this.y}` } };
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], baseObject, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 * obj.toString(); // 1:2
 *
 * // with a null prototype
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], null, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // undefined
 * ```
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
 * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
 * @param keySelector A callback used to select a key for each element.
 * @param elementSelector A callback that selects a value for each element.
 * @param descriptorSelector A callback that defines the `PropertyDescriptor` for each property.
 * @category Scalar
 */
export function toObjectAsync<T, TProto extends object, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, prototype: TProto, keySelector: (element: T) => PropertyKey, elementSelector: (element: T) => PromiseLike<V> | V, descriptorSelector?: (key: PropertyKey, value: V) => TypedPropertyDescriptor<V>): Promise<TProto & Record<PropertyKey, V>>;
/**
 * Creates an Object for the elements of `source`. Properties are added via `Object.defineProperty`.
 *
 * ```ts
 * // As a regular object
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], undefined, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 *
 * // with a custom prototype
 * const baseObject = { toString() { return `${this.x}:${this.y}` } };
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], baseObject, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 * obj.toString(); // 1:2
 *
 * // with a null prototype
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], null, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // undefined
 * ```
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
 * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
 * @param keySelector A callback used to select a key for each element.
 * @param elementSelector A callback that selects a value for each element.
 * @param descriptorSelector A callback that defines the `PropertyDescriptor` for each property.
 * @category Scalar
 */
export function toObjectAsync<T, K extends PropertyKey, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, prototype: object | null | undefined, keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, descriptorSelector?: (key: K, value: V) => TypedPropertyDescriptor<V>): Promise<Record<K, V>>;
/**
 * Creates an Object for the elements of `source`. Properties are added via `Object.defineProperty`.
 *
 * ```ts
 * // As a regular object
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], undefined, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 *
 * // with a custom prototype
 * const baseObject = { toString() { return `${this.x}:${this.y}` } };
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], baseObject, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 * obj.toString(); // 1:2
 *
 * // with a null prototype
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], null, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // undefined
 * ```
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
 * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
 * @param keySelector A callback used to select a key for each element.
 * @param elementSelector A callback that selects a value for each element.
 * @param descriptorSelector A callback that defines the `PropertyDescriptor` for each property.
 * @category Scalar
 */
export function toObjectAsync<T, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, prototype: object | null | undefined, keySelector: (element: T) => PropertyKey, elementSelector: (element: T) => PromiseLike<V> | V, descriptorSelector?: (key: PropertyKey, value: V) => TypedPropertyDescriptor<V>): Promise<Record<PropertyKey, V>>;
/**
 * Creates an Object for the elements of `source`. Properties are added via `Object.defineProperty`.
 *
 * ```ts
 * // As a regular object
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], undefined, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 *
 * // with a custom prototype
 * const baseObject = { toString() { return `${this.x}:${this.y}` } };
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], baseObject, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // function
 * obj.toString(); // 1:2
 *
 * // with a null prototype
 * const obj = await toObjectAsync([Promise.resolve(["x", 1]), ["y", 2]], null, a => a[0], a => a[1]);
 * obj.x; // 1
 * obj.y; // 2
 * typeof obj.toString; // undefined
 * ```
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
 * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
 * @param keySelector A callback used to select a key for each element.
 * @param elementSelector A callback that selects a value for each element.
 * @param descriptorSelector A callback that defines the `PropertyDescriptor` for each property.
 * @category Scalar
 */
export function toObjectAsync<T, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, prototype: object | null | undefined, keySelector: (element: T) => PropertyKey, elementSelector: (element: T) => PromiseLike<V> | V, descriptorSelector?: (key: PropertyKey, value: V) => PropertyDescriptor): Promise<object>;
export function toObjectAsync<T, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, prototype: object | null = Object.prototype, keySelector: (element: T) => PropertyKey, elementSelector: (element: T) => PromiseLike<T | V> | T | V = identity, descriptorSelector: (key: PropertyKey, value: T | V) => PropertyDescriptor = makeDescriptor): Promise<object> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isObject(prototype) && prototype !== null) throw new TypeError("Object expected: prototype");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    if (!isFunction(descriptorSelector)) throw new TypeError("Function expected: descriptorSelector");
    return toObjectAsyncCore(source, prototype, keySelector, elementSelector, descriptorSelector);
}

async function toObjectAsyncCore<T, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, prototype: object | null, keySelector: (element: T) => PropertyKey, elementSelector: (element: T) => PromiseLike<V> | V, descriptorSelector: (key: PropertyKey, value: V) => PropertyDescriptor): Promise<object> {
    const obj = prototype === Object.prototype ? {} : Object.create(prototype);
    for await (const item of source) {
        const key = keySelector(item);
        const element = await elementSelector(item);
        const descriptor = descriptorSelector(key, element);
        Object.defineProperty(obj, key, descriptor);
    }
    return obj;
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
 * Creates a Lookup for the elements of the source.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select a key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Scalar
 */
export function toLookupAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Promise<Lookup<K, T>>;
/**
 * Creates a Lookup for the elements of the source.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select a key for each element.
 * @param elementSelector A callback that selects a value for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Scalar
 */
export function toLookupAsync<T, K, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, keyEqualer?: Equaler<K>): Promise<Lookup<K, V>>;
export function toLookupAsync<T, K, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, elementSelector: ((element: T) => PromiseLike<T | V> | T | V) | Equaler<K> = identity, keyEqualer: Equaler<K> = Equaler.defaultEqualer) {
    if (typeof elementSelector === "object") {
        keyEqualer = elementSelector;
        elementSelector = identity;
    }
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    if (!Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: keyEqualer");
    return toLookupAsyncCore(source, keySelector, keyEqualer, elementSelector);
}

async function toLookupAsyncCore<T, K, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer: Equaler<K>, elementSelector: (element: T) => PromiseLike<T | V> | T | V) {
    return new Lookup(await createGroupingsAsync(source, keySelector, keyEqualer, elementSelector), keyEqualer);
}

/**
 * Pass the entire source to the provided callback, returning the result.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param callback A callback function.
 * @category Sub`AsyncIterable`
 */
export function intoAsync<T, S extends AsyncIterable<T> | Iterable<PromiseLike<T> | T>, R>(source: S, callback: (source: S) => R): R {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(callback)) throw new TypeError("Function expected: callback");
    return callback(source);
}

/**
 * Computes the sum for a series of numbers.
 * NOTE: If any element is not a `number`, this overload will throw.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @category Scalar
 */
export function sumAsync(source: AsyncIterable<number> | Iterable<PromiseLike<number> | number>): Promise<number>;
/**
 * Computes the sum for a series of numbers.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param elementSelector A callback used to convert a value in `source` to a number.
 * @category Scalar
 */
export function sumAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, elementSelector: (element: T) => PromiseLike<number> | number): Promise<number>;
export function sumAsync(source: AsyncIterable<number> | Iterable<PromiseLike<number> | number>, elementSelector: (element: number) => PromiseLike<number> | number = identity): Promise<number> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    return sumAsyncCore(source, elementSelector);
}

async function sumAsyncCore(source: AsyncIterable<number> | Iterable<PromiseLike<number> | number>, elementSelector: (element: number) => PromiseLike<number> | number): Promise<number> {
    let sum = 0;
    for await (const element of source) {
        const value = elementSelector(element);
        const result = typeof value === "number" ? value : await value;
        if (!isNumber(result)) throw new TypeError("Number expected");
        sum += result;
    }
    return sum;
}

/**
 * Computes the average for a series of numbers.
 * NOTE: If any element is not a `number`, this overload will throw.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @category Scalar
 */
export function averageAsync(source: AsyncIterable<number> | Iterable<PromiseLike<number> | number>): Promise<number>;
/**
 * Computes the average for a series of numbers.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param elementSelector A callback used to convert a value in `source` to a number.
 * @category Scalar
 */
export function averageAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, elementSelector: (element: T) => PromiseLike<number> | number): Promise<number>;
export function averageAsync(source: AsyncIterable<number> | Iterable<PromiseLike<number> | number>, elementSelector: (element: number) => PromiseLike<number> | number = identity): Promise<number> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    return averageAsyncCore(source, elementSelector);
}

async function averageAsyncCore(source: AsyncIterable<number> | Iterable<PromiseLike<number> | number>, elementSelector: (element: number) => PromiseLike<number> | number): Promise<number> {
    let sum = 0;
    let count = 0;
    for await (const element of source) {
        const value = elementSelector(element);
        const result = typeof value === "number" ? value : await value;
        if (!isNumber(result)) throw new TypeError("Number expected");
        sum += result;
        count++;
    }
    return count > 0 ? sum / count : 0;
}

const noCacheAndLeaveOpen: ConsumeAsyncOptions = { cacheElements: false, leaveOpen: true };
const cacheAndClose: ConsumeAsyncOptions = { cacheElements: true, leaveOpen: false };

/**
 * Creates a tuple whose first element is an `Iterable` containing the first span of
 * elements that match the supplied predicate, and whose second element is an `AsyncIterable`
 * containing the remaining elements.
 *
 * The first `Iterable` is eagerly evaluated, while the second `AsyncIterable` is lazily
 * evaluated.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate The predicate used to match elements.
 * @category Scalar
 */
export function spanAsync<TNode, T extends TNode, U extends T>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (element: T, offset: number) => element is U): Promise<[HierarchyIterable<TNode, U>, AsyncHierarchyIterable<TNode, T>]>;
/**
 * Creates a tuple whose first element is an `Iterable` containing the first span of
 * elements that match the supplied predicate, and whose second element is an `AsyncIterable`
 * containing the remaining elements.
 *
 * The first `Iterable` is eagerly evaluated, while the second `AsyncIterable` is lazily
 * evaluated.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate The predicate used to match elements.
 * @category Scalar
 */
export function spanAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): Promise<[HierarchyIterable<TNode, T>, AsyncHierarchyIterable<TNode, T>]>;
/**
 * Creates a tuple whose first element is an `Iterable` containing the first span of
 * elements that match the supplied predicate, and whose second element is an `AsyncIterable`
 * containing the remaining elements.
 *
 * The first `Iterable` is eagerly evaluated, while the second `AsyncIterable` is lazily
 * evaluated.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate The predicate used to match elements.
 * @category Scalar
 */
export function spanAsync<T, U extends T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T, offset: number) => element is U): Promise<[Iterable<U>, AsyncIterable<T>]>;
/**
 * Creates a tuple whose first element is an `Iterable` containing the first span of
 * elements that match the supplied predicate, and whose second element is an `AsyncIterable`
 * containing the remaining elements.
 *
 * The first `Iterable` is eagerly evaluated, while the second `AsyncIterable` is lazily
 * evaluated.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate The predicate used to match elements.
 * @category Scalar
 */
export function spanAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): Promise<[Iterable<T>, AsyncIterable<T>]>;
export function spanAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): Promise<[Iterable<T>, AsyncIterable<T>]> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return spanAsyncCore(source, predicate);
}

async function spanAsyncCore<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): Promise<[Iterable<T>, AsyncIterable<T>]> {
    const prefix: T[] = [];
    const iterator = toAsyncIterable(source)[Symbol.asyncIterator]();
    let offset = 0;
    for await (const value of consumeAsync(iterator, noCacheAndLeaveOpen)) {
        const result = predicate(value, offset++);
        if (!(typeof result === "boolean" ? result : await result)) {
            const remaining = prependAsync(consumeAsync(iterator, cacheAndClose), value);
            return [
                flowHierarchy({ [Symbol.iterator]() { return prefix[Symbol.iterator](); } }, source),
                flowHierarchy(remaining, source),
            ];
        }
        prefix.push(value);
    }
    return [
        flowHierarchy({ [Symbol.iterator]() { return prefix[Symbol.iterator](); } }, source),
        flowHierarchy(emptyAsync<T>(), source),
    ];
}

/**
 * Creates a tuple whose first element is an `Iterable` containing the first span of
 * elements that do not match the supplied predicate, and whose second element is an `AsyncIterable`
 * containing the remaining elements.
 *
 * The first `Iterable` is eagerly evaluated, while the second `AsyncIterable` is lazily
 * evaluated.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate The predicate used to match elements.
 * @category Scalar
 */
export function spanUntilAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): Promise<[HierarchyIterable<T>, AsyncHierarchyIterable<T>]>;
/**
 * Creates a tuple whose first element is an `Iterable` containing the first span of
 * elements that do not match the supplied predicate, and whose second element is an `Iterable`
 * containing the remaining elements.
 *
 * The first `Iterable` is eagerly evaluated, while the second `AsyncIterable` is lazily
 * evaluated.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate The predicate used to match elements.
 * @category Scalar
 */
export function spanUntilAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): Promise<[Iterable<T>, AsyncIterable<T>]>;
export function spanUntilAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): Promise<[Iterable<T>, AsyncIterable<T>]> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return spanUntilAsyncCore(source, predicate);
}

async function spanUntilAsyncCore<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): Promise<[Iterable<T>, AsyncIterable<T>]> {
    const prefix: T[] = [];
    const iterator = toAsyncIterable(source)[Symbol.asyncIterator]();
    let offset = 0;
    for await (const value of consumeAsync(iterator, noCacheAndLeaveOpen)) {
        const result = predicate(value, offset++);
        if (typeof result === "boolean" ? result : await result) {
            const remaining = prependAsync(consumeAsync(iterator, cacheAndClose), value);
            return [
                flowHierarchy({ [Symbol.iterator]() { return prefix[Symbol.iterator](); } }, source),
                flowHierarchy(remaining, source),
            ];
        }
        prefix.push(value);
    }
    return [
        flowHierarchy({ [Symbol.iterator]() { return prefix[Symbol.iterator](); } }, source),
        flowHierarchy(emptyAsync<T>(), source),
    ];
}

/**
 * Computes a scalar value indicating whether the key for every element in `left` corresponds to a matching key
 * in `right` at the same position.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @category Scalar
 */
export function correspondsByAsync<T, K>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K): Promise<boolean>;
/**
 * Computes a scalar value indicating whether the key for every element in `left` corresponds to a matching key
 * in `right` at the same position.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param leftKeySelector A callback used to select the key for each element in `left`.
 * @param rightKeySelector A callback used to select the key for each element in `right`.
 * @param keyEqualer An optional callback used to compare the equality of two keys.
 * @category Scalar
 */
export function correspondsByAsync<T, U, K>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>, leftKeySelector: (element: T) => K, rightKeySelector: (element: U) => K, keyEqualer?: EqualityComparison<K> | Equaler<K>): Promise<boolean>;
export function correspondsByAsync<T, K>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, leftKeySelector: (element: T) => K, rightKeySelector: (element: T) => K = leftKeySelector, keyEqualer: EqualityComparison<K> | Equaler<K> = Equaler.defaultEqualer): Promise<boolean> {
    if (isFunction(keyEqualer)) keyEqualer = Equaler.create(keyEqualer);
    if (!isAsyncIterableObject(left) && !isIterableObject(left)) throw new TypeError("AsyncIterable expected: left");
    if (!isAsyncIterableObject(right) && !isIterableObject(right)) throw new TypeError("AsyncIterable expected: right");
    if (!isFunction(leftKeySelector)) throw new TypeError("Function expected: leftKeySelector");
    if (!isFunction(rightKeySelector)) throw new TypeError("Function expected: rightKeySelector");
    if (!Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: keyEqualer");
    return correspondsByAsyncCore(left, right, leftKeySelector, rightKeySelector, keyEqualer);
}

async function correspondsByAsyncCore<T, K>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, leftKeySelector: (element: T) => K, rightKeySelector: (element: T) => K, keyEqualer: Equaler<K>): Promise<boolean> {
    const leftIterator = toAsyncIterable(left)[Symbol.asyncIterator]();
    let leftDone: boolean | undefined = false;
    let leftValue: T;
    try {
        const rightIterator = toAsyncIterable(right)[Symbol.asyncIterator]();
        let rightDone: boolean | undefined = false;
        let rightValue: T;
        try {
            for (;;) {
                ({ done: leftDone = false, value: leftValue } = await leftIterator.next());
                ({ done: rightDone = false, value: rightValue } = await rightIterator.next());
                if (leftDone && rightDone) return true;
                if (Boolean(leftDone) !== Boolean(rightDone) || !keyEqualer.equals(leftKeySelector(leftValue), rightKeySelector(rightValue))) return false;
            }
        }
        finally {
            if (!rightDone) await rightIterator?.return?.();
        }
    }
    finally {
        if (!leftDone) await leftIterator?.return?.();
    }
}

/**
 * Computes a scalar value indicating whether every element in `left` corresponds to a matching element
 * in `right` at the same position.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param equaler An optional callback used to compare the equality of two elements.
 * @category Scalar
 */
export function correspondsAsync<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: EqualityComparison<T> | Equaler<T>): Promise<boolean>;
/**
 * Computes a scalar value indicating whether every element in `left` corresponds to a matching element
 * in `right` at the same position.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param equaler An optional callback used to compare the equality of two elements.
 * @category Scalar
 */
export function correspondsAsync<T, U>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>, equaler: (left: T, right: U) => boolean): Promise<boolean>;
export function correspondsAsync<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler: EqualityComparison<T> | Equaler<T> = Equaler.defaultEqualer): Promise<boolean> {
    if (isFunction(equaler)) equaler = Equaler.create(equaler);
    if (!isAsyncIterableObject(left) && !isIterableObject(left)) throw new TypeError("AsyncIterable expected: left");
    if (!isAsyncIterableObject(right) && !isIterableObject(right)) throw new TypeError("AsyncIterable expected: right");
    if (!Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return correspondsByAsyncCore(left, right, identity, identity, equaler);
}

/**
 * Finds the value at the provided offset. A negative offset starts from the
 * last element.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param offset An offset from the start of the iterable.
 * @category Scalar
 */
export function elementAtAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, offset: number | Index): Promise<T | undefined> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
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
    return elementAtAsyncCore(source, offset, isFromEnd);
}

async function elementAtAsyncCore<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, offset: number, isFromEnd: boolean): Promise<T | undefined> {
    if (isFromEnd) {
        if (offset === 0) {
            return undefined;
        }
        if (offset === 1) {
            return lastAsync(source);
        }
        const array: T[] = [];
        for await (const element of source) {
            if (array.length >= offset) {
                array.shift();
            }
            array.push(element);
        }
        return array.length - offset >= 0 ? array[array.length - offset] : undefined;
    }
    for await (const element of source) {
        if (offset === 0) {
            return element;
        }
        offset--;
    }
    return undefined;
}

export { elementAtAsync as nthAsync };

/**
 * Computes a scalar value indicating whether the elements of this `AsyncIterable` start
 * with the same sequence of elements in another `AsyncIterable`.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param equaler A callback or `Equaler` object used to compare the equality of two elements.
 * @category Scalar
 */
export function startsWithAsync<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: EqualityComparison<T> | Equaler<T>): Promise<boolean>;
/**
 * Computes a scalar value indicating whether the elements of this `AsyncIterable` start
 * with the same sequence of elements in another `AsyncIterable`.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param equaler A callback or `Equaler` object used to compare the equality of two elements.
 * @category Scalar
 */
export function startsWithAsync<T, U>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>, equaler: (left: T, right: U) => boolean): Promise<boolean>;
export function startsWithAsync<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler: EqualityComparison<T> | Equaler<T> = Equaler.defaultEqualer): Promise<boolean> {
    if (isFunction(equaler)) equaler = Equaler.create(equaler);
    if (!isAsyncIterableObject(left) && !isIterableObject(left)) throw new TypeError("AsyncIterable expected: left");
    if (!isAsyncIterableObject(right) && !isIterableObject(right)) throw new TypeError("AsyncIterable expected: right");
    if (!Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return startsWithAsyncCore(left, right, equaler);
}

async function startsWithAsyncCore<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler: Equaler<T>): Promise<boolean> {
    const leftIterator = toAsyncIterable(left)[Symbol.asyncIterator]();
    let leftDone: boolean | undefined = false;
    let leftValue: T;
    try {
        const rightIterator = toAsyncIterable(right)[Symbol.asyncIterator]();
        let rightDone: boolean | undefined = false;
        let rightValue: T;
        try {
            for (;;) {
                ({ done: leftDone, value: leftValue } = await leftIterator.next());
                ({ done: rightDone, value: rightValue } = await rightIterator.next());
                if (rightDone) return true;
                if (leftDone || !equaler.equals(leftValue, rightValue)) return false;
            }
        }
        finally {
            if (!rightDone) await rightIterator.return?.();
        }
    }
    finally {
        if (!leftDone) await leftIterator.return?.();
    }
}

/**
 * Computes a scalar value indicating whether the elements of `left` end
 * with the same sequence of elements in `right`.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param equaler An optional callback used to compare the equality of two elements.
 * @category Scalar
 */
export function endsWithAsync<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: EqualityComparison<T> | Equaler<T>): Promise<boolean>;
/**
 * Computes a scalar value indicating whether the elements of `left` end
 * with the same sequence of elements in `right`.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param equaler An optional callback used to compare the equality of two elements.
 * @category Scalar
 */
export function endsWithAsync<T, U>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>, equaler: (left: T, right: U) => boolean): Promise<boolean>;
export function endsWithAsync<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler: EqualityComparison<T> | Equaler<T> = Equaler.defaultEqualer): Promise<boolean> {
    if (isFunction(equaler)) equaler = Equaler.create(equaler);
    if (!isAsyncIterableObject(left) && !isIterableObject(left)) throw new TypeError("AsyncIterable expected: left");
    if (!isAsyncIterableObject(right) && !isIterableObject(right)) throw new TypeError("AsyncIterable expected: right");
    if (!Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return endsWithAsyncCore(left, right, equaler);
}

async function endsWithAsyncCore<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler: Equaler<T>): Promise<boolean> {
    const rightArray = await toArrayAsync(right);
    const numElements = rightArray.length;
    if (numElements <= 0) {
        return true;
    }
    const leftArray = await toArrayAsync(takeRightAsync(left, numElements));
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
 * Computes a scalar value indicating whether the provided value is included in an `AsyncIterable`.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param value A value.
 * @param equaler An optional callback used to compare the equality of two elements.
 * @category Scalar
 */
export function includesAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, value: T, equaler?: EqualityComparison<T> | Equaler<T>): Promise<boolean>;
/**
 * Computes a scalar value indicating whether the provided value is included in an `AsyncIterable`.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param value A value.
 * @param equaler An optional callback used to compare the equality of two elements.
 * @category Scalar
 */
export function includesAsync<T, U>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, value: U, equaler: (left: T, right: U) => boolean): Promise<boolean>;
export function includesAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, value: T, equaler: EqualityComparison<T> | Equaler<T> = Equaler.defaultEqualer): Promise<boolean> {
    if (isFunction(equaler)) equaler = Equaler.create(equaler);
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return includesAsyncCore(source, value, equaler);
}

async function includesAsyncCore<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, value: T, equaler: Equaler<T>): Promise<boolean> {
    for await (const element of source) {
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
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param equaler A callback used to compare the equality of two elements.
 * @category Scalar
 */
export function includesSequenceAsync<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: EqualityComparison<T> | Equaler<T>): Promise<boolean>;
/**
 * Computes a scalar value indicating whether the elements of `left` include
 * an exact sequence of elements from `right`.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param equaler A callback used to compare the equality of two elements.
 * @category Scalar
 */
export function includesSequenceAsync<T, U>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>, equaler: (left: T, right: U) => boolean): Promise<boolean>;
export function includesSequenceAsync<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler: EqualityComparison<T> | Equaler<T> = Equaler.defaultEqualer): Promise<boolean> {
    if (isFunction(equaler)) equaler = Equaler.create(equaler);
    if (!isAsyncIterableObject(left) && !isIterableObject(left)) throw new TypeError("AsyncIterable expected: left");
    if (!isAsyncIterableObject(right) && !isIterableObject(right)) throw new TypeError("AsyncIterable expected: right");
    if (!Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return includesSequenceAsyncCore(left, right, equaler);
}

async function includesSequenceAsyncCore<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler: Equaler<T>): Promise<boolean> {
    const rightArray = await toArrayAsync(right);
    const numRightElements = rightArray.length;
    if (numRightElements <= 0) {
        return true;
    }
    const span: T[] = [];
    for await (const leftValue of toAsyncIterable(left)) {
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
 * Writes each element of a source iterable to a destination array.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param collection The destination array or `IndexedCollection`.
 * @param start The offset into the array at which to start writing.
 * @param count The number of elements to write to the array.
 * @category Scalar
 */
export function copyToAsync<T, U extends IndexedCollection<T> | T[]>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, collection: U, start: number = 0, count?: number): Promise<U> {
    const target = IndexedCollection.hasInstance(collection) ? collection :
        Array.isArray(collection) ? new ArrayWrapper<T>(collection) :
        undefined;

    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
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
    return copyToAsyncCore(source, collection, target, start, count);
}

async function copyToAsyncCore<T, U extends IndexedCollection<T> | T[]>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, collection: U, target: Pick<IndexedCollection<T>, typeof IndexedCollection.size | typeof IndexedCollection.setAt>, start: number, count: number): Promise<U> {
    if (count > 0) {
        for await (const element of source) {
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
