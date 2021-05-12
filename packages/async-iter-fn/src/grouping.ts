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

import { toAsyncIterable } from "@esfx/async-iter-fromsync";
import { AsyncHierarchyIterable } from "@esfx/async-iter-hierarchy";
import { Equaler } from "@esfx/equatable";
import { identity } from "@esfx/fn";
import * as assert from "@esfx/internal-assert";
import { Grouping, HierarchyGrouping } from "@esfx/iter-grouping";
import { HierarchyIterable } from "@esfx/iter-hierarchy";
import { HierarchyPage, Page } from "@esfx/iter-page";
import { createGroupingsAsync, flowHierarchy } from "./internal/utils";

class AsyncPageByIterable<T, R> implements AsyncIterable<R> {
    private _source: AsyncIterable<T>;
    private _pageSize: number;
    private _pageSelector: (page: number, offset: number, values: Iterable<T>) => R;

    constructor(source: AsyncIterable<T>, pageSize: number, pageSelector: (page: number, offset: number, values: Iterable<T>) => R) {
        this._source = source;
        this._pageSize = pageSize;
        this._pageSelector = pageSelector;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<R> {
        const source = this._source;
        const pageSize = this._pageSize;
        const pageSelector = this._pageSelector;
        let elements: T[] = [];
        let page = 0;
        for await (const value of this._source) {
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
 * Creates an `AsyncIterable` that splits an `AsyncIterable` into one or more pages.
 * While advancing from page to page is evaluated lazily, the elements of the page are
 * evaluated eagerly.
 *
 * @param source An `AsyncIterable` object.
 * @param pageSize The number of elements per page.
 * @category Subquery
 */
export function pageByAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, pageSize: number): AsyncIterable<HierarchyPage<TNode, T>>;
/**
 * Creates an `AsyncIterable` that splits an `AsyncIterable` into one or more pages.
 * While advancing from page to page is evaluated lazily, the elements of the page are
 * evaluated eagerly.
 *
 * @param source An `AsyncIterable` object.
 * @param pageSize The number of elements per page.
 * @param pageSelector A callback used to create a result for a page.
 * @category Subquery
 */
export function pageByAsync<TNode, T extends TNode, R>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, pageSize: number, pageSelector: (page: number, offset: number, values: HierarchyIterable<TNode, T>) => R): AsyncIterable<R>;
/**
 * Creates an `AsyncIterable` that splits an `AsyncIterable` into one or more pages.
 * While advancing from page to page is evaluated lazily, the elements of the page are
 * evaluated eagerly.
 *
 * @param source An `AsyncIterable` object.
 * @param pageSize The number of elements per page.
 * @category Subquery
 */
export function pageByAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, pageSize: number): AsyncIterable<Page<T>>;
/**
 * Creates an `AsyncIterable` that splits an `AsyncIterable` into one or more pages.
 * While advancing from page to page is evaluated lazily, the elements of the page are
 * evaluated eagerly.
 *
 * @param source An `AsyncIterable` object.
 * @param pageSize The number of elements per page.
 * @param pageSelector A callback used to create a result for a page.
 * @category Subquery
 */
export function pageByAsync<T, R>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, pageSize: number, pageSelector: (page: number, offset: number, values: Iterable<T>) => R): AsyncIterable<R>;
export function pageByAsync<T, R>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, pageSize: number, pageSelector: ((page: number, offset: number, values: Iterable<T>) => Page<T> | R) | ((page: number, offset: number, values: HierarchyIterable<unknown, T>) => Page<T> | R) = Page.from): AsyncIterable<Page<T> | R> {
    assert.mustBeAsyncOrSyncIterableObject(source, "source");
    assert.mustBePositiveNonZeroFiniteNumber(pageSize, "pageSize");
    assert.mustBeFunction(pageSelector, "pageSelector");
    return new AsyncPageByIterable(flowHierarchy(toAsyncIterable(source), source), pageSize, pageSelector as (page: number, offset: number, values: Iterable<T>) => R);
}

class AsyncSpanMapIterable<T, K, V, R> implements AsyncIterable<R> {
    private _source: AsyncIterable<T>;
    private _keySelector: (element: T) => K;
    private _keyEqualer: Equaler<K>;
    private _elementSelector: (element: T) => PromiseLike<V> | V;
    private _spanSelector: (key: K, elements: Iterable<T | V>) => PromiseLike<R> | R;

    constructor(source: AsyncIterable<T>, keySelector: (element: T) => K, keyEqualer: Equaler<K>, elementSelector: (element: T) => PromiseLike<V> | V, spanSelector: (key: K, elements: Iterable<T | V>) => PromiseLike<R> | R) {
        this._source = source;
        this._keySelector = keySelector;
        this._keyEqualer = keyEqualer;
        this._elementSelector = elementSelector;
        this._spanSelector = spanSelector;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<R> {
        const source = this._source;
        const keySelector = this._keySelector;
        const keyEqualer = this._keyEqualer;
        const elementSelector = this._elementSelector;
        const spanSelector = this._spanSelector;
        let span: (T | V)[] | undefined;
        let previousKey!: K;
        for await (const element of source) {
            const key = keySelector(element);
            if (!span) {
                previousKey = key;
                span = [];
            }
            else if (!keyEqualer.equals(previousKey, key)) {
                yield spanSelector(previousKey, elementSelector === identity ? flowHierarchy(span, source as AsyncIterable<T | V>) : span);
                span = [];
                previousKey = key;
            }
            span.push(await elementSelector(element));
        }
        if (span) {
            yield spanSelector(previousKey, elementSelector === identity ? flowHierarchy(span, source as AsyncIterable<T | V>) : span);
        }
    }
}

/**
 * Creates a subquery whose elements are the contiguous ranges of elements that share the same key.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyEqualer An `Equaler` used to compare key equality.
 * @category Grouping
 */
export function spanMapAsync<TNode, T extends TNode, K>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncIterable<HierarchyGrouping<K, TNode, T>>;
/**
 * Creates a subquery whose elements are the contiguous ranges of elements that share the same key.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param elementSelector A callback used to select a value for an element.
 * @param spanSelector A callback used to select a result from a contiguous range.
 * @param keyEqualer An `Equaler` used to compare key equality.
 * @category Grouping
 */
export function spanMapAsync<TNode, T extends TNode, K, R>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, keySelector: (element: T) => K, elementSelector: undefined, spanSelector: (key: K, elements: HierarchyIterable<TNode, T>) => R, keyEqualer?: Equaler<K>): AsyncIterable<R>;
/**
 * Creates a subquery whose elements are the contiguous ranges of elements that share the same key.
 *
 * @param source An [[AsyncQueryable]] object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyEqualer An `Equaler` used to compare key equality.
 * @category Subquery
 */
export function spanMapAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncIterable<Grouping<K, T>>;
/**
 * Creates a subquery whose values are computed from each element of the contiguous ranges of elements that share the same key.
 *
 * @param source An [[AsyncQueryable]] object.
 * @param keySelector A callback used to select the key for an element.
 * @param elementSelector A callback used to select a value for an element.
 * @param keyEqualer An `Equaler` used to compare key equality.
 * @category Subquery
 */
export function spanMapAsync<T, K, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, keyEqualer?: Equaler<K>): AsyncIterable<Grouping<K, V>>;
/**
 * Creates a subquery whose values are computed from the contiguous ranges of elements that share the same key.
 *
 * @param source An [[AsyncQueryable]] object.
 * @param keySelector A callback used to select the key for an element.
 * @param elementSelector A callback used to select a value for an element.
 * @param spanSelector A callback used to select a result from a contiguous range.
 * @param keyEqualer An `Equaler` used to compare key equality.
 * @category Subquery
 */
export function spanMapAsync<T, K, V, R>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, spanSelector: (key: K, elements: Iterable<V>) => PromiseLike<R> | R, keyEqualer?: Equaler<K>): AsyncIterable<R>;
export function spanMapAsync<T, K, V, R>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, elementSelector: ((element: T) => PromiseLike<T | V> | T | V) | Equaler<K> = identity, spanSelector: ((key: K, span: Iterable<T | V>) => PromiseLike<Grouping<K, T | V> | R> | Grouping<K, T | V> | R) | ((key: K, span: HierarchyIterable<unknown, T>) => PromiseLike<Grouping<K, T | V> | R> | Grouping<K, T | V> | R) | Equaler<K> = Grouping.from, keyEqualer: Equaler<K> = Equaler.defaultEqualer): AsyncIterable<Grouping<K, T | V> | R> {
    if (typeof elementSelector === "object") {
        keyEqualer = elementSelector;
        elementSelector = identity;
    }
    if (typeof spanSelector === "object") {
        keyEqualer = spanSelector;
        spanSelector = Grouping.from;
    }
    assert.mustBeAsyncOrSyncIterableObject(source, "source");
    assert.mustBeFunction(keySelector, "keySelector");
    assert.mustBeFunction(elementSelector, "elementSelector");
    assert.mustBeFunction(spanSelector, "spanSelector");
    assert.mustBeType(Equaler.hasInstance, keyEqualer, "keyEqualer");
    return new AsyncSpanMapIterable(flowHierarchy(toAsyncIterable(source), source), keySelector, keyEqualer, elementSelector, spanSelector  as (key: K, span: Iterable<T | V>) => PromiseLike<Grouping<K, T | V> | R> | Grouping<K, T | V> | R);
}

class AsyncGroupByIterable<T, K, V, R> implements AsyncIterable<R> {
    private _source: AsyncIterable<T>;
    private _keySelector: (element: T) => K;
    private _elementSelector: (element: T) => T | V | PromiseLike<T | V>;
    private _resultSelector: (key: K, elements: Iterable<T | V>) => PromiseLike<R> | R;
    private _keyEqualer?: Equaler<K>

    constructor(source: AsyncIterable<T>, keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, resultSelector: (key: K, elements: Iterable<T | V>) => PromiseLike<R> | R, keyEqualer?: Equaler<K>) {
        this._source = source;
        this._keySelector = keySelector;
        this._elementSelector = elementSelector;
        this._resultSelector = resultSelector;
        this._keyEqualer = keyEqualer;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<R> {
        const source = this._source;
        const elementSelector = this._elementSelector;
        const resultSelector = this._resultSelector;
        const map = await createGroupingsAsync(source, this._keySelector, this._elementSelector, this._keyEqualer);
        for (const [key, values] of map) {
            yield resultSelector(key, elementSelector === identity ? flowHierarchy(values, source as AsyncIterable<T | V>) : values);
        }
    }
}

/**
 * Groups each element of an `AsyncIterable` by its key.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function groupByAsync<TNode, T extends TNode, K>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncIterable<HierarchyGrouping<K, TNode, T>>;
/**
 * Groups each element of an `AsyncIterable` by its key.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param elementSelector A callback used to select a value for an element.
 * @param resultSelector A callback used to select a result from a group.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function groupByAsync<TNode, T extends TNode, K, R>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, keySelector: (element: T) => K, elementSelector: undefined, resultSelector: (key: K, elements: HierarchyIterable<TNode, T>) => R, keyEqualer?: Equaler<K>): AsyncIterable<R>;
/**
 * Groups each element of an `AsyncIterable` by its key.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function groupByAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncIterable<Grouping<K, T>>;
/**
 * Groups each element of an `AsyncIterable` by its key.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param elementSelector A callback used to select a value for an element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function groupByAsync<T, K, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, keyEqualer?: Equaler<K>): AsyncIterable<Grouping<K, V>>;
/**
 * Groups each element of an `AsyncIterable` by its key.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for an element.
 * @param elementSelector A callback used to select a value for an element.
 * @param resultSelector A callback used to select a result from a group.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function groupByAsync<T, K, V, R>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, resultSelector: (key: K, elements: Iterable<V>) => PromiseLike<R> | R, keyEqualer?: Equaler<K>): AsyncIterable<R>;
export function groupByAsync<T, K, V, R>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, elementSelector: ((element: T) => PromiseLike<T | V> | T | V) | Equaler<K> = identity, resultSelector: ((key: K, elements: Iterable<T | V>) => PromiseLike<Grouping<K, T | V> | R> | Grouping<K, T | V> | R) | ((key: K, elements: HierarchyIterable<unknown, T>) => PromiseLike<Grouping<K, T | V> | R> | Grouping<K, T | V> | R) | Equaler<K> = Grouping.from, keyEqualer?: Equaler<K>): AsyncIterable<Grouping<K, T | V> | R> {
    if (typeof elementSelector !== "function") {
        resultSelector = elementSelector;
        elementSelector = identity;
    }
    if (typeof resultSelector !== "function") {
        keyEqualer = resultSelector;
        resultSelector = Grouping.from;
    }
    assert.mustBeAsyncOrSyncIterableObject(source, "source");
    assert.mustBeFunction(keySelector, "keySelector");
    assert.mustBeFunction(elementSelector, "elementSelector");
    assert.mustBeFunction(resultSelector, "resultSelector");
    assert.mustBeTypeOrUndefined(Equaler.hasInstance, keyEqualer, "keyEqualer");
    return new AsyncGroupByIterable(flowHierarchy(toAsyncIterable(source), source), keySelector, elementSelector, resultSelector as (key: K, elements: Iterable<T | V>) => PromiseLike<Grouping<K, T | V> | R> | Grouping<K, T | V> | R);
}
