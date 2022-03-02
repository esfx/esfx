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

import /*#__INLINE__*/ { isAsyncIterableObject, isBoolean, isFunction, isIterableObject } from '@esfx/internal-guards';
import { AsyncHierarchyIterable, AsyncOrderedHierarchyIterable } from '@esfx/async-iter-hierarchy';
import { AsyncOrderedIterable } from "@esfx/async-iter-ordered";
import { toAsyncOrderedIterable } from "@esfx/async-iter-ordered-fromsync";
import { Comparer, Comparison } from "@esfx/equatable";
import { HierarchyIterable, OrderedHierarchyIterable } from '@esfx/iter-hierarchy';
import { OrderedIterable } from "@esfx/iter-ordered";
import { flowHierarchy } from './internal/utils';
import { toArrayAsync } from './scalars';

class AsyncReverseIterable<T> implements AsyncIterable<T> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>) {
        this._source = source;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const list = await toArrayAsync(this._source);
        list.reverse();
        yield* list;
    }
}

/**
 * Creates an `AsyncIterable` whose elements are in the reverse order.
 * @category Subquery
 */
export function reverseAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` whose elements are in the reverse order.
 * @category Subquery
 */
export function reverseAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncIterable<T>;
export function reverseAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    return flowHierarchy(new AsyncReverseIterable(source), source);
}

class AsyncOrderByIterable<T, K> implements AsyncOrderedIterable<T> {
    protected _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _keySelector: (element: T) => K;
    private _keyComparer: Comparer<K>;
    private _descending: boolean;
    private _parent?: AsyncOrderByIterable<T, any>;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyComparer: Comparer<K>, descending: boolean, parent?: AsyncOrderByIterable<T, any>) {
        this._source = source;
        this._keySelector = keySelector;
        this._keyComparer = keyComparer;
        this._descending = descending;
        this._parent = parent;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const source = this._source;
        const array = await toArrayAsync(source);
        const sorter = this._getSorter(array);
        const len = array.length;
        const indices = new Array<number>(len);
        for (let i = 0; i < len; ++i) {
            indices[i] = i;
        }
        indices.sort(sorter);
        for (const index of indices) {
            yield array[index];
        }
    }

    [AsyncOrderedIterable.thenByAsync]<K>(keySelector: (element: T) => K, keyComparer: Comparison<K> | Comparer<K>, descending: boolean): AsyncOrderedIterable<T> {
        if (isFunction(keyComparer)) keyComparer = Comparer.create(keyComparer);
        if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
        if (!Comparer.hasInstance(keyComparer)) throw new TypeError("Comparer expected: keyComparer");
        if (!isBoolean(descending)) throw new TypeError("Boolean expected: descending");
        return new AsyncOrderByIterable(this._source, keySelector, keyComparer, descending, this);
    }

    private _getSorter(elements: T[], next?: (x: number, y: number) => number): (x: number, y: number) => number {
        const keySelector = this._keySelector;
        const comparer = this._keyComparer;
        const descending = this._descending;
        const parent = this._parent;
        const keys = elements.map(keySelector);
        const sorter = (x: number, y: number): number => {
            const result = comparer.compare(keys[x], keys[y]);
            if (result === 0) {
                return next ? next(x, y) : x - y;
            }
            return descending ? -result : result;
        };
        return parent ? parent._getSorter(elements, sorter) : sorter;
    }
}

/**
 * Creates an `AsyncOrderedIterable` whose elements are sorted in ascending order by the provided key.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyComparer An optional callback used to compare two keys.
 * @category Order
 */
export function orderByAsync<TNode, T extends TNode, K>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): AsyncOrderedHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncOrderedIterable` whose elements are sorted in ascending order by the provided key.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyComparer An optional callback used to compare two keys.
 * @category Order
 */
export function orderByAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): AsyncOrderedIterable<T>;
export function orderByAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyComparer: Comparison<K> | Comparer<K> = Comparer.defaultComparer): AsyncOrderedIterable<T> {
    if (isFunction(keyComparer)) keyComparer = Comparer.create(keyComparer);
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!Comparer.hasInstance(keyComparer)) throw new TypeError("Comparer expected: keyComparer");
    return flowHierarchy(new AsyncOrderByIterable(source, keySelector, keyComparer, /*descending*/ false), source);
}

/**
 * Creates an `AsyncOrderedIterable` whose elements are sorted in descending order by the provided key.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyComparer An optional callback used to compare two keys.
 * @category Order
 */
export function orderByDescendingAsync<TNode, T extends TNode, K>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): AsyncOrderedHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncOrderedIterable` whose elements are sorted in descending order by the provided key.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyComparer An optional callback used to compare two keys.
 * @category Order
 */
export function orderByDescendingAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): AsyncOrderedIterable<T>;
export function orderByDescendingAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyComparer: Comparison<K> | Comparer<K> = Comparer.defaultComparer): AsyncOrderedIterable<T> {
    if (isFunction(keyComparer)) keyComparer = Comparer.create(keyComparer);
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!Comparer.hasInstance(keyComparer)) throw new TypeError("Comparer expected: keyComparer");
    return flowHierarchy(new AsyncOrderByIterable(source, keySelector, keyComparer, /*descending*/ true), source);
}

/**
 * Creates a subsequent `AsyncOrderedIterable` whose elements are also sorted in ascending order by the provided key.
 *
 * @param source An `AsyncOrderedIterable` or `OrderedIterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyComparer An optional callback used to compare two keys.
 * @category Order
 */
export function thenByAsync<TNode, T extends TNode, K>(source: AsyncOrderedHierarchyIterable<TNode, T> | OrderedHierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): AsyncOrderedHierarchyIterable<TNode, T>;
/**
 * Creates a subsequent `AsyncOrderedIterable` whose elements are also sorted in ascending order by the provided key.
 *
 * @param source An `AsyncOrderedIterable` or `OrderedIterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyComparer An optional callback used to compare two keys.
 * @category Order
 */
export function thenByAsync<T, K>(source: AsyncOrderedIterable<T> | OrderedIterable<T>, keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): AsyncOrderedIterable<T>;
export function thenByAsync<T, K>(source: AsyncOrderedIterable<T> | OrderedIterable<T>, keySelector: (element: T) => K, keyComparer: Comparison<K> | Comparer<K> = Comparer.defaultComparer): AsyncOrderedIterable<T> {
    if (isFunction(keyComparer)) keyComparer = Comparer.create(keyComparer);
    if (!AsyncOrderedIterable.hasInstance(source) && !OrderedIterable.hasInstance(source)) throw new TypeError("AsyncOrderedIterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!Comparer.hasInstance(keyComparer)) throw new TypeError("Comparer expected: keyComparer");
    return flowHierarchy(toAsyncOrderedIterable(source)[AsyncOrderedIterable.thenByAsync](keySelector, keyComparer, /*descending*/ false), source);
}

/**
 * Creates a subsequent `AsyncOrderedIterable` whose elements are also sorted in descending order by the provided key.
 *
 * @param source An `AsyncOrderedIterable` or `OrderedIterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyComparer An optional callback used to compare two keys.
 * @category Order
 */
export function thenByDescendingAsync<TNode, T extends TNode, K>(source: AsyncOrderedHierarchyIterable<TNode, T> | OrderedHierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): AsyncOrderedHierarchyIterable<TNode, T>;
/**
 * Creates a subsequent `AsyncOrderedIterable` whose elements are also sorted in descending order by the provided key.
 *
 * @param source An `AsyncOrderedIterable` or `OrderedIterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyComparer An optional callback used to compare two keys.
 * @category Order
 */
export function thenByDescendingAsync<T, K>(source: AsyncOrderedIterable<T> | OrderedIterable<T>, keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): AsyncOrderedIterable<T>;
export function thenByDescendingAsync<T, K>(source: AsyncOrderedIterable<T> | OrderedIterable<T>, keySelector: (element: T) => K, keyComparer: Comparison<K> | Comparer<K> = Comparer.defaultComparer): AsyncOrderedIterable<T> {
    if (isFunction(keyComparer)) keyComparer = Comparer.create(keyComparer);
    if (!AsyncOrderedIterable.hasInstance(source) && !OrderedIterable.hasInstance(source)) throw new TypeError("AsyncOrderedIterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!Comparer.hasInstance(keyComparer)) throw new TypeError("Comparer expected: keyComparer");
    return flowHierarchy(toAsyncOrderedIterable(source)[AsyncOrderedIterable.thenByAsync](keySelector, keyComparer, /*descending*/ true), source);
}
