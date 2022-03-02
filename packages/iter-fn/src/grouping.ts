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

import /*#__INLINE__*/ { isFunction, isIterableObject, isNumber, isPositiveNonZeroFiniteNumber, isUndefined } from "@esfx/internal-guards";
import { HashMap } from "@esfx/collections-hashmap";
import { Equaler } from "@esfx/equatable";
import { identity } from '@esfx/fn';
import { Grouping, HierarchyGrouping } from "@esfx/iter-grouping";
import { HierarchyIterable } from '@esfx/iter-hierarchy';
import { Page, HierarchyPage } from "@esfx/iter-page";
import { flowHierarchy } from './internal/utils';

class PageByIterable<T, R> implements Iterable<R> {
    private _source: Iterable<T>;
    private _pageSize: number;
    private _pageSelector: (page: number, offset: number, values: Iterable<T>) => R;

    constructor(source: Iterable<T>, pageSize: number, pageSelector: (page: number, offset: number, values: Iterable<T>) => R) {
        this._source = source;
        this._pageSize = pageSize;
        this._pageSelector = pageSelector;
    }

    *[Symbol.iterator](): Iterator<R> {
        const source = this._source;
        const pageSize = this._pageSize;
        const pageSelector = this._pageSelector;
        let elements: T[] = [];
        let page = 0;
        for (const value of source) {
            elements.push(value);
            if (elements.length >= pageSize) {
                yield pageSelector(page, page * pageSize, flowHierarchy(elements, source));
                elements = [];
                page++;
            }
        }
        if (elements.length > 0) {
            yield pageSelector(page, page * pageSize, flowHierarchy(elements, source));
        }
    }
}

/**
 * Creates an `Iterable` that splits an `Iterable` into one or more pages.
 * While advancing from page to page is evaluated lazily, the elements of the page are
 * evaluated eagerly.
 *
 * @param source An `Iterable` object.
 * @param pageSize The number of elements per page.
 * @category Subquery
 */
export function pageBy<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, pageSize: number): Iterable<HierarchyPage<TNode, T>>;
/**
 * Creates an `Iterable` that splits an `Iterable` into one or more pages.
 * While advancing from page to page is evaluated lazily, the elements of the page are
 * evaluated eagerly.
 *
 * @param source An `Iterable` object.
 * @param pageSize The number of elements per page.
 * @param pageSelector A callback used to create a result for a page.
 * @category Subquery
 */
export function pageBy<TNode, T extends TNode, R>(source: HierarchyIterable<TNode, T>, pageSize: number, pageSelector: (page: number, offset: number, values: HierarchyIterable<TNode, T>) => R): Iterable<R>;
/**
 * Creates an `Iterable` that splits an `Iterable` into one or more pages.
 * While advancing from page to page is evaluated lazily, the elements of the page are
 * evaluated eagerly.
 *
 * @param source An `Iterable` object.
 * @param pageSize The number of elements per page.
 * @category Subquery
 */
export function pageBy<T>(source: Iterable<T>, pageSize: number): Iterable<Page<T>>;
/**
 * Creates an `Iterable` that splits an `Iterable` into one or more pages.
 * While advancing from page to page is evaluated lazily, the elements of the page are
 * evaluated eagerly.
 *
 * @param source An `Iterable` object.
 * @param pageSize The number of elements per page.
 * @param pageSelector A callback used to create a result for a page.
 * @category Subquery
 */
export function pageBy<T, R>(source: Iterable<T>, pageSize: number, pageSelector: (page: number, offset: number, values: Iterable<T>) => R): Iterable<R>;
export function pageBy<T, R>(source: Iterable<T>, pageSize: number, pageSelector: ((page: number, offset: number, values: Iterable<T>) => Page<T> | R) | ((page: number, offset: number, values: HierarchyIterable<unknown, T>) => Page<T> | R) = Page.from): Iterable<Page<T> | R> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isNumber(pageSize)) throw new TypeError("Number expected: pageSize");
    if (!isFunction(pageSelector)) throw new TypeError("Function expected: pageSelector");
    if (!isPositiveNonZeroFiniteNumber(pageSize)) throw new RangeError("Argument out of range: pageSize");
    return new PageByIterable(source, pageSize, pageSelector as (page: number, offset: number, values: Iterable<T>) => R);
}

class SpanMapIterable<T, K, V, R> implements Iterable<R> {
    private _source: Iterable<T>;
    private _keySelector: (element: T) => K;
    private _keyEqualer: Equaler<K>;
    private _elementSelector: (element: T) => V;
    private _spanSelector: (key: K, elements: Iterable<T | V>) => R;

    constructor(source: Iterable<T>, keySelector: (element: T) => K, keyEqualer: Equaler<K>, elementSelector: (element: T) => V, spanSelector: (key: K, elements: Iterable<T | V>) => R) {
        this._source = source;
        this._keySelector = keySelector;
        this._keyEqualer = keyEqualer;
        this._elementSelector = elementSelector;
        this._spanSelector = spanSelector;
    }

    *[Symbol.iterator](): Iterator<R> {
        const source = this._source;
        const keySelector = this._keySelector;
        const keyEqualer = this._keyEqualer;
        const elementSelector = this._elementSelector;
        const spanSelector = this._spanSelector;
        let span: (T | V)[] | undefined;
        let previousKey!: K;
        for (const element of source) {
            const key = keySelector(element);
            if (!span) {
                previousKey = key;
                span = [];
            }
            else if (!keyEqualer.equals(previousKey, key)) {
                yield spanSelector(previousKey, elementSelector === identity ? flowHierarchy(span, source as Iterable<T | V>) : span);
                span = [];
                previousKey = key;
            }
            span.push(elementSelector(element));
        }
        if (span) {
            yield spanSelector(previousKey, elementSelector === identity ? flowHierarchy(span, source as Iterable<T | V>) : span);
        }
    }
}

/**
 * Creates a subquery whose elements are the contiguous ranges of elements that share the same key.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyEqualer An `Equaler` used to compare key equality.
 * @category Grouping
 */
export function spanMap<TNode, T extends TNode, K>(source: HierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Iterable<HierarchyGrouping<K, TNode, T>>;
/**
 * Creates a subquery whose elements are the contiguous ranges of elements that share the same key.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param elementSelector A callback used to select a value for an element.
 * @param spanSelector A callback used to select a result from a contiguous range.
 * @param keyEqualer An `Equaler` used to compare key equality.
 * @category Grouping
 */
export function spanMap<TNode, T extends TNode, K, R>(source: HierarchyIterable<TNode, T>, keySelector: (element: T) => K, elementSelector: undefined, spanSelector: (key: K, elements: HierarchyIterable<TNode, T>) => R, keyEqualer?: Equaler<K>): Iterable<R>;
/**
 * Creates a subquery whose elements are the contiguous ranges of elements that share the same key.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyEqualer An `Equaler` used to compare key equality.
 * @category Grouping
 */
export function spanMap<T, K>(source: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Iterable<Grouping<K, T>>;
/**
 * Creates a subquery whose values are computed from each element of the contiguous ranges of elements that share the same key.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param elementSelector A callback used to select a value for an element.
 * @param keyEqualer An `Equaler` used to compare key equality.
 * @category Grouping
 */
export function spanMap<T, K, V>(source: Iterable<T>, keySelector: (element: T) => K, elementSelector: (element: T) => V, keyEqualer?: Equaler<K>): Iterable<Grouping<K, V>>;
/**
 * Creates a subquery whose values are computed from the contiguous ranges of elements that share the same key.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param elementSelector A callback used to select a value for an element.
 * @param spanSelector A callback used to select a result from a contiguous range.
 * @param keyEqualer An `Equaler` used to compare key equality.
 * @category Grouping
 */
export function spanMap<T, K, V, R>(source: Iterable<T>, keySelector: (element: T) => K, elementSelector: (element: T) => V, spanSelector: (key: K, elements: Iterable<V>) => R, keyEqualer?: Equaler<K>): Iterable<R>;
export function spanMap<T, K, V, R>(source: Iterable<T>, keySelector: (element: T) => K, elementSelector: ((element: T) => T | V) | Equaler<K> = identity, spanSelector: ((key: K, span: Iterable<T | V>) => Grouping<K, T | V> | R) | ((key: K, span: HierarchyIterable<unknown, T>) => Grouping<K, T | V> | R) | Equaler<K> = Grouping.from, keyEqualer: Equaler<K> = Equaler.defaultEqualer) {
    if (typeof elementSelector === "object") {
        keyEqualer = elementSelector;
        elementSelector = identity;
    }
    if (typeof spanSelector === "object") {
        keyEqualer = spanSelector;
        spanSelector = Grouping.from;
    }
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    if (!isFunction(spanSelector)) throw new TypeError("Function expected: spanSelector");
    if (!Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: keyEqualer");
    return new SpanMapIterable(source, keySelector, keyEqualer, elementSelector, spanSelector as (key: K, span: Iterable<T | V>) => Grouping<K, T | V> | R);
}

function createGroupings<T, K, V>(source: Iterable<T>, keySelector: (element: T) => K, elementSelector: (element: T) => V, keyEqualer?: Equaler<K>): HashMap<K, V[]> {
    const map = new HashMap<K, V[]>(keyEqualer);
    for (const item of source) {
        const key = keySelector(item);
        const element = elementSelector(item);
        const grouping = map.get(key);
        if (grouping === undefined) {
            map.set(key, [element]);
        }
        else {
            grouping.push(element);
        }
    }
    return map;
}

class GroupByIterable<T, K, V, R> implements Iterable<R> {
    private _source: Iterable<T>;
    private _keySelector: (element: T) => K;
    private _elementSelector: (element: T) => T | V;
    private _resultSelector: (key: K, elements: Iterable<T | V>) => R;

    constructor(source: Iterable<T>, keySelector: (element: T) => K, elementSelector: (element: T) => V, resultSelector: (key: K, elements: Iterable<T | V>) => R) {
        this._source = source;
        this._keySelector = keySelector;
        this._elementSelector = elementSelector;
        this._resultSelector = resultSelector;
    }

    *[Symbol.iterator](): Iterator<R> {
        const source = this._source;
        const elementSelector = this._elementSelector;
        const resultSelector = this._resultSelector;
        const map = createGroupings(source, this._keySelector, elementSelector);
        for (const [key, values] of map) {
            yield resultSelector(key, elementSelector === identity ? flowHierarchy(values, source as Iterable<T | V>) : values);
        }
    }
}

/**
 * Groups each element of an `Iterable` by its key.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function groupBy<TNode, T extends TNode, K>(source: HierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Iterable<HierarchyGrouping<K, TNode, T>>;
/**
 * Groups each element of an `Iterable` by its key.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param elementSelector A callback used to select a value for an element.
 * @param resultSelector A callback used to select a result from a group.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function groupBy<TNode, T extends TNode, K, R>(source: HierarchyIterable<TNode, T>, keySelector: (element: T) => K, elementSelector: undefined, resultSelector: (key: K, elements: HierarchyIterable<TNode, T>) => R, keyEqualer?: Equaler<K>): Iterable<R>;
/**
 * Groups each element of an `Iterable` by its key.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function groupBy<T, K>(source: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Iterable<Grouping<K, T>>;
/**
 * Groups each element of an `Iterable` by its key.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param elementSelector A callback used to select a value for an element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function groupBy<T, K, V>(source: Iterable<T>, keySelector: (element: T) => K, elementSelector: (element: T) => V, keyEqualer?: Equaler<K>): Iterable<Grouping<K, V>>;
/**
 * Groups each element of an `Iterable` by its key.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param elementSelector A callback used to select a value for an element.
 * @param resultSelector A callback used to select a result from a group.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function groupBy<T, K, V, R>(source: Iterable<T>, keySelector: (element: T) => K, elementSelector: (element: T) => V, resultSelector: (key: K, elements: Iterable<V>) => R, keyEqualer?: Equaler<K>): Iterable<R>;
export function groupBy<T, K, V, R>(source: Iterable<T>, keySelector: (element: T) => K, elementSelector: ((element: T) => T | V) | Equaler<K> = identity, resultSelector: ((key: K, elements: Iterable<T | V>) => Grouping<K, T | V> | R) | ((key: K, elements: HierarchyIterable<unknown, T>) => Grouping<K, T | V> | R) | Equaler<K> = Grouping.from, keyEqualer?: Equaler<K>) {
    if (typeof elementSelector !== "function") {
        resultSelector = elementSelector;
        elementSelector = identity;
    }
    if (typeof resultSelector !== "function") {
        keyEqualer = resultSelector;
        resultSelector = Grouping.from;
    }
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isFunction(elementSelector)) throw new TypeError("Function expected: elementSelector");
    if (!isFunction(resultSelector)) throw new TypeError("Function expected: resultSelector");
    if (!isUndefined(keyEqualer) && !Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: keyEqualer");
    return new GroupByIterable(source, keySelector, elementSelector, resultSelector as (key: K, elements: Iterable<T | V>) => Grouping<K, T | V> | R);
}
