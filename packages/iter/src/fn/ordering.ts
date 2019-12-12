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

import * as assert from "../internal/assert";
import { Comparer, Comparison } from "@esfx/equatable";
import { OrderedIterable } from "../ordered";
import { toArray } from './scalars';
import { flowHierarchy } from '../internal/utils';
import { HierarchyIterable, OrderedHierarchyIterable } from '../hierarchy';

class ReverseIterable<T> implements Iterable<T> {
    private _source: Iterable<T>;

    constructor(source: Iterable<T>) {
        this._source = source;
    }

    *[Symbol.iterator](): Iterator<T> {
        const list = toArray<T>(this._source);
        list.reverse();
        yield* list;
    }
}

/**
 * Creates a subquery whose elements are in the reverse order.
 * @category Ordering
 */
export function reverse<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>): HierarchyIterable<TNode, T>;
/**
 * Creates a subquery whose elements are in the reverse order.
 * @category Ordering
 */
export function reverse<T>(source: Iterable<T>): Iterable<T>;
export function reverse<T>(source: Iterable<T>): Iterable<T> {
    assert.mustBeIterable(source, "source");
    return flowHierarchy(new ReverseIterable(source), source);
}

class OrderByIterable<T, K> implements OrderedIterable<T> {
    private _source: Iterable<T>;
    private _keySelector: (element: T) => K;
    private _keyComparer: Comparer<K>;
    private _descending: boolean;
    private _parent?: OrderByIterable<T, any>;

    constructor(source: Iterable<T>, keySelector: (element: T) => K, keyComparer: Comparer<K>, descending: boolean, parent?: OrderByIterable<T, any>) {
        this._source = source;
        this._keySelector = keySelector;
        this._keyComparer = keyComparer;
        this._descending = descending;
        this._parent = parent;
    }

    *[Symbol.iterator](): Iterator<T> {
        const source = this._source;
        const array = toArray<T>(source);
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

    [OrderedIterable.thenBy]<K>(keySelector: (element: T) => K, keyComparer: Comparison<K> | Comparer<K>, descending: boolean): OrderedIterable<T> {
        if (typeof keyComparer === "function") keyComparer = Comparer.create(keyComparer);
        assert.mustBeFunction(keySelector, "keySelector");
        assert.mustBeComparer(keyComparer, "keyComparer");
        assert.mustBeBoolean(descending, "descending");
        return new OrderByIterable(this._source, keySelector, keyComparer, descending, this);
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
 * Creates an `OrderedIterable` whose elements are sorted in ascending order by the provided key.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyComparer An optional callback used to compare two keys.
 * @category Order
 */
export function orderBy<TNode, T extends TNode, K>(source: HierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): OrderedHierarchyIterable<TNode, T>;
/**
 * Creates an `OrderedIterable` whose elements are sorted in ascending order by the provided key.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyComparer An optional callback used to compare two keys.
 * @category Order
 */
export function orderBy<T, K>(source: Iterable<T>, keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): OrderedIterable<T>;
export function orderBy<T, K>(source: Iterable<T>, keySelector: (element: T) => K, keyComparer: Comparison<K> | Comparer<K> = Comparer.defaultComparer): OrderedIterable<T> {
    if (typeof keyComparer === "function") keyComparer = Comparer.create(keyComparer);
    assert.mustBeIterable(source, "source");
    assert.mustBeFunction(keySelector, "keySelector");
    assert.mustBeComparer(keyComparer, "keyComparer");
    return flowHierarchy(new OrderByIterable(source, keySelector, keyComparer, /*descending*/ false), source);
}

/**
 * Creates an `OrderedIterable` whose elements are sorted in descending order by the provided key.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyComparer An optional callback used to compare two keys.
 * @category Order
 */
export function orderByDescending<TNode, T extends TNode, K>(source: HierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): OrderedHierarchyIterable<TNode, T>;
/**
 * Creates an `OrderedIterable` whose elements are sorted in descending order by the provided key.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyComparer An optional callback used to compare two keys.
 * @category Order
 */
export function orderByDescending<T, K>(source: Iterable<T>, keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): OrderedIterable<T>;
export function orderByDescending<T, K>(source: Iterable<T>, keySelector: (element: T) => K, keyComparer: Comparison<K> | Comparer<K> = Comparer.defaultComparer): OrderedIterable<T> {
    if (typeof keyComparer === "function") keyComparer = Comparer.create(keyComparer);
    assert.mustBeIterable(source, "source");
    assert.mustBeFunction(keySelector, "keySelector");
    assert.mustBeComparer(keyComparer, "keyComparer");
    return flowHierarchy(new OrderByIterable(source, keySelector, keyComparer, /*descending*/ true), source);
}

/**
 * Creates a subsequent `OrderedIterable` whose elements are also sorted in ascending order by the provided key.
 *
 * @param source An `OrderedIterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyComparer An optional callback used to compare two keys.
 * @category Order
 */
export function thenBy<TNode, T extends TNode, K>(source: OrderedHierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): OrderedHierarchyIterable<TNode, T>;
/**
 * Creates a subsequent `OrderedIterable` whose elements are also sorted in ascending order by the provided key.
 *
 * @param source An `OrderedIterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyComparer An optional callback used to compare two keys.
 * @category Order
 */
export function thenBy<T, K>(source: OrderedIterable<T>, keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): OrderedIterable<T>;
export function thenBy<T, K>(source: OrderedIterable<T>, keySelector: (element: T) => K, keyComparer: Comparison<K> | Comparer<K> = Comparer.defaultComparer): OrderedIterable<T> {
    if (typeof keyComparer === "function") keyComparer = Comparer.create(keyComparer);
    assert.mustBeOrderedIterable(source, "source");
    assert.mustBeFunction(keySelector, "keySelector");
    assert.mustBeComparer(keyComparer, "keyComparer");
    return flowHierarchy(source[OrderedIterable.thenBy](keySelector, keyComparer, /*descending*/ false), source);
}

/**
 * Creates a subsequent `OrderedIterable` whose elements are also sorted in descending order by the provided key.
 *
 * @param source An `OrderedIterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyComparer An optional callback used to compare two keys.
 * @category Order
 */
export function thenByDescending<TNode, T extends TNode, K>(source: OrderedHierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): OrderedHierarchyIterable<TNode, T>;
/**
 * Creates a subsequent `OrderedIterable` whose elements are also sorted in descending order by the provided key.
 *
 * @param source An `OrderedIterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyComparer An optional callback used to compare two keys.
 * @category Order
 */
export function thenByDescending<T, K>(source: OrderedIterable<T>, keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): OrderedIterable<T>;
export function thenByDescending<T, K>(source: OrderedIterable<T>, keySelector: (element: T) => K, keyComparer: Comparison<K> | Comparer<K> = Comparer.defaultComparer): OrderedIterable<T> {
    if (typeof keyComparer === "function") keyComparer = Comparer.create(keyComparer);
    assert.mustBeOrderedIterable(source, "source");
    assert.mustBeFunction(keySelector, "keySelector");
    assert.mustBeComparer(keyComparer, "keyComparer");
    return flowHierarchy(source[OrderedIterable.thenBy](keySelector, keyComparer, /*descending*/ true), source);
}
