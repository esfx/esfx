/*!
  Copyright 2018 Ron Buckton (rbuckton@chronicles.org)

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

import /*#__INLINE__*/ { isAsyncIterableObject, isIterableObject, isUndefined } from "@esfx/internal-guards";
import * as fn from "@esfx/async-iter-fn";
import * as sync_fn from "@esfx/iter-fn";
import { ConsumeAsyncOptions } from "@esfx/async-iter-fn";
import { toAsyncIterable } from '@esfx/async-iter-fromsync';
import { AsyncHierarchyIterable, AsyncOrderedHierarchyIterable } from '@esfx/async-iter-hierarchy';
import { AsyncOrderedIterable } from "@esfx/async-iter-ordered";
import { IndexedCollection } from '@esfx/collection-core';
import { HashMap } from '@esfx/collections-hashmap';
import { HashSet } from '@esfx/collections-hashset';
import { Comparer, Comparison, Equaler, EqualityComparison } from '@esfx/equatable';
import { Index } from "@esfx/interval";
import { Grouping, HierarchyGrouping } from '@esfx/iter-grouping';
import { Hierarchical, HierarchyIterable, HierarchyProvider, OrderedHierarchyIterable } from '@esfx/iter-hierarchy';
import { Lookup } from '@esfx/iter-lookup';
import { OrderedIterable } from "@esfx/iter-ordered";
import { HierarchyPage, Page } from '@esfx/iter-page';
import { Query, OrderedQuery, HierarchyQuery, OrderedHierarchyQuery, UnorderedQueryFlow } from '@esfx/iter-query';
export { ConsumeAsyncOptions };

const kSource = Symbol("[[Source]]");

export type AsyncUnorderedQueryFlow<S, T> =
    S extends Hierarchical<infer TNode> ?
        AsyncHierarchyQuery<TNode, TNode & T> :
        AsyncQuery<T>;

export type AsyncOrderedQueryFlow<S, T> =
    S extends Hierarchical<infer TNode> ?
        AsyncOrderedHierarchyQuery<TNode, TNode & T> :
        AsyncOrderedQuery<T>;

export type AsyncQueryFlow<S, T> =
    S extends AsyncOrderedIterable<any> | OrderedIterable<any> ?
        AsyncOrderedQueryFlow<S, T> :
        AsyncUnorderedQueryFlow<S, T>;

export type AsyncPagedQueryFlow<S, T> =
    S extends Hierarchical<infer TNode> ?
        AsyncQuery<HierarchyPage<TNode, TNode & T>> :
        AsyncQuery<Page<T>>;

export type AsyncGroupedQueryFlow<S, K, T> =
    S extends Hierarchical<infer TNode> ?
        AsyncQuery<HierarchyGrouping<K, TNode, TNode & T>> :
        AsyncQuery<Grouping<K, T>>;

export type AsyncHierarchyQueryFlow<S, TNode extends (T extends TNode ? unknown : never), T> =
    S extends AsyncOrderedIterable<any> | OrderedIterable<any> ?
        AsyncOrderedHierarchyQuery<TNode, TNode & T> :
        AsyncHierarchyQuery<TNode, TNode & T>;

export type AsyncMergeQueryFlow<L, R, T> =
    L extends Hierarchical<infer LTNode> ?
        R extends Hierarchical<infer RTNode> ?
            AsyncHierarchyQuery<LTNode | RTNode, LTNode & T | RTNode & T> :
            AsyncHierarchyQuery<LTNode, LTNode & T> :
    R extends Hierarchical<infer RTNode> ?
        AsyncHierarchyQuery<RTNode, RTNode & T> :
        AsyncQuery<T>;

/**
 * Creates a `AsyncQuery` from an `AsyncIterable` or `Iterable` source.
 */
export function fromAsync<TNode, T extends TNode>(source: AsyncOrderedHierarchyIterable<TNode, T> | OrderedHierarchyIterable<TNode, T>): AsyncOrderedHierarchyQuery<TNode, T>;
export function fromAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>): AsyncHierarchyQuery<TNode, T>;
export function fromAsync<TNode, T extends TNode>(source: AsyncOrderedIterable<T> | OrderedIterable<T>, provider: HierarchyProvider<TNode>): AsyncOrderedHierarchyQuery<TNode, T>;
export function fromAsync<TNode, T extends TNode>(source: AsyncIterable<T> | Iterable<T>, provider: HierarchyProvider<TNode>): AsyncHierarchyQuery<TNode, T>;
export function fromAsync<T>(source: AsyncOrderedIterable<T> | OrderedIterable<T>): AsyncOrderedQuery<T>;
export function fromAsync<T extends readonly unknown[] | []>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncQuery<T>;
export function fromAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncQuery<T>;
export function fromAsync<TNode, T extends TNode>(source: AsyncIterable<T> | Iterable<T>, provider?: HierarchyProvider<TNode>): AsyncQuery<TNode | T> {
    return AsyncQuery.from(source, provider!);
}

function getSource<TNode, T extends TNode>(source: AsyncOrderedHierarchyIterable<TNode, T>): AsyncOrderedHierarchyIterable<TNode, T>;
function getSource<TNode, T extends TNode>(source: AsyncOrderedHierarchyIterable<TNode, T> | OrderedHierarchyIterable<TNode, T>): AsyncOrderedHierarchyIterable<TNode, T> | OrderedHierarchyIterable<TNode, T>;
function getSource<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T>): AsyncHierarchyIterable<TNode, T>;
function getSource<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>): AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>;
function getSource<T>(source: AsyncOrderedIterable<T>): AsyncOrderedIterable<T>;
function getSource<T>(source: AsyncOrderedIterable<T> | OrderedIterable<T>): AsyncOrderedIterable<T> | OrderedIterable<T>;
function getSource<T>(source: AsyncIterable<T>): AsyncIterable<T>;
function getSource<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
function getSource<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncIterable<T> | Iterable<PromiseLike<T> | T> {
    if (source instanceof AsyncQuery) {
        return (source as AsyncQuery<T>)[kSource];
    }
    return source;
}

function wrapResultSelector<I, O, R>(query: AsyncQuery<any>, selector: ((inner: I, outer: Query<O>) => R)): ((inner: I, outer: Iterable<O>) => R);
function wrapResultSelector<I, O, R>(query: AsyncQuery<any>, selector: ((inner: I, outer: Query<O>) => R) | undefined): ((inner: I, outer: Iterable<O>) => R) | undefined;
function wrapResultSelector<I, O, R>(query: AsyncQuery<any>, selector: ((inner: I, outer: Query<O>) => R) | undefined) {
    if (typeof selector === "function") {
        return (inner: I, outer: Iterable<O>) => selector(inner, query["_fromSync"](outer));
    }
    return selector;
}

function wrapPageSelector<S extends AsyncQuery<any>, T, R>(query: S, selector: ((page: number, offset: number, values: Query<T>) => R)): (page: number, offset: number, values: Iterable<T>) => R;
function wrapPageSelector<S extends AsyncQuery<any>, T, R>(query: S, selector: ((page: number, offset: number, values: Query<T>) => R) | undefined): ((page: number, offset: number, values: Iterable<T>) => R) | undefined;
function wrapPageSelector<S extends AsyncQuery<any>, T, R>(query: S, selector: ((page: number, offset: number, values: Query<T>) => R) | undefined) {
    if (typeof selector === "function") {
        return (page: number, offset: number, values: Iterable<T>) => selector(page, offset, query["_fromSync"](values));
    }
    return selector;
}

function wrapSpans(query: AsyncQuery<any>) {
    return <T>([left, right]: [Iterable<T>, AsyncIterable<T> | Iterable<PromiseLike<T> | T>]): [Query<T>, AsyncQuery<T>] => {
        return [query["_fromSync"](left), query["_fromAsync"](right)];
    };
};

/**
 * A `AsyncQuery` represents a series of operations that act upon an `Iterable` or ArrayLike. Evaluation of
 * these operations is deferred until the either a scalar value is requested from the `AsyncQuery` or the
 * `AsyncQuery` is iterated.
 */
export class AsyncQuery<T> implements AsyncIterable<T> {
    private [kSource]: AsyncIterable<T>;

    /**
     * Creates an `AsyncQuery` from an `AsyncIterable` source.
     *
     * @param source An `AsyncIterable` object.
     */
    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>) {
        if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
        this[kSource] = getSource(toAsyncIterable(source));
    }

    // #region Query

    /**
     * Creates an `AsyncQuery` from an `AsyncIterable` or `Iterable` source.
     *
     * @category Query
     */
    static from<TNode, T extends TNode>(source: AsyncOrderedHierarchyIterable<TNode, T> | OrderedHierarchyIterable<TNode, T>): AsyncOrderedHierarchyQuery<TNode, T>;
    static from<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>): AsyncHierarchyQuery<TNode, T>;
    static from<TNode, T extends TNode>(source: AsyncOrderedIterable<T> | OrderedIterable<T>, provider: HierarchyProvider<TNode>): AsyncOrderedHierarchyQuery<TNode, T>;
    static from<TNode, T extends TNode>(source: AsyncIterable<T> | Iterable<T>, provider: HierarchyProvider<TNode>): AsyncHierarchyQuery<TNode, T>;
    static from<T>(source: AsyncOrderedIterable<T> | OrderedIterable<T>): AsyncOrderedQuery<T>;
    static from<T extends readonly unknown[] | []>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncQuery<T>;
    static from<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncQuery<T>;
    static from(source: AsyncIterable<any> | Iterable<any>, provider?: HierarchyProvider<any>): AsyncQuery<any> {
        if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
        if (!isUndefined(provider) && !HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        if (provider) source = fn.toHierarchyAsync(source, provider);
        return source instanceof AsyncQuery ? source :
            AsyncOrderedHierarchyIterable.hasInstance(source) || OrderedHierarchyIterable.hasInstance(source) ? new AsyncOrderedHierarchyQuery(source) :
            AsyncHierarchyIterable.hasInstance(source) || HierarchyIterable.hasInstance(source) ? new AsyncHierarchyQuery(source) :
            AsyncOrderedIterable.hasInstance(source) || OrderedIterable.hasInstance(source) ? new AsyncOrderedQuery(source) :
            new AsyncQuery(source);
    }

    /**
     * Creates a `AsyncQuery` for the provided elements.
     *
     * @param elements The elements of the `AsyncQuery`.
     * @category Query
     */
    static of<T>(...elements: (PromiseLike<T> | T)[]): AsyncQuery<T>;
    static of<T>(): AsyncQuery<T> {
        return this.from(arguments);
    }

    /**
     * Creates a `AsyncQuery` with no elements.
     *
     * @category Query
     */
    static empty<T>(): AsyncQuery<T> {
        return this.from(fn.emptyAsync<T>());
    }

    /**
     * Creates a `AsyncQuery` over a single element.
     *
     * @param value The only element for the `AsyncQuery`.
     * @category Query
     */
    static once<T>(value: PromiseLike<T> | T): AsyncQuery<T> {
        return this.from(fn.onceAsync(value));
    }

    /**
     * Creates a `AsyncQuery` for a value repeated a provided number of times.
     *
     * @param value The value for each element of the `AsyncQuery`.
     * @param count The number of times to repeat the value.
     * @category Query
     */
    static repeat<T>(value: PromiseLike<T> | T, count: number): AsyncQuery<T> {
        return this.from(fn.repeatAsync(value, count));
    }

    /**
     * Creates a `AsyncQuery` over a range of numbers.
     *
     * @param start The starting number of the range.
     * @param end The ending number of the range.
     * @param increment The amount by which to change between each itereated value.
     * @category Query
     */
    static range(start: number, end: number, increment?: number) {
        return this.from(sync_fn.range(start, end, increment));
    }

    /**
     * Creates a `AsyncQuery` that repeats the provided value forever.
     *
     * @param value The value for each element of the `AsyncQuery`.
     * @category Query
     */
    static continuous<T>(value: PromiseLike<T> | T) {
        return this.from(fn.continuousAsync(value));
    }

    /**
     * Creates a `AsyncQuery` whose values are provided by a callback executed a provided number of
     * times.
     *
     * @param count The number of times to execute the callback.
     * @param generator The callback to execute.
     * @category Query
     */
    static generate<T>(count: number, generator: (offset: number) => PromiseLike<T> | T) {
        return this.from(fn.generateAsync(count, generator));
    }

    /**
     * Creates a `AsyncQuery` that, when iterated, consumes the provided `AsyncIterator`.
     *
     * @param iterator An `AsyncIterator` object.
     * @category Query
     */
    static consume<T>(iterator: AsyncIterator<T>, options?: ConsumeAsyncOptions) {
        return this.from(fn.consumeAsync(iterator, options));
    }

    // #endregion Query

    // #region Subquery

    /**
     * Creates a subquery whose elements match the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to test.
     * @param predicate.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    filter<U extends T>(predicate: (element: T, offset: number) => element is U): AsyncUnorderedQueryFlow<this, U>;
    /**
     * Creates a subquery whose elements match the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to test.
     * @param predicate.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    filter(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): AsyncUnorderedQueryFlow<this, T>;
    filter(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean) {
        return this._fromAsync(fn.filterAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery where the selected key for each element matches the supplied predicate.
     *
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element The element from which to select a key.
     * @param predicate A callback used to match each key.
     * @param predicate.key The key to test.
     * @param predicate.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    filterBy<K>(keySelector: (element: T) => K, predicate: (key: K, offset: number) => PromiseLike<boolean> | boolean): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.filterByAsync(getSource(this), keySelector, predicate)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery whose elements are neither `null` nor `undefined`.
     *
     * @category Subquery
     */
    filterDefined(): AsyncUnorderedQueryFlow<this, NonNullable<T>> {
        return this._fromAsync(fn.filterDefinedAsync(getSource(this))) as AsyncUnorderedQueryFlow<this, NonNullable<T>>;
    }

    /**
     * Creates a subquery where the selected key for each element is neither `null` nor `undefined`.
     *
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element The element from which to select a key.
     * @category Subquery
     */
    filterDefinedBy<K>(keySelector: (element: T) => K): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.filterDefinedByAsync(getSource(this), keySelector)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery whose elements match the supplied predicate.
     *
     * NOTE: This is an alias for `filter`.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to test.
     * @param predicate.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    where<U extends T>(predicate: (element: T, offset: number) => element is U): AsyncUnorderedQueryFlow<this, U>;
    /**
     * Creates a subquery whose elements match the supplied predicate.
     *
     * NOTE: This is an alias for `filter`.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to test.
     * @param predicate.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    where(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): AsyncUnorderedQueryFlow<this, T>;
    where(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean) {
        return this.filter(predicate);
    }

    /**
     * Creates a subquery where the selected key for each element matches the supplied predicate.
     *
     * NOTE: This is an alias for `filterBy`.
     *
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element The element from which to select a key.
     * @param predicate A callback used to match each key.
     * @param predicate.key The key to test.
     * @param predicate.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    whereBy<K>(keySelector: (element: T) => K, predicate: (key: K, offset: number) => PromiseLike<boolean> | boolean): AsyncUnorderedQueryFlow<this, T> {
        return this.filterBy(keySelector, predicate);
    }

    /**
     * Creates a subquery whose elements are neither `null` nor `undefined`.
     *
     * NOTE: This is an alias for `filterDefined`.
     *
     * @category Subquery
     */
    whereDefined(): AsyncUnorderedQueryFlow<this, NonNullable<T>> {
        return this.filterDefined();
    }

    /**
     * Creates a subquery where the selected key for each element is neither `null` nor `undefined`.
     *
     * NOTE: This is an alias for `filterDefinedBy`.
     *
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element The element from which to select a key.
     * @category Subquery
     */
    whereDefinedBy<K>(keySelector: (element: T) => K): AsyncUnorderedQueryFlow<this, T> {
        return this.filterDefinedBy(keySelector) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery whose elements do not match the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to test.
     * @param predicate.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    filterNot<U extends T>(predicate: (element: T, offset: number) => element is U): AsyncUnorderedQueryFlow<this, U>;
    /**
     * Creates a subquery whose elements do not match the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to test.
     * @param predicate.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    filterNot(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): AsyncUnorderedQueryFlow<this, T>;
    filterNot(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean) {
        return this._fromAsync(fn.filterNotAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery where the selected key for each element does not match the supplied predicate.
     *
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element The element from which to select a key.
     * @param predicate A callback used to match each key.
     * @param predicate.key The key to test.
     * @param predicate.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    filterNotBy<K>(keySelector: (element: T) => K, predicate: (key: K, offset: number) => PromiseLike<boolean> | boolean): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.filterNotByAsync(getSource(this), keySelector, predicate)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery where the selected key for each element is either `null` or `undefined`.
     *
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element The element from which to select a key.
     * @category Subquery
     */
    filterNotDefinedBy<K>(keySelector: (element: T) => K): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.filterNotDefinedByAsync(getSource(this), keySelector)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery whose elements do not match the supplied predicate.
     *
     * NOTE: This is an alias for `filterNot`.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to test.
     * @param predicate.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    whereNot<U extends T>(predicate: (element: T, offset: number) => element is U): AsyncUnorderedQueryFlow<this, U>;
    /**
     * Creates a subquery whose elements do not match the supplied predicate.
     *
     * NOTE: This is an alias for `filterNot`.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to test.
     * @param predicate.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    whereNot(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): AsyncUnorderedQueryFlow<this, T>;
    whereNot(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean) {
        return this.filterNot(predicate);
    }

    /**
     * Creates a subquery where the selected key for each element does not match the supplied predicate.
     *
     * NOTE: This is an alias for `filterNotBy`.
     *
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element The element from which to select a key.
     * @param predicate A callback used to match each key.
     * @param predicate.key The key to test.
     * @param predicate.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    whereNotBy<K>(keySelector: (element: T) => K, predicate: (key: K, offset: number) => PromiseLike<boolean> | boolean): AsyncUnorderedQueryFlow<this, T> {
        return this.filterNotBy(keySelector, predicate) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery where the selected key for each element is either `null` or `undefined`.
     *
     * NOTE: This is an alias for `filterNotDefinedBy`.
     *
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element The element from which to select a key.
     * @category Subquery
     */
    whereNotDefinedBy<K>(keySelector: (element: T) => K): AsyncUnorderedQueryFlow<this, T> {
        return this.filterNotDefinedBy(keySelector) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery by applying a callback to each element.
     *
     * @param selector A callback used to map each element.
     * @param selector.element The element to map.
     * @param selector.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    map<U>(selector: (element: T, offset: number) => PromiseLike<U> | U): AsyncQuery<U> {
        return this._fromAsync(fn.mapAsync(getSource(this), selector));
    }

    /**
     * Creates a subquery by applying a callback to each element.
     *
     * NOTE: This is an alias for `map`.
     *
     * @param selector A callback used to map each element.
     * @param selector.element The element to map.
     * @param selector.offset The offset from the start of the source `Iterable`.
     * @category Subquery
     */
    select<U>(selector: (element: T, offset: number) => PromiseLike<U> | U): AsyncQuery<U> {
        return this.map(selector);
    }

    /**
     * Creates a subquery that iterates the results of applying a callback to each element.
     *
     * @param projection A callback used to map each element into an `AsyncIterable` or `Iterable` object.
     * @param projection.element The element to map.
     * @category Subquery
     */
    flatMap<U>(projection: (element: T) => AsyncIterable<U> | Iterable<PromiseLike<U> | U>): AsyncQuery<U>;
    /**
     * Creates a subquery that iterates the results of applying a callback to each element.
     *
     * @param projection A callback used to map each element into an `AsyncIterable` or `Iterable` object.
     * @param projection.element The outer element to map.
     * @param resultSelector An optional callback used to map the outer and projected inner elements.
     * @param resultSelector.element The outer element to map.
     * @param resultSelector.innerElement An inner element produced by the `projection` of the outer element.
     * @category Subquery
     */
    flatMap<U, R>(projection: (element: T) => AsyncIterable<U> | Iterable<PromiseLike<U> | U>, resultSelector: (element: T, innerElement: U) => PromiseLike<R> | R): AsyncQuery<R>;
    flatMap<U, R>(projection: (element: T) => AsyncIterable<U> | Iterable<PromiseLike<U> | U>, resultSelector?: (element: T, innerElement: U) => PromiseLike<R> | R) {
        return this._fromAsync(fn.flatMapAsync(getSource(this), projection, resultSelector!));
    }

    /**
     * Creates a subquery that iterates the results of applying a callback to each element.
     *
     * NOTE: This is an alias for `flatMap`.
     *
     * @param projection A callback used to map each element into an iterable.
     * @param projection.element The element to map.
     * @category Subquery
     */
    selectMany<U>(projection: (element: T) => AsyncIterable<U> | Iterable<PromiseLike<U> | U>): AsyncQuery<U>;
    /**
     * Creates a subquery that iterates the results of applying a callback to each element.
     *
     * NOTE: This is an alias for `flatMap`.
     *
     * @param projection A callback used to map each element into an iterable.
     * @param projection.element The element to map.
     * @param resultSelector An optional callback used to map the outer and projected inner elements.
     * @param resultSelector.element The outer element to map.
     * @param resultSelector.innerElement An inner element produced by the `projection` of the outer element.
     * @category Subquery
     */
    selectMany<U, R>(projection: (element: T) => AsyncIterable<U> | Iterable<PromiseLike<U> | U>, resultSelector: (element: T, innerElement: U) => PromiseLike<R> | R): AsyncQuery<R>;
    selectMany<U, R>(projection: (element: T) => AsyncIterable<U> | Iterable<PromiseLike<U> | U>, resultSelector?: (element: T, innerElement: U) => PromiseLike<R> | R) {
        return this.flatMap(projection, resultSelector!);
    }

    /**
     * Lazily invokes a callback as each element of the `AsyncQuery` is iterated.
     *
     * @param callback The callback to invoke.
     * @param callback.element An element of the source.
     * @param callback.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    tap(callback: (element: T, offset: number) => PromiseLike<void> | void): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.tapAsync(getSource(this), callback)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery whose elements are in the reverse order.
     *
     * @category Subquery
     */
    reverse(): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.reverseAsync(getSource(this))) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery with every instance of the specified value removed.
     *
     * @param values The values to exclude.
     * @category Subquery
     */
    exclude(...values: [PromiseLike<T> | T, ...(PromiseLike<T> | T)[]]): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.excludeAsync(getSource(this), ...values)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery containing all elements except the first elements up to the supplied
     * count.
     *
     * @param count The number of elements to drop.
     * @category Subquery
     */
    drop(count: number): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.dropAsync(getSource(this), count)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery containing all elements except the last elements up to the supplied
     * count.
     *
     * @param count The number of elements to drop.
     * @category Subquery
     */
    dropRight(count: number): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.dropRightAsync(getSource(this), count)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery containing all elements except the first elements that match
     * the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to match.
     * @category Subquery
     */
    dropWhile(predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.dropWhileAsync(getSource(this), predicate)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery containing all elements except the first elements that don't match
     * the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to match.
     * @category Subquery
     */
    dropUntil(predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.dropUntilAsync(getSource(this), predicate)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery containing all elements except the first elements up to the supplied
     * count.
     *
     * NOTE: This is an alias for `drop`.
     *
     * @param count The number of elements to skip.
     * @category Subquery
     */
    skip(count: number): AsyncUnorderedQueryFlow<this, T> {
        return this.drop(count);
    }

    /**
     * Creates a subquery containing all elements except the last elements up to the supplied
     * count.
     *
     * NOTE: This is an alias for `dropRight`.
     *
     * @param count The number of elements to skip.
     * @category Subquery
     */
    skipRight(count: number): AsyncUnorderedQueryFlow<this, T> {
        return this.dropRight(count);
    }

    /**
     * Creates a subquery containing all elements except the first elements that match
     * the supplied predicate.
     *
     * NOTE: This is an alias for `dropWhile`.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to match.
     * @category Subquery
     */
    skipWhile(predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncUnorderedQueryFlow<this, T> {
        return this.dropWhile(predicate);
    }

    /**
     * Creates a subquery containing all elements except the first elements that don't match
     * the supplied predicate.
     *
     * NOTE: This is an alias for `dropUntil`.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to match.
     * @category Subquery
     */
    skipUntil(predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncUnorderedQueryFlow<this, T> {
        return this.dropUntil(predicate);
    }

    /**
     * Creates a subquery containing the first elements up to the supplied
     * count.
     *
     * @param count The number of elements to take.
     * @category Subquery
     */
    take(count: number): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.takeAsync(getSource(this), count)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery containing the last elements up to the supplied
     * count.
     *
     * @param count The number of elements to take.
     * @category Subquery
     */
    takeRight(count: number): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.takeRightAsync(getSource(this), count)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery containing the first elements that match the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to match.
     * @category Subquery
     */
    takeWhile<U extends T>(predicate: (element: T) => element is U): AsyncUnorderedQueryFlow<this, U>;
    /**
     * Creates a subquery containing the first elements that match the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to match.
     */
    takeWhile(predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncUnorderedQueryFlow<this, T>;
    takeWhile(predicate: (element: T) => PromiseLike<boolean> | boolean) {
        return this._fromAsync(fn.takeWhileAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery containing the first elements that do not match the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to match.
     * @category Subquery
     */
    takeUntil(predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.takeUntilAsync(getSource(this), predicate)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery for the set intersection of this `AsyncQuery` and another `AsyncIterable` or `Iterable`.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    intersect<R extends AsyncIterable<T> | Iterable<PromiseLike<T> | T>>(right: R, equaler?: Equaler<T>): AsyncMergeQueryFlow<this, R, T>;
    /**
     * Creates a subquery for the set intersection of this `AsyncQuery` and another `AsyncIterable` or `Iterable`.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    intersect(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncQuery<T>;
    intersect(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): any {
        return this._fromAsync(fn.intersectAsync(getSource(this), right, equaler));
    }

    /**
     * Creates a subquery for the set intersection of this `AsyncQuery` and another `AsyncIterable` or `Iterable`, where set identity is determined by the selected key.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    intersectBy<K, R extends AsyncIterable<T> | Iterable<PromiseLike<T> | T>>(right: R, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncMergeQueryFlow<this, R, T>;
    /**
     * Creates a subquery for the set intersection of this `AsyncQuery` and another `AsyncIterable` or `Iterable`, where set identity is determined by the selected key.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    intersectBy<K>(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncQuery<T>;
    intersectBy<K>(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): any {
        return this._fromAsync(fn.intersectByAsync(getSource(this), getSource(right), keySelector, keyEqualer));
    }

    /**
     * Creates a subquery for the set union of this `AsyncQuery` and another `AsyncIterable` or `Iterable`.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    union<R extends AsyncIterable<T> | Iterable<PromiseLike<T> | T>>(right: R, equaler?: Equaler<T>): AsyncMergeQueryFlow<this, R, T>;
    /**
     * Creates a subquery for the set union of this `AsyncQuery` and another `AsyncIterable` or `Iterable`.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    union(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncQuery<T>;
    union(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): any {
        return this._fromAsync(fn.unionAsync(getSource(this), getSource(right), equaler));
    }

    /**
     * Creates a subquery for the set union of this `AsyncQuery` and another `AsyncIterable` or `Iterable`, where set identity is determined by the selected key.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    unionBy<K, R extends AsyncIterable<T> | Iterable<PromiseLike<T> | T>>(right: R, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncMergeQueryFlow<this, R, T>;
    /**
     * Creates a subquery for the set union of this `AsyncQuery` and another `AsyncIterable` or `Iterable`, where set identity is determined by the selected key.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    unionBy<K>(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncQuery<T>;
    unionBy<K>(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): any {
        return this._fromAsync(fn.unionByAsync(getSource(this), getSource(right), keySelector, keyEqualer));
    }

    /**
     * Creates a subquery for the set difference between this and another `AsyncIterable` or `Iterable`.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    except(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.exceptAsync(getSource(this), getSource(right), equaler)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery for the set difference between this and another `AsyncIterable` or `Iterable`, where set identity is determined by the selected key.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    exceptBy<K>(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.exceptByAsync(getSource(this), getSource(right), keySelector, keyEqualer)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery for the set difference between this and another `AsyncIterable` or `Iterable`.
     *
     * NOTE: This is an alias for `except`.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    relativeComplement(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncUnorderedQueryFlow<this, T> {
        return this.except(right, equaler);
    }

    /**
     * Creates a subquery for the set difference between this and another `AsyncIterable` or `Iterable`, where set identity is determined by the selected key.
     *
     * NOTE: This is an alias for `exceptBy`.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    relativeComplementBy<K>(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncUnorderedQueryFlow<this, T> {
        return this.exceptBy(right, keySelector, keyEqualer) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery for the symmetric difference between this and another `AsyncIterable` or `Iterable`.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    symmetricDifference<R extends AsyncIterable<T> | Iterable<PromiseLike<T> | T>>(right: R, equaler?: Equaler<T>): AsyncMergeQueryFlow<this, R, T>;
    /**
     * Creates a subquery for the symmetric difference between this and another `AsyncIterable` or `Iterable`.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    symmetricDifference(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncQuery<T>;
    symmetricDifference(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): any {
        return this._fromAsync(fn.symmetricDifferenceAsync(getSource(this), getSource(right), equaler));
    }

    /**
     * Creates a subquery for the symmetric difference between this and another `AsyncIterable` or `Iterable`, where set identity is determined by the selected key.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    symmetricDifferenceBy<K, R extends AsyncIterable<T> | Iterable<PromiseLike<T> | T>>(right: R, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncMergeQueryFlow<this, R, T>;
    /**
     * Creates a subquery for the symmetric difference between this and another `AsyncIterable` or `Iterable`, where set identity is determined by the selected key.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    symmetricDifferenceBy<K>(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncQuery<T>;
    symmetricDifferenceBy<K>(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): any {
        return this._fromAsync(fn.symmetricDifferenceByAsync(getSource(this), getSource(right), keySelector, keyEqualer));
    }

    // /**
    //  * Creates a subquery for the symmetric difference between this and another `AsyncIterable` or `Iterable`.
    //  *
    //  * NOTE: This is an alias for `symmetricDifference`.
    //  *
    //  * @param right An `AsyncIterable` or `Iterable` object.
    //  * @param equaler An `Equaler` object used to compare equality.
    //  * @category Subquery
    //  */
    // xor<TNode, T extends TNode>(this: AsyncQuery<T>, right: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, equaler?: Equaler<T>): AsyncHierarchyQuery<TNode, T>;
    // /**
    //  * Creates a subquery for the symmetric difference between this and another `AsyncIterable` or `Iterable`.
    //  *
    //  * NOTE: This is an alias for `symmetricDifference`.
    //  *
    //  * @param right An `AsyncIterable` or `Iterable` object.
    //  * @param equaler An `Equaler` object used to compare equality.
    //  * @category Subquery
    //  */
    // xor(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncQuery<T>;
    // xor(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncQuery<T> | AsyncHierarchyQuery<T> {
    //     return this.symmetricDifference(right, equaler);
    // }

    // /**
    //  * Creates a subquery for the symmetric difference between this and another `AsyncIterable` or `Iterable`, where set identity is determined by the selected key.
    //  *
    //  * NOTE: This is an alias for `symmetricDifferenceBy`.
    //  *
    //  * @param right An `AsyncIterable` or `Iterable` object.
    //  * @param keySelector A callback used to select the key for each element.
    //  * @param keySelector.element An element from which to select a key.
    //  * @param keyEqualer An `Equaler` object used to compare key equality.
    //  * @category Subquery
    //  */
    // xorBy<TNode, T extends TNode, K>(this: AsyncQuery<T>, right: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncHierarchyQuery<TNode, T>;
    // /**
    //  * Creates a subquery for the symmetric difference between this and another `AsyncIterable` or `Iterable`, where set identity is determined by the selected key.
    //  *
    //  * NOTE: This is an alias for `symmetricDifferenceBy`.
    //  *
    //  * @param right An `AsyncIterable` or `Iterable` object.
    //  * @param keySelector A callback used to select the key for each element.
    //  * @param keySelector.element An element from which to select a key.
    //  * @param keyEqualer An `Equaler` object used to compare key equality.
    //  * @category Subquery
    //  */
    // xorBy<K>(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncQuery<T>;
    // xorBy<K>(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncQuery<T> | AsyncHierarchyQuery<T> {
    //     return this.symmetricDifferenceBy(right, keySelector, keyEqualer);
    // }

    /**
     * Creates a subquery that concatenates this `AsyncQuery` with another `AsyncIterable` or `Iterable`.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @category Subquery
     */
    concat<R extends AsyncIterable<T> | Iterable<PromiseLike<T> | T>>(right: R): AsyncMergeQueryFlow<this, R, T>;
    /**
     * Creates a subquery that concatenates this `AsyncQuery` with another `AsyncIterable` or `Iterable`.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @category Subquery
     */
    concat(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncQuery<T>;
    concat(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): any {
        return this._fromAsync(fn.concatAsync(getSource(this), getSource(right)));
    }

    /**
     * Creates a subquery for the distinct elements of this `AsyncQuery`.
     *
     * @param equaler An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    distinct(equaler?: Equaler<T>): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.distinctAsync(getSource(this), equaler)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery for the distinct elements of this `AsyncQuery`.
     *
     * @param keySelector A callback used to select the key to determine uniqueness.
     * @param keySelector.value An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    distinctBy<K>(keySelector: (value: T) => K, keyEqualer?: Equaler<K>): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.distinctByAsync(getSource(this), keySelector, keyEqualer)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery for the elements of this `AsyncQuery` with the provided value appended to the end.
     *
     * @param value The value to append.
     * @category Subquery
     */
    append(value: PromiseLike<T> | T): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.appendAsync(getSource(this), value)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery for the elements of this `AsyncQuery` with the provided value prepended to the beginning.
     *
     * @param value The value to prepend.
     * @category Subquery
     */
    prepend(value: PromiseLike<T> | T): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.prependAsync(getSource(this), value)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery for the elements of this `AsyncQuery` with the provided range
     * patched into the results.
     *
     * @param start The offset at which to patch the range.
     * @param skipCount The number of elements to skip from start.
     * @param range The range to patch into the result.
     * @category Subquery
     */
    patch(start: number, skipCount?: number, range?: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.patchAsync(getSource(this), start, skipCount, range && getSource(range))) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery that contains the provided default value if this `AsyncQuery`
     * contains no elements.
     *
     * @param defaultValue The default value.
     * @category Subquery
     */
    defaultIfEmpty(defaultValue: PromiseLike<T> | T): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.defaultIfEmptyAsync(getSource(this), defaultValue)) as AsyncUnorderedQueryFlow<this, T>;
    }

    /**
     * Creates a subquery that splits this `AsyncQuery` into one or more pages.
     * While advancing from page to page is evaluated lazily, the elements of the page are
     * evaluated eagerly.
     *
     * @param pageSize The number of elements per page.
     * @category Subquery
     */
    pageBy(pageSize: number): AsyncPagedQueryFlow<this, T>;
    /**
     * Creates a subquery that splits this `AsyncQuery` into one or more pages.
     * While advancing from page to page is evaluated lazily, the elements of the page are
     * evaluated eagerly.
     *
     * @param pageSize The number of elements per page.
     * @category Subquery
     */
    pageBy<R>(pageSize: number, pageSelector: (page: number, offset: number, values: UnorderedQueryFlow<this, T>) => R): AsyncQuery<R>;
    pageBy<R>(pageSize: number, pageSelector?: (page: number, offset: number, values: UnorderedQueryFlow<this, T>) => R) {
        return this._fromAsync(fn.pageByAsync(getSource(this), pageSize, wrapPageSelector(this, pageSelector as (page: number, offset: number, values: Query<T>) => R)));
    }

    /**
     * Creates a subquery whose elements are the contiguous ranges of elements that share the same key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param keySelector.element An element from which to select a key.
     * @category Subquery
     */
    spanMap<K>(keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncGroupedQueryFlow<this, K, T>;
    /**
     * Creates a subquery whose values are computed from each element of the contiguous ranges of elements that share the same key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param keySelector.element An element from which to select a key.
     * @param elementSelector A callback used to select a value for an element.
     * @param elementSelector.element An element from which to select a value.
     * @category Subquery
     */
    spanMap<K, V>(keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, keyEqualer?: Equaler<K>): AsyncGroupedQueryFlow<this, K, V>;
    /**
     * Creates a subquery whose values are computed from the contiguous ranges of elements that share the same key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param keySelector.element An element from which to select a key.
     * @param elementSelector A callback used to select a value for an element.
     * @param elementSelector.element An element from which to select a value.
     * @param spanSelector A callback used to select a result from a contiguous range.
     * @param spanSelector.key The key for the span.
     * @param spanSelector.elements The elements for the span.
     * @category Subquery
     */
    spanMap<K, V, R>(keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, spanSelector: (key: K, elements: Query<V>) => PromiseLike<R> | R, keyEqualer?: Equaler<K>): AsyncQuery<R>;
    /**
     * Creates a subquery whose values are computed from the contiguous ranges of elements that share the same key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param keySelector.element An element from which to select a key.
     * @param elementSelector A callback used to select a value for an element.
     * @param elementSelector.element An element from which to select a value.
     * @param spanSelector A callback used to select a result from a contiguous range.
     * @param spanSelector.key The key for the span.
     * @param spanSelector.elements The elements for the span.
     * @category Subquery
     */
    spanMap<K, R>(keySelector: (element: T) => K, elementSelector: undefined, spanSelector: (key: K, elements: Query<T>) => PromiseLike<R> | R, keyEqualer?: Equaler<K>): AsyncQuery<R>;
    spanMap<K, V, R>(keySelector: (element: T) => K, elementSelector?: ((element: T) => PromiseLike<T | V> | T | V) | Equaler<K>, spanSelector?: ((key: K, elements: Query<T | V>) => Grouping<K, T | V> | PromiseLike<R> | R) | Equaler<K>, keyEqualer?: Equaler<K>) {
        if (typeof elementSelector === "object") {
            keyEqualer = elementSelector;
            elementSelector = fn.identity;
        }
        if (typeof spanSelector === "object") {
            keyEqualer = spanSelector;
            spanSelector = Grouping.from;
        }
        return this._fromAsync(fn.spanMapAsync(getSource(this), keySelector, elementSelector!, wrapResultSelector(this, spanSelector!), keyEqualer));
    }

    /**
     * Groups each element of this `AsyncQuery` by its key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    groupBy<K>(keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncGroupedQueryFlow<this, K, T>;
    /**
     * Groups each element by its key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param keySelector.element An element from which to select a key.
     * @param elementSelector A callback used to select a value for an element.
     * @param elementSelector.element An element from which to select a value.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    groupBy<K, V>(keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, keyEqualer?: Equaler<K>): AsyncGroupedQueryFlow<this, K, V>;
    /**
     * Groups each element by its key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param keySelector.element An element from which to select a key.
     * @param elementSelector A callback used to select a value for an element.
     * @param elementSelector.element An element from which to select a value.
     * @param resultSelector A callback used to select a result from a group.
     * @param resultSelector.key The key for the group.
     * @param resultSelector.elements The elements for the group.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    groupBy<K, V, R>(keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, resultSelector: (key: K, elements: Query<V>) => PromiseLike<R> | R, keyEqualer?: Equaler<K>): AsyncQuery<R>;
    /**
     * Groups each element by its key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param keySelector.element An element from which to select a key.
     * @param elementSelector A callback used to select a value for an element.
     * @param elementSelector.element An element from which to select a value.
     * @param resultSelector A callback used to select a result from a group.
     * @param resultSelector.key The key for the group.
     * @param resultSelector.elements The elements for the group.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    groupBy<K, R>(keySelector: (element: T) => K, elementSelector: undefined, resultSelector: (key: K, elements: Query<T>) => PromiseLike<R> | R, keyEqualer?: Equaler<K>): AsyncQuery<R>;
    groupBy<K, V, R>(keySelector: (element: T) => K, elementSelector?: ((element: T) => PromiseLike<V> | V) | Equaler<K>, resultSelector?: ((key: K, elements: Query<V>) => PromiseLike<R> | R) | Equaler<K>, keyEqualer?: Equaler<K>) {
        if (typeof elementSelector === "object") {
            resultSelector = elementSelector;
            elementSelector = undefined;
        }
        if (typeof resultSelector === "object") {
            keyEqualer = resultSelector;
            resultSelector = undefined;
        }
        return this._fromAsync(fn.groupByAsync(getSource(this), keySelector, elementSelector!, wrapResultSelector(this, resultSelector!), keyEqualer));
    }

    /**
     * Creates a subquery containing the cumulative results of applying the provided callback to each element.
     *
     * @param accumulator The callback used to compute each result.
     * @param accumulator.current The current accumulated value.
     * @param accumulator.element The value to accumulate.
     * @param accumulator.offset The offset from the start of the underlying `Iterable`.
     * @category Subquery
     */
    scan(accumulator: (current: T, element: T, offset: number) => PromiseLike<T> | T): AsyncQuery<T>;
    /**
     * Creates a subquery containing the cumulative results of applying the provided callback to each element.
     *
     * @param accumulator The callback used to compute each result.
     * @param accumulator.current The current accumulated value.
     * @param accumulator.element The value to accumulate.
     * @param accumulator.offset The offset from the start of the underlying `Iterable`.
     * @param seed An optional seed value.
     * @category Subquery
     */
    scan<U>(accumulator: (current: U, element: T, offset: number) => PromiseLike<U> | U, seed: U): AsyncQuery<U>;
    scan(accumulator: (current: T, element: T, offset: number) => PromiseLike<T> | T, seed?: T): AsyncQuery<T> {
        return this._fromAsync(arguments.length > 1
            ? fn.scanAsync(getSource(this), accumulator, seed as T)
            : fn.scanAsync(getSource(this), accumulator));
    }

    /**
     * Creates a subquery containing the cumulative results of applying the provided callback to each element in reverse.
     *
     * @param accumulator The callback used to compute each result.
     * @param accumulator.current The current accumulated value.
     * @param accumulator.element The value to accumulate.
     * @param accumulator.offset The offset from the start of the underlying `Iterable`.
     * @category Subquery
     */
    scanRight(accumulator: (current: T, element: T, offset: number) => PromiseLike<T> | T): AsyncQuery<T>;
    /**
     * Creates a subquery containing the cumulative results of applying the provided callback to each element in reverse.
     *
     * @param accumulator The callback used to compute each result.
     * @param accumulator.current The current accumulated value.
     * @param accumulator.element The value to accumulate.
     * @param accumulator.offset The offset from the start of the underlying `Iterable`.
     * @param seed An optional seed value.
     * @category Subquery
     */
    scanRight<U>(accumulator: (current: U, element: T, offset: number) => PromiseLike<U> | U, seed?: U): AsyncQuery<U>;
    scanRight(accumulator: (current: T, element: T, offset: number) => PromiseLike<T> | T, seed?: T): AsyncQuery<T> {
        return this._fromAsync(arguments.length > 1
            ? fn.scanRightAsync(getSource(this), accumulator, seed as T)
            : fn.scanRightAsync(getSource(this), accumulator));
    }

    /**
     * Pass the entire `AsyncQuery` to the provided callback, creating a new `AsyncQuery` from the result.
     *
     * @param callback A callback function.
     * @param callback.source The outer `AsyncQuery`.
     * @category Subquery
     */
    through<R extends AsyncIterable<any> | Iterable<any>>(callback: (source: this) => R): AsyncQueryFlow<R, R extends AsyncIterable<infer U> ? U : R extends Iterable<infer U> ? U extends PromiseLike<infer P> ? P : U : unknown> {
        return this._fromAsync(fn.intoAsync(this, callback)) as AsyncQueryFlow<R, R extends AsyncIterable<infer U> ? U : R extends Iterable<infer U> ? U extends PromiseLike<infer P> ? P : U : unknown>;
    }

    /**
     * Eagerly evaluate the `AsyncQuery`, returning a new `AsyncQuery`.
     *
     * @category Subquery
     */
    materialize(): AsyncUnorderedQueryFlow<this, T> {
        return this._fromAsync(fn.materializeAsync(getSource(this))) as AsyncUnorderedQueryFlow<this, T>;
    }

    // #endregion Subquery

    // #region Join

    /**
     * Creates a grouped subquery for the correlated elements of this `AsyncQuery` and another `AsyncIterable` or `Iterable` object.
     *
     * @param inner An `AsyncIterable` or `Iterable` object.
     * @param outerKeySelector A callback used to select the key for an element in this `AsyncQuery`.
     * @param innerKeySelector A callback used to select the key for an element in the other `Iterable` object.
     * @param resultSelector A callback used to select the result for the correlated elements.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Join
     */
    groupJoin<I, K, R>(inner: AsyncIterable<I> | Iterable<PromiseLike<I> | I>, outerKeySelector: (element: T) => K, innerKeySelector: (element: I) => K, resultSelector: (outer: T, inner: Query<I>) => PromiseLike<R> | R, keyEqualer?: Equaler<K>): AsyncQuery<R> {
        return this._fromAsync(fn.groupJoinAsync(getSource(this), getSource(inner), outerKeySelector, innerKeySelector, wrapResultSelector(this, resultSelector), keyEqualer));
    }

    /**
     * Creates a subquery for the correlated elements of this `AsyncQuery` and another `AsyncIterable` or `Iterable`.
     *
     * @param inner An `AsyncIterable` or `Iterable` object.
     * @param outerKeySelector A callback used to select the key for an element in this `AsyncQuery`.
     * @param innerKeySelector A callback used to select the key for an element in the other Iterable.
     * @param resultSelector A callback used to select the result for the correlated elements.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Join
     */
    join<I, K, R>(inner: AsyncIterable<I> | Iterable<PromiseLike<I> | I>, outerKeySelector: (element: T) => K, innerKeySelector: (element: I) => K, resultSelector: (outer: T, inner: I) => PromiseLike<R> | R, keyEqualer?: Equaler<K>): AsyncQuery<R> {
        return this._fromAsync(fn.joinAsync(getSource(this), getSource(inner), outerKeySelector, innerKeySelector, resultSelector, keyEqualer));
    }

    /**
     * Creates a subquery for the correlated elements of this `AsyncQuery` and another `AsyncIterable` or `Iterable`.
     *
     * @param inner An `AsyncIterable` or `Iterable` object.
     * @param outerKeySelector A callback used to select the key for an element in this `AsyncQuery`.
     * @param innerKeySelector A callback used to select the key for an element in the other Iterable.
     * @param resultSelector A callback used to select the result for the correlated elements.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Join
     */
    fullJoin<I, K, R>(inner: AsyncIterable<I> | Iterable<PromiseLike<I> | I>, outerKeySelector: (element: T) => K, innerKeySelector: (element: I) => K, resultSelector: (outer: T | undefined, inner: I | undefined) => PromiseLike<R> | R, keyEqualer?: Equaler<K>): AsyncQuery<R> {
        return this._fromAsync(fn.fullJoinAsync(getSource(this), getSource(inner), outerKeySelector, innerKeySelector, resultSelector, keyEqualer));
    }

    /**
     * Creates a subquery that combines this `AsyncQuery` with another `AsyncIterable` or `Iterable` by combining elements
     * in tuples.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @category Join
     */
    zip<U>(right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>): AsyncQuery<[T, U]>;
    /**
     * Creates a subquery that combines this `AsyncQuery` with another `AsyncIterable` or `Iterable` by combining elements
     * using the supplied callback.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param selector A callback used to combine two elements.
     * @category Join
     */
    zip<U, R>(right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>, selector: (left: T, right: U) => PromiseLike<R> | R): AsyncQuery<R>;
    zip<U, R>(right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>, selector?: (left: T, right: U) => PromiseLike<R> | R): AsyncQuery<R> {
        return this._fromAsync(fn.zipAsync(getSource(this), getSource(right), selector!));
    }

    // #endregion Join

    // #region Order

    /**
     * Creates an ordered subquery whose elements are sorted in ascending order by the provided key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param comparer An optional callback used to compare two keys.
     * @category Order
     */
    orderBy<K>(keySelector: (element: T) => K, comparer?: Comparison<K> | Comparer<K>): AsyncOrderedQueryFlow<this, T> {
        return this._fromAsync(fn.orderByAsync(getSource(this), keySelector, comparer)) as AsyncOrderedQueryFlow<this, T>;
    }

    /**
     * Creates an ordered subquery whose elements are sorted in descending order by the provided key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param comparer An optional callback used to compare two keys.
     * @category Order
     */
    orderByDescending<K>(keySelector: (element: T) => K, comparer?: Comparison<K> | Comparer<K>): AsyncOrderedQueryFlow<this, T> {
        return this._fromAsync(fn.orderByDescendingAsync(getSource(this), keySelector, comparer)) as AsyncOrderedQueryFlow<this, T>;
    }

    // #endregion Order

    // #region Hierarchy

    /**
     * Creates an `AsyncHierarchyQuery` using the provided `HierarchyProvider`.
     *
     * @param provider A `HierarchyProvider`.
     * @category Hierarchy
     */
    toHierarchy<TNode extends (T extends TNode ? unknown : never)>(provider: HierarchyProvider<TNode>): AsyncHierarchyQueryFlow<this, TNode, T> {
        return this._fromAsync(fn.toHierarchyAsync(getSource(this) as AsyncIterable<TNode & T>, provider)) as AsyncHierarchyQueryFlow<this, TNode, T>;
    }

    // #endregion Hierarchy

    // #region Scalar

    /**
     * Computes a scalar value by applying an accumulator callback over each element.
     *
     * @param accumulator the callback used to compute the result.
     * @param accumulator.current The current accumulated value.
     * @param accumulator.element The value to accumulate.
     * @param accumulator.offset The offset from the start of the underlying `Iterable`.
     * @category Scalar
     */
    reduce(accumulator: (current: T, element: T, offset: number) => PromiseLike<T> | T): Promise<T>;
    /**
     * Computes a scalar value by applying an accumulator callback over each element.
     *
     * @param accumulator the callback used to compute the result.
     * @param accumulator.current The current accumulated value.
     * @param accumulator.element The value to accumulate.
     * @param accumulator.offset The offset from the start of the underlying `Iterable`.
     * @param seed An optional seed value.
     * @category Scalar
     */
    reduce<U>(accumulator: (current: U, element: T, offset: number) => PromiseLike<U>, seed: U, resultSelector?: (result: U, count: number) => PromiseLike<U> | U): Promise<U>;
    /**
     * Computes a scalar value by applying an accumulator callback over each element.
     *
     * @param accumulator the callback used to compute the result.
     * @param accumulator.current The current accumulated value.
     * @param accumulator.element The value to accumulate.
     * @param accumulator.offset The offset from the start of the underlying `Iterable`.
     * @param seed An optional seed value.
     * @param resultSelector An optional callback used to compute the final result.
     * @category Scalar
     */
    reduce<U, R>(accumulator: (current: U, element: T, offset: number) => PromiseLike<U> | U, seed: U, resultSelector: (result: U, count: number) => PromiseLike<R> | R): Promise<R>;
    reduce(accumulator: (current: T, element: T, offset: number) => PromiseLike<T> | T, seed?: T, resultSelector?: (result: T, count: number) => PromiseLike<T> | T): Promise<T> {
        return arguments.length > 1
            ? fn.reduceAsync(getSource(this), accumulator, seed!, resultSelector!)
            : fn.reduceAsync(getSource(this), accumulator);
    }

    /**
     * Computes a scalar value by applying an accumulator callback over each element in reverse.
     *
     * @param accumulator the callback used to compute the result.
     * @category Scalar
     */
    reduceRight(accumulator: (current: T, element: T, offset: number) => PromiseLike<T> | T): Promise<T>;
    /**
     * Computes a scalar value by applying an accumulator callback over each element in reverse.
     *
     * @param accumulator the callback used to compute the result.
     * @param seed An optional seed value.
     * @category Scalar
     */
    reduceRight<U>(accumulator: (current: U, element: T, offset: number) => PromiseLike<U> | U, seed: U, resultSelector?: (result: U, count: number) => PromiseLike<U> | U): Promise<U>;
    /**
     * Computes a scalar value by applying an accumulator callback over each element in reverse.
     *
     * @param accumulator the callback used to compute the result.
     * @param seed An optional seed value.
     * @param resultSelector An optional callback used to compute the final result.
     * @category Scalar
     */
    reduceRight<U, R>(accumulator: (current: U, element: T, offset: number) => PromiseLike<U> | U, seed: U, resultSelector: (result: U, count: number) => PromiseLike<R> | R): Promise<R>;
    reduceRight(accumulator: (current: T, element: T, offset: number) => PromiseLike<T> | T, seed?: T, resultSelector?: (result: T, count: number) => PromiseLike<T> | T): Promise<T> {
        return arguments.length > 1
            ? fn.reduceRightAsync(getSource(this), accumulator, seed!, resultSelector!)
            : fn.reduceRightAsync(getSource(this), accumulator);
    }

    /**
     * Counts the number of elements in the `AsyncQuery`, optionally filtering elements using the supplied
     * callback.
     *
     * @param predicate An optional callback used to match each element.
     * @category Scalar
     */
    count(predicate?: (element: T) => PromiseLike<boolean> | boolean): Promise<number> {
        return fn.countAsync(getSource(this), predicate);
    }

    /**
     * Gets the first element in the `AsyncQuery`, optionally filtering elements using the supplied
     * callback.
     *
     * @param predicate An optional callback used to match each element.
     * @category Scalar
     */
    first<U extends T>(predicate: (element: T) => element is U): Promise<U | undefined>;
    /**
     * Gets the first element in the `AsyncQuery`, optionally filtering elements using the supplied
     * callback.
     *
     * @param predicate An optional callback used to match each element.
     * @category Scalar
     */
    first(predicate?: (element: T) => PromiseLike<boolean> | boolean): Promise<T | undefined>;
    first(predicate?: (element: T) => PromiseLike<boolean> | boolean): Promise<T | undefined> {
        return fn.firstAsync(getSource(this), predicate);
    }

    /**
     * Gets the last element in the `AsyncQuery`, optionally filtering elements using the supplied
     * callback.
     *
     * @param predicate An optional callback used to match each element.
     * @category Scalar
     */
    last<U extends T>(predicate: (element: T) => element is U): Promise<U | undefined>;
    /**
     * Gets the last element in the `AsyncQuery`, optionally filtering elements using the supplied
     * callback.
     *
     * @param predicate An optional callback used to match each element.
     * @category Scalar
     */
    last(predicate?: (element: T) => PromiseLike<boolean> | boolean): Promise<T | undefined>;
    last(predicate?: (element: T) => PromiseLike<boolean> | boolean): Promise<T | undefined> {
        return fn.lastAsync(getSource(this), predicate);
    }

    /**
     * Gets the only element in the `AsyncQuery`, or returns `undefined`.
     *
     * @param predicate An optional callback used to match each element.
     * @category Scalar
     */
    single<U extends T>(predicate: (element: T) => element is U): Promise<U | undefined>;
    /**
     * Gets the only element in the `AsyncQuery`, or returns undefined.
     *
     * @param predicate An optional callback used to match each element.
     * @category Scalar
     */
    single(predicate?: (element: T) => PromiseLike<boolean> | boolean): Promise<T | undefined>;
    single(predicate?: (element: T) => PromiseLike<boolean> | boolean): Promise<T | undefined> {
        return fn.singleAsync(getSource(this), predicate);
    }

    /**
     * Gets the minimum element in the `AsyncQuery`, optionally comparing elements using the supplied
     * callback.
     *
     * @param comparer An optional callback used to compare two elements.
     * @category Scalar
     */
    min(comparer?: Comparison<T> | Comparer<T>): Promise<T | undefined> {
        return fn.minAsync(getSource(this), comparer);
    }

    /**
     * Gets the minimum element by its key in the `AsyncQuery`, optionally comparing the keys of each element using the supplied callback.
     *
     * @param keySelector A callback used to choose the key to compare.
     * @param keyComparer An optional callback used to compare the keys.
     * @category Scalar
     */
    minBy<K>(keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): Promise<T | undefined> {
        return fn.minByAsync(getSource(this), keySelector, keyComparer);
    }

    /**
     * Gets the maximum element in the `AsyncQuery`, optionally comparing elements using the supplied
     * callback.
     *
     * @param comparer An optional callback used to compare two elements.
     * @category Scalar
     */
    max(comparer?: Comparison<T> | Comparer<T>): Promise<T | undefined> {
        return fn.maxAsync(getSource(this), comparer);
    }

    /**
     * Gets the maximum element by its key in the `AsyncQuery`, optionally comparing the keys of each element using the supplied callback.
     *
     * @param keySelector A callback used to choose the key to compare.
     * @param keyComparer An optional callback used to compare the keys.
     * @category Scalar
     */
    maxBy<K>(keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): Promise<T | undefined> {
        return fn.maxByAsync(getSource(this), keySelector, keyComparer);
    }

    /**
     * Computes the sum for a series of numbers.
     *
     * @category Scalar
     */
    sum(): Promise<T extends number ? number : never>;
    /**
     * Computes the sum for a series of numbers.
     *
     * @category Scalar
     */
    sum(elementSelector: (element: T) => PromiseLike<number> | number): Promise<number>;
    sum(elementSelector?: (element: T) => PromiseLike<number> | number): Promise<number> {
        return fn.sumAsync(getSource(this), elementSelector!);
    }

    /**
     * Computes the average for a series of numbers.
     *
     * @category Scalar
     */
    average(): Promise<T extends number ? number : never>;
    /**
     * Computes the average for a series of numbers.
     *
     * @category Scalar
     */
    average(elementSelector: (element: T) => PromiseLike<number> | number): Promise<number>;
    average(elementSelector?: (element: T) => PromiseLike<number> | number): Promise<number> {
        return fn.averageAsync(getSource(this), elementSelector!);
    }

    /**
     * Computes a scalar value indicating whether the `AsyncQuery` contains any elements,
     * optionally filtering the elements using the supplied callback.
     *
     * @param predicate An optional callback used to match each element.
     * @category Scalar
     */
    some(predicate?: (element: T) => PromiseLike<boolean> | boolean): Promise<boolean> {
        return fn.someAsync(getSource(this), predicate);
    }

    /**
     * Computes a scalar value indicating whether all elements of the `AsyncQuery`
     * match the supplied callback.
     *
     * @param predicate A callback used to match each element.
     * @category Scalar
     */
    every(predicate: (element: T) => PromiseLike<boolean> | boolean): Promise<boolean>;
    every(predicate: (element: T) => PromiseLike<boolean> | boolean): Promise<boolean> {
        return fn.everyAsync(getSource(this), predicate);
    }

    /**
     * Computes a scalar value indicating whether every element in this `AsyncQuery` corresponds to a matching element
     * in another `AsyncIterable` or `Iterable` at the same position.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param equaler An optional callback used to compare the equality of two elements.
     * @category Scalar
     */
    corresponds(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: EqualityComparison<T> | Equaler<T>): Promise<boolean>;
    /**
     * Computes a scalar value indicating whether every element in this `AsyncQuery` corresponds to a matching element
     * in another `AsyncIterable` or `Iterable` at the same position.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param equaler An optional callback used to compare the equality of two elements.
     * @category Scalar
     */
    corresponds<U>(right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>, equaler: (left: T, right: U) => boolean): Promise<boolean>;
    corresponds(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: EqualityComparison<T> | Equaler<T>): Promise<boolean> {
        return fn.correspondsAsync(getSource(this), getSource(right), equaler!);
    }

    /**
     * Computes a scalar value indicating whether every element in this `AsyncQuery` corresponds to a matching element
     * in another `AsyncIterable` or `Iterable` at the same position.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keyEqualer An `Equaler` used to compare the equality of two keys.
     * @category Scalar
     */
    correspondsBy<K>(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Promise<boolean>;
    /**
     * Computes a scalar value indicating whether the key for every element in this `AsyncQuery` corresponds to a matching key
     * in `right` at the same position.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param leftKeySelector A callback used to select the key for each element in this `AsyncQuery`.
     * @param rightKeySelector A callback used to select the key for each element in `right`.
     * @param keyEqualer An optional callback used to compare the equality of two keys.
     * @category Scalar
     */
    correspondsBy<U, K>(right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>, leftKeySelector: (element: T) => K, rightKeySelector: (element: U) => K, keyEqualer?: EqualityComparison<K> | Equaler<K>): Promise<boolean>;
    correspondsBy<U, K>(right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>, leftKeySelector: (element: T) => K, rightKeySelector?: ((element: U) => K) | Equaler<K>, keyEqualer?: EqualityComparison<K> | Equaler<K>): Promise<boolean> {
        if (typeof rightKeySelector === "object") {
            keyEqualer = rightKeySelector;
            rightKeySelector = undefined;
        }
        return fn.correspondsByAsync(getSource(this), getSource(right), leftKeySelector, rightKeySelector!, keyEqualer);
    }

    /**
     * Computes a scalar value indicating whether the provided value is included in the `AsyncQuery`.
     *
     * @param value A value.
     * @param equaler An optional callback used to compare the equality of two elements.
     * @category Scalar
     */
    includes(value: T, equaler?: EqualityComparison<T> | Equaler<T>): Promise<boolean>;
    /**
     * Computes a scalar value indicating whether the provided value is included in the `AsyncQuery`.
     *
     * @param value A value.
     * @param equaler An optional callback used to compare the equality of two elements.
     * @category Scalar
     */
    includes<U>(value: U, equaler: (left: T, right: U) => boolean): Promise<boolean>;
    includes(value: T, equaler?: EqualityComparison<T> | Equaler<T>): Promise<boolean> {
        return fn.includesAsync(getSource(this), value, equaler!);
    }

    /**
     * Computes a scalar value indicating whether the elements of this `AsyncQuery` include
     * an exact sequence of elements from another `AsyncIterable` or `Iterable`.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param equaler A callback used to compare the equality of two elements.
     * @category Scalar
     */
    includesSequence(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: EqualityComparison<T> | Equaler<T>): Promise<boolean>;
    /**
     * Computes a scalar value indicating whether the elements of this `AsyncQuery` include
     * an exact sequence of elements from another `AsyncIterable` or `Iterable`.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param equaler A callback used to compare the equality of two elements.
     * @category Scalar
     */
    includesSequence<U>(right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>, equaler: (left: T, right: U) => boolean): Promise<boolean>;
    includesSequence(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: EqualityComparison<T> | Equaler<T>): Promise<boolean> {
        return fn.includesSequenceAsync(getSource(this), getSource(right), equaler!);
    }

    /**
     * Computes a scalar value indicating whether the elements of this `AsyncQuery` start
     * with the same sequence of elements in another `AsyncIterable` or `Iterable`.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param equaler A callback used to compare the equality of two elements.
     * @category Scalar
     */
    startsWith(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: EqualityComparison<T> | Equaler<T>): Promise<boolean>;
    /**
     * Computes a scalar value indicating whether the elements of this `AsyncQuery` start
     * with the same sequence of elements in another `AsyncIterable` or `Iterable`.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param equaler A callback used to compare the equality of two elements.
     * @category Scalar
     */
    startsWith<U>(right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>, equaler: (left: T, right: U) => boolean): Promise<boolean>;
    startsWith(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: EqualityComparison<T> | Equaler<T>): Promise<boolean> {
        return fn.startsWithAsync(getSource(this), getSource(right), equaler!);
    }

    /**
     * Computes a scalar value indicating whether the elements of this `AsyncQuery` end
     * with the same sequence of elements in another `AsyncIterable` or `Iterable`.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param equaler A callback used to compare the equality of two elements.
     * @category Scalar
     */
    endsWith(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: EqualityComparison<T> | Equaler<T>): Promise<boolean>;
    /**
     * Computes a scalar value indicating whether the elements of this `AsyncQuery` end
     * with the same sequence of elements in another `AsyncIterable` or `Iterable`.
     *
     * @param right An `AsyncIterable` or `Iterable` object.
     * @param equaler A callback used to compare the equality of two elements.
     * @category Scalar
     */
    endsWith<U>(right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>, equaler: (left: T, right: U) => boolean): Promise<boolean>;
    endsWith(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: EqualityComparison<T> | Equaler<T>): Promise<boolean> {
        return fn.endsWithAsync(getSource(this), getSource(right), equaler!);
    }

    /**
     * Finds the value in the `AsyncQuery` at the provided offset. A negative offset starts from the
     * last element.
     *
     * @param offset An offset.
     * @category Scalar
     */
    elementAt(offset: number | Index): Promise<T | undefined> {
        return fn.elementAtAsync(getSource(this), offset);
    }

    /**
     * Finds the value in the `AsyncQuery` at the provided offset. A negative offset starts from the
     * last element.
     *
     * NOTE: This is an alias for `elementAt`.
     *
     * @param offset An offset.
     * @category Scalar
     */
    nth(offset: number | Index): Promise<T | undefined> {
        return fn.nthAsync(getSource(this), offset);
    }

    /**
     * Creates a tuple whose first element is a subquery containing the first span of
     * elements that match the supplied predicate, and whose second element is a subquery
     * containing the remaining elements.
     *
     * The first subquery is eagerly evaluated, while the second subquery is lazily
     * evaluated.
     *
     * @param predicate The predicate used to match elements.
     * @category Scalar
     */
    span<U extends T>(predicate: (element: T, offset: number) => element is U): Promise<[UnorderedQueryFlow<this, U>, AsyncUnorderedQueryFlow<this, T>]>;
    /**
     * Creates a tuple whose first element is a subquery containing the first span of
     * elements that match the supplied predicate, and whose second element is a subquery
     * containing the remaining elements.
     *
     * The first subquery is eagerly evaluated, while the second subquery is lazily
     * evaluated.
     *
     * @param predicate The predicate used to match elements.
     * @category Scalar
     */
    span(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): Promise<[UnorderedQueryFlow<this, T>, AsyncUnorderedQueryFlow<this, T>]>;
    span(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean) {
        return fn.spanAsync(getSource(this), predicate).then(wrapSpans(this)) as Promise<[UnorderedQueryFlow<this, T>, AsyncUnorderedQueryFlow<this, T>]>;
    }

    /**
     * Creates a tuple whose first element is a subquery containing the first span of
     * elements that do not match the supplied predicate, and whose second element is a subquery
     * containing the remaining elements.
     *
     * The first subquery is eagerly evaluated, while the second subquery is lazily
     * evaluated.
     *
     * @param predicate The predicate used to match elements.
     * @category Scalar
     */
    spanUntil(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): Promise<[UnorderedQueryFlow<this, T>, AsyncUnorderedQueryFlow<this, T>]> {
        return fn.spanUntilAsync(getSource(this), predicate).then(wrapSpans(this)) as Promise<[UnorderedQueryFlow<this, T>, AsyncUnorderedQueryFlow<this, T>]>;
    }

    /**
     * Creates a tuple whose first element is a subquery containing the first span of
     * elements that do not match the supplied predicate, and whose second element is a subquery
     * containing the remaining elements.
     *
     * The first subquery is eagerly evaluated, while the second subquery is lazily
     * evaluated.
     *
     * NOTE: This is an alias for `spanUntil`.
     *
     * @param predicate The predicate used to match elements.
     * @category Scalar
     */
    break(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): Promise<[UnorderedQueryFlow<this, T>, AsyncUnorderedQueryFlow<this, T>]> {
        return this.spanUntil(predicate);
    }

    /**
     * Invokes a callback for each element of the `AsyncQuery`.
     *
     * @param callback The callback to invoke.
     * @category Scalar
     */
    forEach(callback: (element: T, offset: number) => void | PromiseLike<void>): Promise<void> {
        return fn.forEachAsync(getSource(this), callback);
    }

    // /**
    //  * Iterates over all of the elements in the `AsyncQuery`, ignoring the results.
    //  * @category Scalar
    //  */
    // drain(): void {
    //     fn.drainAsync(getSource(this));
    // }

    /**
     * Unzips a sequence of tuples into a tuple of sequences.
     *
     * @param source An `AsyncIterable` or `Iterable` object.
     * @category Scalar
     */
    unzip(): Promise<T extends readonly unknown[] | [] ? { -readonly [I in keyof T]: T[I][]; } : unknown[]>;
    /**
     * Unzips a sequence of tuples into a tuple of sequences.
     *
     * @param source An `AsyncIterable` or `Iterable` object.
     * @param partSelector A callback that converts a result into a tuple.
     * @category Scalar
     */
    unzip<U extends readonly unknown[] | []>(partSelector: (value: T) => U): Promise<{ -readonly [I in keyof U]: U[I][]; }>;
    unzip<U extends readonly unknown[] | []>(partSelector?: (value: T) => U): Promise<object> {
        return fn.unzipAsync(getSource(this), partSelector!);
    }

    /**
     * Creates an Array for the elements of the `AsyncQuery`.
     *
     * @category Scalar
     */
    toArray(): Promise<T[]>;
    /**
     * Creates an Array for the elements of the `AsyncQuery`.
     *
     * @param elementSelector A callback that selects a value for each element.
     * @category Scalar
     */
    toArray<V>(elementSelector: (element: T) => PromiseLike<V> | V): Promise<V[]>;
    toArray<V>(elementSelector?: (element: T) => PromiseLike<V> | V): Promise<V[]> {
        return fn.toArrayAsync(getSource(this), elementSelector!);
    }

    /**
     * Creates a `Set` for the elements of the `AsyncQuery`.
     *
     * @category Scalar
     */
    toSet(): Promise<Set<T>>;
    /**
     * Creates a `Set` for the elements of the `AsyncQuery`.
     *
     * @param elementSelector A callback that selects a value for each element.
     * @category Scalar
     */
    toSet<V>(elementSelector: (element: T) => PromiseLike<V> | V): Promise<Set<V>>;
    toSet<V>(elementSelector?: (element: T) => PromiseLike<V> | V): Promise<Set<T | V>> {
        return fn.toSetAsync(getSource(this), elementSelector!);
    }

    /**
     * Creates a `HashSet` for the elements of the `AsyncQuery`.
     *
     * @param equaler An `Equaler` object used to compare equality.
     * @category Scalar
     */
    toHashSet(equaler?: Equaler<T>): Promise<HashSet<T>>;
    /**
     * Creates a `HashSet` for the elements of the `AsyncQuery`.
     *
     * @param elementSelector A callback that selects a value for each element.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Scalar
     */
    toHashSet<V>(elementSelector: (element: T) => PromiseLike<V> | V, equaler: Equaler<V>): Promise<HashSet<V>>;
    toHashSet<V>(elementSelector?: ((element: T) => PromiseLike<V> | V) | Equaler<T | V>, equaler?: Equaler<T | V>): Promise<HashSet<T | V>> {
        return fn.toHashSetAsync(getSource(this), elementSelector as (element: T) => PromiseLike<V> | V, equaler!);
    }

    /**
     * Creates a `Map` for the elements of the `AsyncQuery`.
     *
     * @param keySelector A callback used to select a key for each element.
     * @category Scalar
     */
    toMap<K>(keySelector: (element: T) => K): Promise<Map<K, T>>;
    /**
     * Creates a `Map` for the elements of the `AsyncQuery`.
     *
     * @param keySelector A callback used to select a key for each element.
     * @param elementSelector A callback that selects a value for each element.
     * @category Scalar
     */
    toMap<K, V>(keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V): Promise<Map<K, V>>;
    toMap<K, V>(keySelector: (element: T) => K, elementSelector?: (element: T) => PromiseLike<T | V> | T | V) {
        return fn.toMapAsync(getSource(this), keySelector, elementSelector!);
    }

    /**
     * Creates a `HashMap` for the elements of the `AsyncQuery`.
     *
     * @param keySelector A callback used to select a key for each element.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Scalar
     */
    toHashMap<K>(keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Promise<HashMap<K, T>>;
    /**
     * Creates a `HashMap` for the elements of the `AsyncQuery`.
     *
     * @param keySelector A callback used to select a key for each element.
     * @param elementSelector A callback that selects a value for each element.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Scalar
     */
    toHashMap<K, V>(keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, keyEqualer?: Equaler<K>): Promise<HashMap<K, V>>;
    toHashMap<K, V>(keySelector: (element: T) => K, elementSelector?: ((element: T) => PromiseLike<T | V> | T | V) | Equaler<K>, keyEqualer?: Equaler<K>) {
        return fn.toHashMapAsync(getSource(this), keySelector, elementSelector as (element: T) => PromiseLike<T | V> | T | V, keyEqualer!);
    }

    /**
     * Creates a `Lookup` for the elements of the `AsyncQuery`.
     *
     * @param keySelector A callback used to select a key for each element.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Scalar
     */
    toLookup<K>(keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Promise<Lookup<K, T>>;
    /**
     * Creates a `Lookup` for the elements of the `AsyncQuery`.
     *
     * @param keySelector A callback used to select a key for each element.
     * @param elementSelector A callback that selects a value for each element.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Scalar
     */
    toLookup<K, V>(keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, keyEqualer?: Equaler<K>): Promise<Lookup<K, V>>;
    toLookup<K, V>(keySelector: (element: T) => K, elementSelector?: ((element: T) => PromiseLike<T | V> | T | V) | Equaler<K>, keyEqualer?: Equaler<K>): Promise<Lookup<K, T | V>> {
        return fn.toLookupAsync(getSource(this), keySelector, elementSelector as (element: T) => PromiseLike<T | V> | T | V, keyEqualer!);
    }

    /**
     * Creates an Object for the elements of the `AsyncQuery`. Properties are added via `Object.defineProperty`.
     *
     * ```ts
     * // As a regular object
     * const obj = from(`"`, 1], ["y", 2]]).toObject(undefined, a => a[0]);
     * obj.x; // ["x", 1]
     * obj.y; // ["y", 2]
     * typeof obj.toString; // function
     *
     * // with a custom prototype
     * const baseObject = { toString() { return `${this.x}:${this.y}` } };
     * const obj = from(`"`, 1], ["y", 2]]).toObject(baseObject, a => a[0]);
     * obj.x; // ["x", 1]
     * obj.y; // ["y", 2]
     * typeof obj.toString; // function
     * obj.toString(); // "x",1:"y",2
     *
     * // with a null prototype
     * const obj = from(`"`, 1], ["y", 2]]).toObject(null, a => a[0]);
     * obj.x; // ["x", 1]
     * obj.y; // ["y", 2]
     * typeof obj.toString; // undefined
     * ```
     *
     * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
     * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
     * @param keySelector A callback used to select a key for each element.
     * @category Scalar
     */
    toObject<TProto extends object, K extends PropertyKey>(prototype: TProto, keySelector: (element: T) => K): Promise<TProto & Record<K, T>>;
    /**
     * Creates an Object for the elements of the `AsyncQuery`. Properties are added via `Object.defineProperty`.
     *
     * ```ts
     * // As a regular object
     * const obj = from(`"`, 1], ["y", 2]]).toObject(undefined, a => a[0]);
     * obj.x; // ["x", 1]
     * obj.y; // ["y", 2]
     * typeof obj.toString; // function
     *
     * // with a custom prototype
     * const baseObject = { toString() { return `${this.x}:${this.y}` } };
     * const obj = from(`"`, 1], ["y", 2]]).toObject(baseObject, a => a[0]);
     * obj.x; // ["x", 1]
     * obj.y; // ["y", 2]
     * typeof obj.toString; // function
     * obj.toString(); // "x",1:"y",2
     *
     * // with a null prototype
     * const obj = from(`"`, 1], ["y", 2]]).toObject(null, a => a[0]);
     * obj.x; // ["x", 1]
     * obj.y; // ["y", 2]
     * typeof obj.toString; // undefined
     * ```
     *
     * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
     * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
     * @param keySelector A callback used to select a key for each element.
     * @category Scalar
     */
    toObject<TProto extends object>(prototype: TProto, keySelector: (element: T) => PropertyKey): Promise<TProto & Record<PropertyKey, T>>;
    /**
     * Creates an Object for the elements of the `AsyncQuery`. Properties are added via `Object.defineProperty`.
     *
     * ```ts
     * // As a regular object
     * const obj = from(`"`, 1], ["y", 2]]).toObject(undefined, a => a[0]);
     * obj.x; // ["x", 1]
     * obj.y; // ["y", 2]
     * typeof obj.toString; // function
     *
     * // with a custom prototype
     * const baseObject = { toString() { return `${this.x}:${this.y}` } };
     * const obj = from(`"`, 1], ["y", 2]]).toObject(baseObject, a => a[0]);
     * obj.x; // ["x", 1]
     * obj.y; // ["y", 2]
     * typeof obj.toString; // function
     * obj.toString(); // "x",1:"y",2
     *
     * // with a null prototype
     * const obj = from(`"`, 1], ["y", 2]]).toObject(null, a => a[0]);
     * obj.x; // ["x", 1]
     * obj.y; // ["y", 2]
     * typeof obj.toString; // undefined
     * ```
     *
     * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
     * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
     * @param keySelector A callback used to select a key for each element.
     * @category Scalar
     */
    toObject<K extends PropertyKey>(prototype: object | null | undefined, keySelector: (element: T) => K): Promise<Record<PropertyKey, T>>;
    /**
     * Creates an Object for the elements of the `AsyncQuery`. Properties are added via `Object.defineProperty`.
     *
     * ```ts
     * // As a regular object
     * const obj = from(`"`, 1], ["y", 2]]).toObject(undefined, a => a[0]);
     * obj.x; // ["x", 1]
     * obj.y; // ["y", 2]
     * typeof obj.toString; // function
     *
     * // with a custom prototype
     * const baseObject = { toString() { return `${this.x}:${this.y}` } };
     * const obj = from(`"`, 1], ["y", 2]]).toObject(baseObject, a => a[0]);
     * obj.x; // ["x", 1]
     * obj.y; // ["y", 2]
     * typeof obj.toString; // function
     * obj.toString(); // "x",1:"y",2
     *
     * // with a null prototype
     * const obj = from(`"`, 1], ["y", 2]]).toObject(null, a => a[0]);
     * obj.x; // ["x", 1]
     * obj.y; // ["y", 2]
     * typeof obj.toString; // undefined
     * ```
     *
     * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
     * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
     * @param keySelector A callback used to select a key for each element.
     * @category Scalar
     */
    toObject(prototype: object | null | undefined, keySelector: (element: T) => PropertyKey): Promise<object>;
    /**
     * Creates an Object for the elements the `AsyncQuery`. Properties are added via `Object.defineProperty`.
     *
     * ```ts
     * // As a regular object
     * const obj = from(`"`, 1], ["y", 2]]).toObject(undefined, a => a[0], a => a[1]);
     * obj.x; // 1
     * obj.y; // 2
     * typeof obj.toString; // function
     *
     * // with a custom prototype
     * const baseObject = { toString() { return `${this.x}:${this.y}` } };
     * const obj = from(`"`, 1], ["y", 2]]).toObject(baseObject, a => a[0], a => a[1]);
     * obj.x; // 1
     * obj.y; // 2
     * typeof obj.toString; // function
     * obj.toString(); // 1:2
     *
     * // with a null prototype
     * const obj = from(`"`, 1], ["y", 2]]).toObject(null, a => a[0], a => a[1]);
     * obj.x; // 1
     * obj.y; // 2
     * typeof obj.toString; // undefined
     * ```
     *
     * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
     * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
     * @param keySelector A callback used to select a key for each element.
     * @param elementSelector A callback that selects a value for each element.
     * @param descriptorSelector A callback that defines the `PropertyDescriptor` for each property.
     * @category Scalar
     */
    toObject<TProto extends object, K extends PropertyKey, V>(prototype: TProto, keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, descriptorSelector?: (key: K, element: V) => TypedPropertyDescriptor<V>): Promise<TProto & Record<K, V>>;
    /**
     * Creates an Object for the elements the `AsyncQuery`. Properties are added via `Object.defineProperty`.
     *
     * ```ts
     * // As a regular object
     * const obj = from(`"`, 1], ["y", 2]]).toObject(undefined, a => a[0], a => a[1]);
     * obj.x; // 1
     * obj.y; // 2
     * typeof obj.toString; // function
     *
     * // with a custom prototype
     * const baseObject = { toString() { return `${this.x}:${this.y}` } };
     * const obj = from(`"`, 1], ["y", 2]]).toObject(baseObject, a => a[0], a => a[1]);
     * obj.x; // 1
     * obj.y; // 2
     * typeof obj.toString; // function
     * obj.toString(); // 1:2
     *
     * // with a null prototype
     * const obj = from(`"`, 1], ["y", 2]]).toObject(null, a => a[0], a => a[1]);
     * obj.x; // 1
     * obj.y; // 2
     * typeof obj.toString; // undefined
     * ```
     *
     * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
     * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
     * @param keySelector A callback used to select a key for each element.
     * @param elementSelector A callback that selects a value for each element.
     * @param descriptorSelector A callback that defines the `PropertyDescriptor` for each property.
     * @category Scalar
     */
    toObject<TProto extends object, V>(prototype: TProto, keySelector: (element: T) => PropertyKey, elementSelector: (element: T) => PromiseLike<V> | V, descriptorSelector?: (key: PropertyKey, element: V) => TypedPropertyDescriptor<V>): Promise<TProto & Record<PropertyKey, V>>;
    /**
     * Creates an Object for the elements the `AsyncQuery`. Properties are added via `Object.defineProperty`.
     *
     * ```ts
     * // As a regular object
     * const obj = from(`"`, 1], ["y", 2]]).toObject(undefined, a => a[0], a => a[1]);
     * obj.x; // 1
     * obj.y; // 2
     * typeof obj.toString; // function
     *
     * // with a custom prototype
     * const baseObject = { toString() { return `${this.x}:${this.y}` } };
     * const obj = from(`"`, 1], ["y", 2]]).toObject(baseObject, a => a[0], a => a[1]);
     * obj.x; // 1
     * obj.y; // 2
     * typeof obj.toString; // function
     * obj.toString(); // 1:2
     *
     * // with a null prototype
     * const obj = from(`"`, 1], ["y", 2]]).toObject(null, a => a[0], a => a[1]);
     * obj.x; // 1
     * obj.y; // 2
     * typeof obj.toString; // undefined
     * ```
     *
     * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
     * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
     * @param keySelector A callback used to select a key for each element.
     * @param elementSelector A callback that selects a value for each element.
     * @param descriptorSelector A callback that defines the `PropertyDescriptor` for each property.
     * @category Scalar
     */
    toObject<K extends PropertyKey, V>(prototype: object | null | undefined, keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, descriptorSelector?: (key: K, element: V) => TypedPropertyDescriptor<V>): Promise<Record<K, V>>;
    /**
     * Creates an Object for the elements the `AsyncQuery`. Properties are added via `Object.defineProperty`.
     *
     * ```ts
     * // As a regular object
     * const obj = from(`"`, 1], ["y", 2]]).toObject(undefined, a => a[0], a => a[1]);
     * obj.x; // 1
     * obj.y; // 2
     * typeof obj.toString; // function
     *
     * // with a custom prototype
     * const baseObject = { toString() { return `${this.x}:${this.y}` } };
     * const obj = from(`"`, 1], ["y", 2]]).toObject(baseObject, a => a[0], a => a[1]);
     * obj.x; // 1
     * obj.y; // 2
     * typeof obj.toString; // function
     * obj.toString(); // 1:2
     *
     * // with a null prototype
     * const obj = from(`"`, 1], ["y", 2]]).toObject(null, a => a[0], a => a[1]);
     * obj.x; // 1
     * obj.y; // 2
     * typeof obj.toString; // undefined
     * ```
     *
     * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
     * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
     * @param keySelector A callback used to select a key for each element.
     * @param elementSelector A callback that selects a value for each element.
     * @param descriptorSelector A callback that defines the `PropertyDescriptor` for each property.
     * @category Scalar
     */
    toObject<V>(prototype: object | null | undefined, keySelector: (element: T) => PropertyKey, elementSelector: (element: T) => PromiseLike<V> | V, descriptorSelector?: (key: PropertyKey, element: V) => TypedPropertyDescriptor<V>): Promise<Record<PropertyKey, V>>;
    /**
     * Creates an Object for the elements the `AsyncQuery`. Properties are added via `Object.defineProperty`.
     *
     * ```ts
     * // As a regular object
     * const obj = from(`"`, 1], ["y", 2]]).toObject(undefined, a => a[0], a => a[1]);
     * obj.x; // 1
     * obj.y; // 2
     * typeof obj.toString; // function
     *
     * // with a custom prototype
     * const baseObject = { toString() { return `${this.x}:${this.y}` } };
     * const obj = from(`"`, 1], ["y", 2]]).toObject(baseObject, a => a[0], a => a[1]);
     * obj.x; // 1
     * obj.y; // 2
     * typeof obj.toString; // function
     * obj.toString(); // 1:2
     *
     * // with a null prototype
     * const obj = from(`"`, 1], ["y", 2]]).toObject(null, a => a[0], a => a[1]);
     * obj.x; // 1
     * obj.y; // 2
     * typeof obj.toString; // undefined
     * ```
     *
     * @param prototype The prototype for the object. If `prototype` is `null`, an object with a `null`
     * prototype is created. If `prototype` is `undefined`, the default `Object.prototype` is used.
     * @param keySelector A callback used to select a key for each element.
     * @param elementSelector A callback that selects a value for each element.
     * @param descriptorSelector A callback that defines the `PropertyDescriptor` for each property.
     * @category Scalar
     */
    toObject<V>(prototype: object | null | undefined, keySelector: (element: T) => PropertyKey, elementSelector: (element: T) => PromiseLike<V> | V, descriptorSelector?: (key: PropertyKey, element: V) => PropertyDescriptor): Promise<object>;
    toObject<V>(prototype: object | null | undefined, keySelector: (element: T) => PropertyKey, elementSelector?: (element: T) => PromiseLike<V> | V, descriptorSelector?: (key: PropertyKey, element: V) => PropertyDescriptor): Promise<object> {
        return fn.toObjectAsync(getSource(this), prototype, keySelector, elementSelector!, descriptorSelector);
    }

    /**
     * Writes each element to a destination. The destination must already
     * have enough space to write the requested number of elements (i.e.
     * arrays are *not* resized).
     *
     * @param dest The destination array.
     * @param start The offset into the array at which to start writing.
     * @param count The number of elements to write to the array.
     * @category Scalar
     */
    copyTo<U extends IndexedCollection<T> | T[]>(dest: U, start?: number, count?: number): Promise<U> {
        return fn.copyToAsync(getSource(this), dest, start, count);
    }

    /**
     * Pass the entire `AsyncQuery` to the provided callback, returning the result.
     *
     * @param callback A callback function.
     * @param callback.source The outer `AsyncQuery`.
     * @category Scalar
     */
    into<R>(callback: (source: this) => R) {
        return fn.intoAsync(this, callback);
    }

    // #endregion Scalar

    [Symbol.asyncIterator](): AsyncIterator<T> {
        return this[kSource][Symbol.asyncIterator]();
    }

    protected _fromAsync<TNode, T extends TNode>(source: AsyncOrderedHierarchyIterable<TNode, T> | OrderedHierarchyIterable<TNode, T>): AsyncOrderedHierarchyQuery<TNode, T>;
    protected _fromAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>): AsyncHierarchyQuery<TNode, T>;
    protected _fromAsync<TNode, T extends TNode>(source: AsyncOrderedIterable<T> | OrderedIterable<T>, provider: HierarchyProvider<TNode>): AsyncOrderedHierarchyQuery<TNode, T>;
    protected _fromAsync<TNode, T extends TNode>(source: AsyncIterable<T> | Iterable<T>, provider: HierarchyProvider<TNode>): AsyncHierarchyQuery<TNode, T>;
    protected _fromAsync<T>(source: AsyncOrderedIterable<T> | OrderedIterable<T>): AsyncOrderedQuery<T>;
    protected _fromAsync<T extends readonly unknown[] | []>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncQuery<T>;
    protected _fromAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncQuery<T>;
    protected _fromAsync<TNode, T extends TNode>(source: AsyncIterable<T> | Iterable<T>, provider?: HierarchyProvider<TNode>): AsyncQuery<T> {
        return (this.constructor as typeof AsyncQuery).from(source, provider!) as any;
    }

    protected _fromSync<TNode, T extends TNode>(source: OrderedHierarchyIterable<TNode, T>): OrderedHierarchyQuery<TNode, T>;
    protected _fromSync<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>): HierarchyQuery<TNode, T>;
    protected _fromSync<TNode, T extends TNode>(source: OrderedIterable<T>, provider: HierarchyProvider<TNode>): OrderedHierarchyQuery<TNode, T>;
    protected _fromSync<TNode, T extends TNode>(source: Iterable<T>, provider: HierarchyProvider<TNode>): HierarchyQuery<TNode, T>;
    protected _fromSync<T>(source: OrderedIterable<T>): OrderedQuery<T>;
    protected _fromSync<T extends readonly unknown[] | []>(source: Iterable<T>): Query<T>;
    protected _fromSync<T>(source: Iterable<T>): Query<T>;
    protected _fromSync<TNode, T extends TNode>(source: Iterable<T>, provider?: HierarchyProvider<TNode>): Query<T> {
        return Query.from(source, provider!);
    }
}

// Inline aliases to simplify call stacks
AsyncQuery.prototype.where = AsyncQuery.prototype.filter;
AsyncQuery.prototype.whereBy = AsyncQuery.prototype.filterBy;
AsyncQuery.prototype.whereDefined = AsyncQuery.prototype.filterDefined;
AsyncQuery.prototype.whereDefinedBy = AsyncQuery.prototype.filterDefinedBy;
AsyncQuery.prototype.whereNot = AsyncQuery.prototype.filterNot;
AsyncQuery.prototype.whereNotBy = AsyncQuery.prototype.filterNotBy;
AsyncQuery.prototype.whereNotDefinedBy = AsyncQuery.prototype.filterNotDefinedBy;
AsyncQuery.prototype.select = AsyncQuery.prototype.map;
AsyncQuery.prototype.selectMany = AsyncQuery.prototype.flatMap;
AsyncQuery.prototype.skip = AsyncQuery.prototype.drop;
AsyncQuery.prototype.skipRight = AsyncQuery.prototype.dropRight;
AsyncQuery.prototype.skipWhile = AsyncQuery.prototype.dropWhile;
AsyncQuery.prototype.skipUntil = AsyncQuery.prototype.dropUntil;
AsyncQuery.prototype.relativeComplement = AsyncQuery.prototype.except;
AsyncQuery.prototype.relativeComplementBy = AsyncQuery.prototype.exceptBy;
AsyncQuery.prototype.nth = AsyncQuery.prototype.elementAt;
AsyncQuery.prototype.break = AsyncQuery.prototype.spanUntil;

/**
 * Represents an ordered sequence of elements.
 */
export class AsyncOrderedQuery<T> extends AsyncQuery<T> implements AsyncOrderedIterable<T> {
    constructor(source: AsyncOrderedIterable<T> | OrderedIterable<T>) {
        if (!AsyncOrderedIterable.hasInstance(source) && !OrderedIterable.hasInstance(source)) throw new TypeError("AsyncOrderedIterable expected: source");
        super(source);
    }

    // #region Order

    /**
     * Creates a subsequent ordered subquery whose elements are sorted in ascending order by the provided key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param comparer An optional callback used to compare two keys.
     * @category Order
     */
    thenBy<K>(keySelector: (element: T) => K, comparer?: Comparison<K> | Comparer<K>): AsyncOrderedQuery<T> {
        return this._fromAsync(fn.thenByAsync(getSource(this), keySelector, comparer));
    }

    /**
     * Creates a subsequent ordered subquery whose elements are sorted in descending order by the provided key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param comparer An optional callback used to compare two keys.
     * @category Order
     */
    thenByDescending<K>(keySelector: (element: T) => K, comparer?: Comparison<K> | Comparer<K>): AsyncOrderedQuery<T> {
        return this._fromAsync(fn.thenByDescendingAsync(getSource(this), keySelector, comparer));
    }

    // #endregion Order

    [AsyncOrderedIterable.thenByAsync]<K>(keySelector: (element: T) => K, comparer: Comparison<K> | Comparer<K>, descending: boolean): AsyncOrderedIterable<T> {
        return getSource(this)[AsyncOrderedIterable.thenByAsync](keySelector, comparer, descending);
    }
}

/**
 * Represents a sequence of hierarchically organized values.
 */
export class AsyncHierarchyQuery<TNode, T extends TNode = TNode> extends AsyncQuery<T> implements AsyncHierarchyIterable<TNode, T> {
    constructor(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>);
    constructor(source: AsyncIterable<T> | Iterable<T>, provider: HierarchyProvider<TNode>);
    constructor(source: AsyncHierarchyIterable<TNode, T> | AsyncIterable<T> | HierarchyIterable<TNode, T> | Iterable<T>, provider?: HierarchyProvider<TNode>) {
        if (provider !== undefined) {
            if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
            if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
            source = fn.toHierarchyAsync(source, provider);
        }
        else {
            if (!AsyncHierarchyIterable.hasInstance(source) && !HierarchyIterable.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
        }
        super(source);
    }

    // // #region Subquery

    // /**
    //  * Creates a subquery whose elements match the supplied predicate.
    //  *
    //  * @param predicate A callback used to match each element.
    //  * @param predicate.element The element to test.
    //  * @param predicate.offset The offset from the start of the source iterable.
    //  * @category Subquery
    //  */
    // filter<U extends T>(predicate: (element: T, offset: number) => element is U): AsyncHierarchyQuery<TNode, U>;
    // /**
    //  * Creates a subquery whose elements match the supplied predicate.
    //  *
    //  * @param predicate A callback used to match each element.
    //  * @param predicate.element The element to test.
    //  * @param predicate.offset The offset from the start of the source iterable.
    //  * @category Subquery
    //  */
    // filter(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode, T>;
    // filter(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean) {
    //     return super.filter(predicate) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery where the selected key for each element matches the supplied predicate.
    //  *
    //  * @param keySelector A callback used to select the key for each element.
    //  * @param keySelector.element The element from which to select a key.
    //  * @param predicate A callback used to match each key.
    //  * @param predicate.key The key to test.
    //  * @param predicate.offset The offset from the start of the source iterable.
    //  * @category Subquery
    //  */
    // filterBy<K>(keySelector: (element: T) => K, predicate: (key: K, offset: number) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode, T> {
    //     return super.filterBy(keySelector, predicate) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery whose elements are neither `null` nor `undefined`.
    //  *
    //  * @category Subquery
    //  */
    // filterDefined(): AsyncHierarchyQuery<TNode, NonNullable<T>> {
    //     return super.filterDefined() as AsyncHierarchyQuery<TNode, NonNullable<T>>;
    // }

    // /**
    //  * Creates a subquery where the selected key for each element is neither `null` nor `undefined`.
    //  *
    //  * @param keySelector A callback used to select the key for each element.
    //  * @param keySelector.element The element from which to select a key.
    //  * @category Subquery
    //  */
    // filterDefinedBy<K>(keySelector: (element: T) => K): AsyncHierarchyQuery<TNode, T> {
    //     return super.filterDefinedBy(keySelector) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery whose elements match the supplied predicate.
    //  *
    //  * NOTE: This is an alias for `filter`.
    //  *
    //  * @param predicate A callback used to match each element.
    //  * @param predicate.element The element to test.
    //  * @param predicate.offset The offset from the start of the source iterable.
    //  * @category Subquery
    //  */
    // where<U extends T>(predicate: (element: T, offset: number) => element is U): AsyncHierarchyQuery<TNode, U>;
    // /**
    //  * Creates a subquery whose elements match the supplied predicate.
    //  *
    //  * NOTE: This is an alias for `filter`.
    //  *
    //  * @param predicate A callback used to match each element.
    //  * @param predicate.element The element to test.
    //  * @param predicate.offset The offset from the start of the source iterable.
    //  * @category Subquery
    //  */
    // where(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode, T>;
    // where(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean) {
    //     return this.filter(predicate) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery where the selected key for each element matches the supplied predicate.
    //  *
    //  * NOTE: This is an alias for `filterBy`.
    //  *
    //  * @param keySelector A callback used to select the key for each element.
    //  * @param keySelector.element The element from which to select a key.
    //  * @param predicate A callback used to match each key.
    //  * @param predicate.key The key to test.
    //  * @param predicate.offset The offset from the start of the source iterable.
    //  * @category Subquery
    //  */
    // whereBy<K>(keySelector: (element: T) => K, predicate: (key: K, offset: number) => PromiseLike<boolean> | boolean) {
    //     return this.filterBy(keySelector, predicate);
    // }

    // /**
    //  * Creates a subquery whose elements are neither `null` nor `undefined`.
    //  *
    //  * NOTE: This is an alias for `filterDefined`.
    //  *
    //  * @category Subquery
    //  */
    // whereDefined() {
    //     return this.filterDefined();
    // }

    // /**
    //  * Creates a subquery where the selected key for each element is neither `null` nor `undefined`.
    //  *
    //  * NOTE: This is an alias for `filterDefinedBy`.
    //  *
    //  * @param keySelector A callback used to select the key for each element.
    //  * @param keySelector.element The element from which to select a key.
    //  * @category Subquery
    //  */
    // whereDefinedBy<K>(keySelector: (element: T) => K) {
    //     return this.filterDefinedBy(keySelector);
    // }

    // /**
    //  * Creates a subquery whose elements do not match the supplied predicate.
    //  *
    //  * @param predicate A callback used to match each element.
    //  * @param predicate.element The element to test.
    //  * @param predicate.offset The offset from the start of the source iterable.
    //  * @category Subquery
    //  */
    // filterNot<U extends T>(predicate: (element: T, offset: number) => element is U): AsyncHierarchyQuery<TNode, U>;
    // /**
    //  * Creates a subquery whose elements do not match the supplied predicate.
    //  *
    //  * @param predicate A callback used to match each element.
    //  * @param predicate.element The element to test.
    //  * @param predicate.offset The offset from the start of the source iterable.
    //  * @category Subquery
    //  */
    // filterNot(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode, T>;
    // filterNot(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean) {
    //     return super.filterNot(predicate) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery where the selected key for each element does not match the supplied predicate.
    //  *
    //  * @param keySelector A callback used to select the key for each element.
    //  * @param keySelector.element The element from which to select a key.
    //  * @param predicate A callback used to match each key.
    //  * @param predicate.key The key to test.
    //  * @param predicate.offset The offset from the start of the source iterable.
    //  * @category Subquery
    //  */
    // filterNotBy<K>(keySelector: (element: T) => K, predicate: (key: K, offset: number) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode, T> {
    //     return super.filterNotBy(keySelector, predicate) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery where the selected key for each element is neither `null` nor `undefined`.
    //  *
    //  * @param keySelector A callback used to select the key for each element.
    //  * @param keySelector.element The element from which to select a key.
    //  * @category Subquery
    //  */
    // filterNotDefinedBy<K>(keySelector: (element: T) => K): AsyncHierarchyQuery<TNode, T> {
    //     return super.filterNotDefinedBy(keySelector) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery whose elements do not match the supplied predicate.
    //  *
    //  * NOTE: This is an alias for `filterNot`.
    //  *
    //  * @param predicate A callback used to match each element.
    //  * @param predicate.element The element to test.
    //  * @param predicate.offset The offset from the start of the source iterable.
    //  * @category Subquery
    //  */
    // whereNot<U extends T>(predicate: (element: T, offset: number) => element is U): AsyncHierarchyQuery<TNode, U>;
    // /**
    //  * Creates a subquery whose elements do not match the supplied predicate.
    //  *
    //  * NOTE: This is an alias for `filterNot`.
    //  *
    //  * @param predicate A callback used to match each element.
    //  * @param predicate.element The element to test.
    //  * @param predicate.offset The offset from the start of the source iterable.
    //  * @category Subquery
    //  */
    // whereNot(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode, T>;
    // whereNot(predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean) {
    //     return this.filterNot(predicate) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery where the selected key for each element does not match the supplied predicate.
    //  *
    //  * NOTE: This is an alias for `filterNotBy`.
    //  *
    //  * @param keySelector A callback used to select the key for each element.
    //  * @param keySelector.element The element from which to select a key.
    //  * @param predicate A callback used to match each key.
    //  * @param predicate.key The key to test.
    //  * @param predicate.offset The offset from the start of the source iterable.
    //  * @category Subquery
    //  */
    // whereNotBy<K>(keySelector: (element: T) => K, predicate: (key: K, offset: number) => PromiseLike<boolean> | boolean) {
    //     return this.filterNotBy(keySelector, predicate);
    // }

    // /**
    //  * Creates a subquery where the selected key for each element is neither `null` nor `undefined`.
    //  *
    //  * NOTE: This is an alias for `filterNotDefinedBy`.
    //  *
    //  * @param keySelector A callback used to select the key for each element.
    //  * @param keySelector.element The element from which to select a key.
    //  * @category Subquery
    //  */
    // whereNotDefinedBy<K>(keySelector: (element: T) => K) {
    //     return this.filterDefinedBy(keySelector);
    // }

    // /**
    //  * Creates a subquery whose elements are in the reverse order.
    //  *
    //  * @category Subquery
    //  */
    // reverse(): AsyncHierarchyQuery<TNode, T> {
    //     return super.reverse() as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery with every instance of the specified value removed.
    //  *
    //  * @param values The values to exclude.
    //  * @category Subquery
    //  */
    // exclude(...values: [PromiseLike<T> | T, ...(PromiseLike<T> | T)[]]): AsyncHierarchyQuery<TNode, T> {
    //     return super.exclude(...values) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery containing all elements except the first elements up to the supplied
    //  * count.
    //  *
    //  * @param count The number of elements to drop.
    //  * @category Subquery
    //  */
    // drop(count: number): AsyncHierarchyQuery<TNode, T> {
    //     return super.drop(count) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery containing all elements except the last elements up to the supplied
    //  * count.
    //  *
    //  * @param count The number of elements to drop.
    //  * @category Subquery
    //  */
    // dropRight(count: number): AsyncHierarchyQuery<TNode, T> {
    //     return super.dropRight(count) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery containing all elements except the first elements that match
    //  * the supplied predicate.
    //  *
    //  * @param predicate A callback used to match each element.
    //  * @param predicate.element The element to match.
    //  * @category Subquery
    //  */
    // dropWhile(predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode, T> {
    //     return super.dropWhile(predicate) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery containing all elements except the first elements that don't match
    //  * the supplied predicate.
    //  *
    //  * @param predicate A callback used to match each element.
    //  * @param predicate.element The element to match.
    //  * @category Subquery
    //  */
    // dropUntil(predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode, T> {
    //     return super.dropUntil(predicate) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery containing all elements except the first elements up to the supplied
    //  * count.
    //  *
    //  * NOTE: This is an alias for `drop`.
    //  *
    //  * @param count The number of elements to skip.
    //  * @category Subquery
    //  */
    // skip(count: number) {
    //     return this.drop(count);
    // }

    // /**
    //  * Creates a subquery containing all elements except the last elements up to the supplied
    //  * count.
    //  *
    //  * NOTE: This is an alias for `dropRight`.
    //  *
    //  * @param count The number of elements to skip.
    //  * @category Subquery
    //  */
    // skipRight(count: number) {
    //     return this.dropRight(count);
    // }

    // /**
    //  * Creates a subquery containing all elements except the first elements that match
    //  * the supplied predicate.
    //  *
    //  * NOTE: This is an alias for `dropWhile`.
    //  *
    //  * @param predicate A callback used to match each element.
    //  * @param predicate.element The element to match.
    //  * @category Subquery
    //  */
    // skipWhile(predicate: (element: T) => PromiseLike<boolean> | boolean) {
    //     return this.dropWhile(predicate);
    // }

    // /**
    //  * Creates a subquery containing all elements except the first elements that don't match
    //  * the supplied predicate.
    //  *
    //  * NOTE: This is an alias for `dropUntil`.
    //  *
    //  * @param predicate A callback used to match each element.
    //  * @param predicate.element The element to match.
    //  * @category Subquery
    //  */
    // skipUntil(predicate: (element: T) => PromiseLike<boolean> | boolean) {
    //     return this.dropUntil(predicate);
    // }

    // /**
    //  * Creates a subquery containing the first elements up to the supplied
    //  * count.
    //  *
    //  * @param count The number of elements to take.
    //  * @category Subquery
    //  */
    // take(count: number): AsyncHierarchyQuery<TNode, T> {
    //     return super.take(count) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery containing the last elements up to the supplied
    //  * count.
    //  *
    //  * @param count The number of elements to take.
    //  * @category Subquery
    //  */
    // takeRight(count: number): AsyncHierarchyQuery<TNode, T> {
    //     return super.takeRight(count) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery containing the first elements that match the supplied predicate.
    //  *
    //  * @param predicate A callback used to match each element.
    //  * @param predicate.element The element to match.
    //  * @category Subquery
    //  */
    // takeWhile<U extends T>(predicate: (element: T) => element is U): AsyncHierarchyQuery<TNode, U>;
    // /**
    //  * Creates a subquery containing the first elements that match the supplied predicate.
    //  *
    //  * @param predicate A callback used to match each element.
    //  * @param predicate.element The element to match.
    //  */
    // takeWhile(predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode, T>;
    // takeWhile(predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode, T> {
    //     return super.takeWhile(predicate) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery containing the first elements that do not match the supplied predicate.
    //  *
    //  * @param predicate A callback used to match each element.
    //  * @param predicate.element The element to match.
    //  * @category Subquery
    //  */
    // takeUntil(predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode, T> {
    //     return super.takeUntil(predicate) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery for the set intersection of this `AsyncQuery` and another `AsyncIterable` or `Iterable`.
    //  *
    //  * @param right An `AsyncIterable` or `Iterable` object.
    //  * @param equaler An `Equaler` object used to compare equality.
    //  * @category Subquery
    //  */
    // intersect(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncHierarchyQuery<TNode, T> {
    //     return super.intersect(right, equaler) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery for the set intersection of this `AsyncQuery` and another `AsyncIterable` or `Iterable`, where set identity is determined by the selected key.
    //  *
    //  * @param right An `AsyncIterable` or `Iterable` object.
    //  * @param keySelector A callback used to select the key for each element.
    //  * @param keySelector.element An element from which to select a key.
    //  * @param keyEqualer An `Equaler` object used to compare key equality.
    //  * @category Subquery
    //  */
    // intersectBy<K>(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncHierarchyQuery<TNode, T> {
    //     return super.intersectBy(right, keySelector, keyEqualer) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery for the set union of this `AsyncQuery` and another `AsyncIterable` or `Iterable`.
    //  *
    //  * @param right An `AsyncIterable` or `Iterable` object.
    //  * @param equaler An `Equaler` object used to compare equality.
    //  * @category Subquery
    //  */
    // union(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncHierarchyQuery<TNode, T> {
    //     return super.union(right, equaler) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery for the set union of this `AsyncQuery` and another `AsyncIterable` or `Iterable`, where set identity is determined by the selected key.
    //  *
    //  * @param right An `AsyncIterable` or `Iterable` object.
    //  * @param keySelector A callback used to select the key for each element.
    //  * @param keySelector.element An element from which to select a key.
    //  * @param keyEqualer An `Equaler` object used to compare key equality.
    //  * @category Subquery
    //  */
    // unionBy<K>(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncHierarchyQuery<TNode, T> {
    //     return super.unionBy(right, keySelector, keyEqualer) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery for the set difference between this and another `AsyncIterable` or `Iterable`.
    //  *
    //  * @param right An `AsyncIterable` or `Iterable` object.
    //  * @param equaler An `Equaler` object used to compare equality.
    //  * @category Subquery
    //  */
    // except(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncHierarchyQuery<TNode, T> {
    //     return super.except(right, equaler) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery for the set difference between this and another `AsyncIterable` or `Iterable`, where set identity is determined by the selected key.
    //  *
    //  * @param right An `AsyncIterable` or `Iterable` object.
    //  * @param keySelector A callback used to select the key for each element.
    //  * @param keySelector.element An element from which to select a key.
    //  * @param keyEqualer An `Equaler` object used to compare key equality.
    //  * @category Subquery
    //  */
    // exceptBy<K>(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncHierarchyQuery<TNode, T> {
    //     return super.exceptBy(right, keySelector, keyEqualer) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery for the set difference between this and another `AsyncIterable` or `Iterable`.
    //  *
    //  * NOTE: This is an alias for `except`.
    //  *
    //  * @param right An `AsyncIterable` or `Iterable` object.
    //  * @param equaler An `Equaler` object used to compare equality.
    //  * @category Subquery
    //  */
    // relativeComplement(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>) {
    //     return this.except(right, equaler);
    // }

    // /**
    //  * Creates a subquery for the set difference between this and another `AsyncIterable` or `Iterable`, where set identity is determined by the selected key.
    //  *
    //  * NOTE: This is an alias for `exceptBy`.
    //  *
    //  * @param right An `AsyncIterable` or `Iterable` object.
    //  * @param keySelector A callback used to select the key for each element.
    //  * @param keySelector.element An element from which to select a key.
    //  * @param keyEqualer An `Equaler` object used to compare key equality.
    //  * @category Subquery
    //  */
    // relativeComplementBy<K>(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>) {
    //     return this.exceptBy(right, keySelector, keyEqualer);
    // }

    // /**
    //  * Creates a subquery for the symmetric difference between this and another `AsyncIterable` or `Iterable`.
    //  *
    //  * @param right An `AsyncIterable` or `Iterable` object.
    //  * @param equaler An `Equaler` object used to compare equality.
    //  * @category Subquery
    //  */
    // symmetricDifference(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncHierarchyQuery<TNode, T> {
    //     return super.symmetricDifference(right, equaler) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery for the symmetric difference between this and another `AsyncIterable` or `Iterable`, where set identity is determined by the selected key.
    //  *
    //  * @param right An `AsyncIterable` or `Iterable` object.
    //  * @param keySelector A callback used to select the key for each element.
    //  * @param keySelector.element An element from which to select a key.
    //  * @param keyEqualer An `Equaler` object used to compare key equality.
    //  * @category Subquery
    //  */
    // symmetricDifferenceBy<K>(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncHierarchyQuery<TNode, T> {
    //     return super.symmetricDifferenceBy(right, keySelector, keyEqualer) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery that concatenates this `AsyncQuery` with another `AsyncIterable` or `Iterable`.
    //  *
    //  * @param right An `AsyncIterable` or `Iterable` object.
    //  * @category Subquery
    //  */
    // concat(right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncHierarchyQuery<TNode, T> {
    //     return super.concat(right) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery for the distinct elements of this `AsyncQuery`.
    //  * @param equaler An `Equaler` object used to compare key equality.
    //  * @category Subquery
    //  */
    // distinct(equaler?: Equaler<T>): AsyncHierarchyQuery<TNode, T> {
    //     return super.distinct(equaler) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery for the distinct elements of this `AsyncQuery`.
    //  *
    //  * @param keySelector A callback used to select the key to determine uniqueness.
    //  * @param keySelector.value An element from which to select a key.
    //  * @param keyEqualer An `Equaler` object used to compare key equality.
    //  * @category Subquery
    //  */
    // distinctBy<K>(keySelector: (value: T) => K, keyEqualer?: Equaler<K>): AsyncHierarchyQuery<TNode, T> {
    //     return super.distinctBy(keySelector, keyEqualer) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery for the elements of this `AsyncQuery` with the provided value appended to the end.
    //  *
    //  * @param value The value to append.
    //  * @category Subquery
    //  */
    // append(value: PromiseLike<T> | T): AsyncHierarchyQuery<TNode, T> {
    //     return super.append(value) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery for the elements of this `AsyncQuery` with the provided value prepended to the beginning.
    //  *
    //  * @param value The value to prepend.
    //  * @category Subquery
    //  */
    // prepend(value: PromiseLike<T> | T): AsyncHierarchyQuery<TNode, T> {
    //     return super.prepend(value) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery for the elements of this `AsyncQuery` with the provided range
    //  * patched into the results.
    //  *
    //  * @param start The offset at which to patch the range.
    //  * @param skipCount The number of elements to skip from start.
    //  * @param range The range to patch into the result.
    //  * @category Subquery
    //  */
    // patch(start: number, skipCount?: number, range?: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncHierarchyQuery<TNode, T> {
    //     return super.patch(start, skipCount, range) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery that contains the provided default value if this `AsyncQuery`
    //  * contains no elements.
    //  *
    //  * @param defaultValue The default value.
    //  * @category Subquery
    //  */
    // defaultIfEmpty(defaultValue: PromiseLike<T> | T): AsyncHierarchyQuery<TNode, T> {
    //     return super.defaultIfEmpty(defaultValue) as AsyncHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates a subquery that splits this `AsyncQuery` into one or more pages.
    //  * While advancing from page to page is evaluated lazily, the elements of the page are
    //  * evaluated eagerly.
    //  *
    //  * @param pageSize The number of elements per page.
    //  * @category Subquery
    //  */
    // pageBy(pageSize: number): AsyncQuery<HierarchyPage<TNode, T>>;
    // /**
    //  * Creates a subquery that splits this `AsyncQuery` into one or more pages.
    //  * While advancing from page to page is evaluated lazily, the elements of the page are
    //  * evaluated eagerly.
    //  *
    //  * @param pageSize The number of elements per page.
    //  * @category Subquery
    //  */
    // pageBy<R>(pageSize: number, pageSelector: (page: number, offset: number, values: HierarchyQuery<TNode, T>) => R): AsyncQuery<R>;
    // pageBy<R>(pageSize: number, pageSelector?: (page: number, offset: number, values: HierarchyQuery<TNode, T>) => R): AsyncQuery<R> {
    //     return super.pageBy(pageSize, pageSelector as (page: number, offset: number, values: Query<T>) => R);
    // }

    // /**
    //  * Creates a subquery whose elements are the contiguous ranges of elements that share the same key.
    //  *
    //  * @param keySelector A callback used to select the key for an element.
    //  * @param keySelector.element An element from which to select a key.
    //  * @category Subquery
    //  */
    // spanMap<K>(keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncQuery<Grouping<K, T> & Hierarchical<TNode>>;
    // /**
    //  * Creates a subquery whose values are computed from each element of the contiguous ranges of elements that share the same key.
    //  *
    //  * @param keySelector A callback used to select the key for an element.
    //  * @param keySelector.element An element from which to select a key.
    //  * @param elementSelector A callback used to select a value for an element.
    //  * @param elementSelector.element An element from which to select a value.
    //  * @category Subquery
    //  */
    // spanMap<K, V>(keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, keyEqualer?: Equaler<K>): AsyncQuery<Grouping<K, V>>;
    // /**
    //  * Creates a subquery whose values are computed from the contiguous ranges of elements that share the same key.
    //  *
    //  * @param keySelector A callback used to select the key for an element.
    //  * @param keySelector.element An element from which to select a key.
    //  * @param elementSelector A callback used to select a value for an element.
    //  * @param elementSelector.element An element from which to select a value.
    //  * @param spanSelector A callback used to select a result from a contiguous range.
    //  * @param spanSelector.key The key for the span.
    //  * @param spanSelector.elements The elements for the span.
    //  * @category Subquery
    //  */
    // spanMap<K, V, R>(keySelector: (element: T) => K, elementSelector: (element: T) => PromiseLike<V> | V, spanSelector: (key: K, elements: Query<V>) => PromiseLike<R> | R, keyEqualer?: Equaler<K>): AsyncQuery<R>;
    // /**
    //  * Creates a subquery whose values are computed from the contiguous ranges of elements that share the same key.
    //  *
    //  * @param keySelector A callback used to select the key for an element.
    //  * @param keySelector.element An element from which to select a key.
    //  * @param elementSelector A callback used to select a value for an element.
    //  * @param elementSelector.element An element from which to select a value.
    //  * @param spanSelector A callback used to select a result from a contiguous range.
    //  * @param spanSelector.key The key for the span.
    //  * @param spanSelector.elements The elements for the span.
    //  * @category Subquery
    //  */
    // spanMap<K, R>(keySelector: (element: T) => K, elementSelector: undefined, spanSelector: (key: K, elements: HierarchyQuery<TNode, T>) => PromiseLike<R> | R, keyEqualer?: Equaler<K>): AsyncQuery<R>;
    // spanMap<K, V, R>(keySelector: (element: T) => K, elementSelector?: ((element: T) => PromiseLike<T | V> | T | V) | Equaler<K>, spanSelector?: ((key: K, elements: Query<T | V>) => PromiseLike<Grouping<K, T | V> | R> | Grouping<K, T | V> | R) | ((key: K, elements: HierarchyQuery<TNode, T>) => PromiseLike<Grouping<K, T | V> | R> | Grouping<K, T | V> | R) | Equaler<K>, keyEqualer?: Equaler<K>) {
    //     return super.spanMap(keySelector, elementSelector as (element: T) => PromiseLike<V> | V, spanSelector as (key: K, elements: Query<V>) => PromiseLike<R> | R, keyEqualer);
    // }

    // /**
    //  * Groups each element of this `AsyncQuery` by its key.
    //  *
    //  * @param keySelector A callback used to select the key for an element.
    //  * @param keySelector.element An element from which to select a key.
    //  * @param keyEqualer An `Equaler` object used to compare key equality.
    //  * @category Subquery
    //  */
    // groupBy<K>(keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncQuery<Grouping<K, T> & Hierarchical<TNode>>;
    // /**
    //  * Groups each element by its key.
    //  *
    //  * @param keySelector A callback used to select the key for an element.
    //  * @param keySelector.element An element from which to select a key.
    //  * @param elementSelector A callback used to select a value for an element.
    //  * @param elementSelector.element An element from which to select a value.
    //  * @param keyEqualer An `Equaler` object used to compare key equality.
    //  * @category Subquery
    //  */
    // groupBy<K, V>(keySelector: (element: T) => K, elementSelector: (element: T) => V, keyEqualer?: Equaler<K>): AsyncQuery<Grouping<K, V>>;
    // /**
    //  * Groups each element by its key.
    //  *
    //  * @param keySelector A callback used to select the key for an element.
    //  * @param keySelector.element An element from which to select a key.
    //  * @param elementSelector A callback used to select a value for an element.
    //  * @param elementSelector.element An element from which to select a value.
    //  * @param resultSelector A callback used to select a result from a group.
    //  * @param resultSelector.key The key for the group.
    //  * @param resultSelector.elements The elements for the group.
    //  * @param keyEqualer An `Equaler` object used to compare key equality.
    //  * @category Subquery
    //  */
    // groupBy<K, V, R>(keySelector: (element: T) => K, elementSelector: (element: T) => V, resultSelector: (key: K, elements: Query<V>) => R, keyEqualer?: Equaler<K>): AsyncQuery<R>;
    // /**
    //  * Groups each element by its key.
    //  *
    //  * @param keySelector A callback used to select the key for an element.
    //  * @param keySelector.element An element from which to select a key.
    //  * @param elementSelector A callback used to select a value for an element.
    //  * @param elementSelector.element An element from which to select a value.
    //  * @param resultSelector A callback used to select a result from a group.
    //  * @param resultSelector.key The key for the group.
    //  * @param resultSelector.elements The elements for the group.
    //  * @param keyEqualer An `Equaler` object used to compare key equality.
    //  * @category Subquery
    //  */
    // groupBy<K, R>(keySelector: (element: T) => K, elementSelector: undefined, resultSelector: (key: K, elements: HierarchyQuery<TNode, T>) => R, keyEqualer?: Equaler<K>): AsyncQuery<R>;
    // groupBy<K, V, R>(keySelector: (element: T) => K, elementSelector?: ((element: T) => V) | Equaler<K>, resultSelector?: ((key: K, elements: Query<V>) => R) | ((key: K, elements: HierarchyQuery<TNode, T>) => R) | Equaler<K>, keyEqualer?: Equaler<K>) {
    //     return super.groupBy(keySelector, elementSelector as (element: T) => V, resultSelector as (key: K, elements: Query<V>) => R, keyEqualer);
    // }

    // /**
    //  * Eagerly evaluate the `AsyncQuery`, returning a new `AsyncQuery`.
    //  * @category Subquery
    //  */
    // materialize(): AsyncHierarchyQuery<TNode, T> {
    //     return super.materialize() as AsyncHierarchyQuery<TNode, T>;
    // }

    // // #endregion Subquery

    // // #region Order

    // /**
    //  * Creates an ordered subquery whose elements are sorted in ascending order by the provided key.
    //  *
    //  * @param keySelector A callback used to select the key for an element.
    //  * @param comparer An optional callback used to compare two keys.
    //  * @category Order
    //  */
    // orderBy<K>(keySelector: (element: T) => K, comparer?: Comparison<K> | Comparer<K>): AsyncOrderedHierarchyQuery<TNode, T> {
    //     return super.orderBy(keySelector, comparer) as AsyncOrderedHierarchyQuery<TNode, T>;
    // }

    // /**
    //  * Creates an ordered subquery whose elements are sorted in descending order by the provided key.
    //  *
    //  * @param keySelector A callback used to select the key for an element.
    //  * @param comparer An optional callback used to compare two keys.
    //  * @category Order
    //  */
    // orderByDescending<K>(keySelector: (element: T) => K, comparer?: Comparison<K> | Comparer<K>): AsyncOrderedHierarchyQuery<TNode, T> {
    //     return super.orderByDescending(keySelector, comparer) as AsyncOrderedHierarchyQuery<TNode, T>;
    // }

    // // #endregion Order

    // #region Hierarchy

    /**
     * Creates a subquery for the roots of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    root<U extends TNode>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the roots of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    root(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    root(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this._fromAsync(fn.rootAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the ancestors of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    ancestors<U extends TNode>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the ancestors of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    ancestors(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    ancestors(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this._fromAsync(fn.ancestorsAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the ancestors of each element as well as each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    ancestorsAndSelf<U extends TNode>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the ancestors of each element as well as each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    ancestorsAndSelf(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    ancestorsAndSelf(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this._fromAsync(fn.ancestorsAndSelfAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the descendants of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    descendants<U extends TNode>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the descendants of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    descendants(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    descendants(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this._fromAsync(fn.descendantsAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the descendants of each element as well as each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    descendantsAndSelf<U extends TNode>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the descendants of each element as well as each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    descendantsAndSelf(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    descendantsAndSelf(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this._fromAsync(fn.descendantsAndSelfAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the parents of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    parents<U extends TNode>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the parents of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    parents(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    parents(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this._fromAsync(fn.parentsAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery for this `Asyncquery`.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    self<U extends T>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for this `Asyncquery`.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    self<U extends TNode>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for this `Asyncquery`.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    self(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    self(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this._fromAsync(fn.selfAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the siblings of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    siblings<U extends TNode>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the siblings of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    siblings(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    siblings(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this._fromAsync(fn.siblingsAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the siblings of each element as well as each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    siblingsAndSelf<U extends TNode>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the siblings of each element as well as each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    siblingsAndSelf(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    siblingsAndSelf(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this._fromAsync(fn.siblingsAndSelfAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the children of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    children<U extends TNode>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;

    /**
     * Creates a subquery for the children of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    children(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    children(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this._fromAsync(fn.childrenAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the siblings before each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    precedingSiblings<U extends TNode>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the siblings before each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    precedingSiblings(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    precedingSiblings(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this._fromAsync(fn.precedingSiblingsAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the siblings before each element in the hierarchy.
     *
     * NOTE: This is an alias for `precedingSiblings`.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    siblingsBeforeSelf<U extends TNode>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the siblings before each element in the hierarchy.
     *
     * NOTE: This is an alias for `precedingSiblings`.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    siblingsBeforeSelf(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    siblingsBeforeSelf(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this.precedingSiblings(predicate);
    }

    /**
     * Creates a subquery for the siblings after each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    followingSiblings<U extends TNode>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the siblings after each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    followingSiblings(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    followingSiblings(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this._fromAsync(fn.followingSiblingsAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the siblings after each element in the hierarchy.
     *
     * NOTE: This is an alias for `followingSiblings`.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    siblingsAfterSelf<U extends TNode>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the siblings after each element in the hierarchy.
     *
     * NOTE: This is an alias for `followingSiblings`.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    siblingsAfterSelf(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    siblingsAfterSelf(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this.followingSiblings(predicate);
    }

    /**
     * Creates a subquery for the nodes preceding each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    preceding<U extends TNode>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the nodes preceding each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    preceding(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    preceding(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this._fromAsync(fn.precedingAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the nodes following each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    following<U extends TNode>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the nodes following each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    following(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    following(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this._fromAsync(fn.followingAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the first child of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    firstChild<U extends TNode>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the first child of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    firstChild(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    firstChild(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this._fromAsync(fn.firstChildAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the last child of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    lastChild<U extends TNode>(predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the last child of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    lastChild(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    lastChild(predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this._fromAsync(fn.lastChildAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the child of each element at the specified offset. A negative offset
     * starts from the last child.
     *
     * @param offset The offset for the child.
     * @category Hierarchy
     */
    nthChild<U extends TNode>(offset: number | Index, predicate: (element: TNode) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the child of each element at the specified offset. A negative offset
     * starts from the last child.
     *
     * @param offset The offset for the child.
     * @category Hierarchy
     */
    nthChild(offset: number | Index, predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode>;
    nthChild(offset: number | Index, predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode> {
        return this._fromAsync(fn.nthChildAsync(getSource(this), offset, predicate));
    }

    /**
     * Creates a subquery for the top-most elements. Elements that are a descendant of any other
     * element are removed.
     * @category Hierarchy
     */
    topMost<U extends T>(predicate: (element: T) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the top-most elements. Elements that are a descendant of any other
     * element are removed.
     * @category Hierarchy
     */
    topMost(predicate?: (element: T) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode, T>;
    topMost(predicate?: (element: T) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode, T> {
        return this._fromAsync(fn.topMostAsync(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the bottom-most elements. Elements that are an ancestor of any other
     * element are removed.
     * @category Hierarchy
     */
    bottomMost<U extends T>(predicate: (element: T) => element is U): AsyncHierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the bottom-most elements. Elements that are an ancestor of any other
     * element are removed.
     * @category Hierarchy
     */
    bottomMost(predicate?: (element: T) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode, T>;
    bottomMost(predicate?: (element: T) => PromiseLike<boolean> | boolean): AsyncHierarchyQuery<TNode, T> {
        return this._fromAsync(fn.bottomMostAsync(getSource(this), predicate));
    }

    // #endregion Hierarchy

    [Hierarchical.hierarchy](): HierarchyProvider<TNode> {
        return getSource(this)[Hierarchical.hierarchy]();
    }
}

// Inline aliases to simplify call stacks
AsyncHierarchyQuery.prototype.siblingsBeforeSelf = AsyncHierarchyQuery.prototype.precedingSiblings;
AsyncHierarchyQuery.prototype.siblingsAfterSelf = AsyncHierarchyQuery.prototype.followingSiblings;

/**
 * Represents an ordered sequence of hierarchically organized values.
 */
export class AsyncOrderedHierarchyQuery<TNode, T extends TNode = TNode> extends AsyncHierarchyQuery<TNode, T> implements AsyncOrderedHierarchyIterable<TNode, T> {
    constructor(source: AsyncOrderedHierarchyIterable<TNode, T> | OrderedHierarchyIterable<TNode, T>);
    constructor(source: AsyncOrderedIterable<T> | OrderedIterable<T>, provider: HierarchyProvider<TNode>);
    constructor(source: AsyncOrderedHierarchyIterable<TNode, T> | AsyncOrderedIterable<T> | OrderedHierarchyIterable<TNode, T> | OrderedIterable<T>, provider?: HierarchyProvider<TNode>) {
        if (provider !== undefined) {
            if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
            super(source, provider);
        }
        else {
            if (!AsyncOrderedHierarchyIterable.hasInstance(source) && !OrderedHierarchyIterable.hasInstance(source)) throw new TypeError("AsyncOrderedHierarchyIterable expected: source");
            super(source);
        }
    }

    // #region Order

    /**
     * Creates a subsequent ordered subquery whose elements are sorted in ascending order by the provided key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param comparison An optional callback used to compare two keys.
     * @category Order
     */
    thenBy<K>(keySelector: (element: T) => K, comparison?: Comparison<K> | Comparer<K>): AsyncOrderedHierarchyQuery<TNode, T> {
        return this._fromAsync(fn.thenByAsync(getSource(this), keySelector, comparison));
    }

    /**
     * Creates a subsequent ordered subquery whose elements are sorted in descending order by the provided key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param comparison An optional callback used to compare two keys.
     * @category Order
     */
    thenByDescending<K>(keySelector: (element: T) => K, comparison?: Comparison<K> | Comparer<K>): AsyncOrderedHierarchyQuery<TNode, T> {
        return this._fromAsync(fn.thenByDescendingAsync(getSource(this), keySelector, comparison));
    }

    // #endregion Order

    [AsyncOrderedIterable.thenByAsync]<K>(keySelector: (element: T) => K, comparison: Comparison<K> | Comparer<K>, descending: boolean): AsyncOrderedHierarchyIterable<TNode, T> {
        return getSource(this)[AsyncOrderedIterable.thenByAsync](keySelector, comparison, descending);
    }
}
