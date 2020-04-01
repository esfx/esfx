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

import * as assert from "@esfx/internal-assert";
import * as fn from "@esfx/iter-fn";
import { Equaler, Comparison, Comparer, EqualityComparison } from '@esfx/equatable';
import { HashSet } from '@esfx/collections-hashset';
import { HashMap } from '@esfx/collections-hashmap';
import { IndexedCollection } from '@esfx/collection-core';
import { OrderedIterable } from "@esfx/iter-ordered";
import { Page, HierarchyPage } from '@esfx/iter-page';
import { Grouping } from '@esfx/iter-grouping';
import { Lookup } from '@esfx/iter-lookup';
import { HierarchyIterable, HierarchyProvider, Hierarchical, OrderedHierarchyIterable } from '@esfx/iter-hierarchy';
import { ConsumeOptions } from "@esfx/iter-fn";
import { Index } from "@esfx/interval";
export { ConsumeOptions };

const kSource = Symbol("[[Source]]");

/**
 * Creates a `Query` from a `Iterable` source.
 */
export function from<TNode, T extends TNode>(source: OrderedHierarchyIterable<TNode, T>): OrderedHierarchyQuery<TNode, T>;
export function from<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>): HierarchyQuery<TNode, T>;
export function from<TNode, T extends TNode>(source: OrderedIterable<T>, provider: HierarchyProvider<TNode>): OrderedHierarchyQuery<TNode, T>;
export function from<TNode, T extends TNode>(source: Iterable<T>, provider: HierarchyProvider<TNode>): HierarchyQuery<TNode, T>;
export function from<T>(source: OrderedIterable<T>): OrderedQuery<T>;
export function from<T extends readonly unknown[] | []>(source: Iterable<T>): Query<T>;
export function from<T>(source: Iterable<T>): Query<T>;
export function from<TNode, T extends TNode>(source: Iterable<T>, provider?: HierarchyProvider<TNode>): Query<T> {
    return Query.from(source, provider!);
}

function getSource<TNode, T extends TNode>(source: OrderedHierarchyIterable<TNode, T>): OrderedHierarchyIterable<TNode, T>;
function getSource<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>): HierarchyIterable<TNode, T>;
function getSource<T>(source: OrderedIterable<T>): OrderedIterable<T>;
function getSource<T>(source: Iterable<T>): Iterable<T>;
function getSource<T>(source: Iterable<T>): Iterable<T> {
    if (source instanceof Query) {
        return source[kSource];
    }
    return source;
}

function wrapResultSelector<I, O, R>(query: Query<any>, selector: ((inner: I, outer: Query<O>) => R)): ((inner: I, outer: Iterable<O>) => R);
function wrapResultSelector<I, O, R>(query: Query<any>, selector: ((inner: I, outer: Query<O>) => R) | undefined): ((inner: I, outer: Iterable<O>) => R) | undefined;
function wrapResultSelector<I, O, R>(query: Query<any>, selector: ((inner: I, outer: Query<O>) => R) | undefined) {
    if (typeof selector === "function") {
        return (inner: I, outer: Iterable<O>) => selector(inner, query["_from"](outer));
    }
    return selector;
}

function wrapPageSelector<T, R>(query: Query<any>, selector: ((page: number, offset: number, values: Query<T>) => R)): (page: number, offset: number, values: Iterable<T>) => R;
function wrapPageSelector<T, R>(query: Query<any>, selector: ((page: number, offset: number, values: Query<T>) => R) | undefined): ((page: number, offset: number, values: Iterable<T>) => R) | undefined;
function wrapPageSelector<T, R>(query: Query<any>, selector: ((page: number, offset: number, values: Query<T>) => R) | undefined) {
    if (typeof selector === "function") {
        return (page: number, offset: number, values: Iterable<T>) => selector(page, offset, query["_from"](values));
    }
    return selector;
}

/**
 * A `Query` represents a series of operations that act upon an `Iterable` or ArrayLike. Evaluation of
 * these operations is deferred until the either a scalar value is requested from the `Query` or the
 * `Query` is iterated.
 */
export class Query<T> implements Iterable<T> {
    private [kSource]: Iterable<T>;

    /**
     * Creates a `Query` from a `Iterable` source.
     *
     * @param source A `Iterable` object.
     */
    constructor(source: Iterable<T>) {
        assert.mustBeIterableObject(source, "source");
        this[kSource] = getSource(source);
    }

    // #region Query

    /**
     * Creates a `Query` from a `Iterable` source.
     * @category Query
     */
    static from<TNode, T extends TNode>(source: OrderedHierarchyIterable<TNode, T>): OrderedHierarchyQuery<TNode, T>;
    static from<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>): HierarchyQuery<TNode, T>;
    static from<TNode, T extends TNode>(source: OrderedIterable<T>, provider: HierarchyProvider<TNode>): OrderedHierarchyQuery<TNode, T>;
    static from<TNode, T extends TNode>(source: Iterable<T>, provider: HierarchyProvider<TNode>): HierarchyQuery<TNode, T>;
    static from<T>(source: OrderedIterable<T>): OrderedQuery<T>;
    static from<T extends readonly unknown[] | []>(source: Iterable<T>): Query<T>;
    static from<T>(source: Iterable<T>): Query<T>;
    static from<TNode, T extends TNode>(source: Iterable<T>, provider?: HierarchyProvider<TNode>): Query<T> {
        assert.mustBeIterableObject(source, "source");
        assert.mustBeTypeOrUndefined(HierarchyProvider.hasInstance, provider, "provider");
        if (provider) source = fn.toHierarchy(source, provider);
        return source instanceof Query ? source :
            OrderedHierarchyIterable.hasInstance(source) ? new OrderedHierarchyQuery(source) :
            HierarchyIterable.hasInstance(source) ? new HierarchyQuery(source) :
            OrderedIterable.hasInstance(source) ? new OrderedQuery(source) :
            new Query(source);
    }

    /**
     * Creates a `Query` for the provided elements.
     *
     * @param elements The elements of the `Query`.
     * @category Query
     */
    static of<T>(...elements: T[]): Query<T>;
    static of<T>(): Query<T> {
        return this.from(arguments);
    }

    /**
     * Creates a `Query` with no elements.
     *
     * @category Query
     */
    static empty<T>(): Query<T> {
        return this.from(fn.empty<T>());
    }

    /**
     * Creates a `Query` over a single element.
     *
     * @param value The only element for the `Query`.
     * @category Query
     */
    static once<T>(value: T): Query<T> {
        return this.from(fn.once(value));
    }

    /**
     * Creates a `Query` for a value repeated a provided number of times.
     *
     * @param value The value for each element of the `Query`.
     * @param count The number of times to repeat the value.
     * @category Query
     */
    static repeat<T>(value: T, count: number): Query<T> {
        return this.from(fn.repeat(value, count));
    }

    /**
     * Creates a `Query` over a range of numbers.
     *
     * @param start The starting number of the range.
     * @param end The ending number of the range.
     * @param increment The amount by which to change between each itereated value.
     * @category Query
     */
    static range(start: number, end: number, increment?: number) {
        return this.from(fn.range(start, end, increment));
    }

    /**
     * Creates a `Query` that repeats the provided value forever.
     *
     * @param value The value for each element of the `Query`.
     * @category Query
     */
    static continuous<T>(value: T) {
        return this.from(fn.continuous(value));
    }

    /**
     * Creates a `Query` whose values are provided by a callback executed a provided number of
     * times.
     *
     * @param count The number of times to execute the callback.
     * @param generator The callback to execute.
     * @category Query
     */
    static generate<T>(count: number, generator: (offset: number) => T) {
        return this.from(fn.generate(count, generator));
    }

    /**
     * Creates a `Query` that, when iterated, consumes the provided `Iterator`.
     *
     * @param iterator An `Iterator` object.
     * @category Query
     */
    static consume<T>(iterator: Iterator<T>, options?: ConsumeOptions) {
        return this.from(fn.consume(iterator, options));
    }

    // /**
    //  * Creates a `Query` that iterates the elements from one of two sources based on the result of a
    //  * lazily evaluated condition.
    //  *
    //  * @param condition A callback used to choose a source.
    //  * @param thenIterable The source to use when the callback evaluates to `true`.
    //  * @param elseIterable The source to use when the callback evaluates to `false`.
    //  * @category Query
    //  */
    // static if<T>(condition: () => boolean, thenIterable: Iterable<T>, elseIterable?: Iterable<T>): Query<T> {
    //     return this.from(fn.if(condition, thenIterable, elseIterable));
    // }

    // /**
    //  * Creates a `Query` that iterates the elements from sources picked from a list based on the
    //  * result of a lazily evaluated choice.
    //  *
    //  * @param chooser A callback used to choose a source.
    //  * @param choices A list of sources
    //  * @param otherwise A default source to use when another choice could not be made.
    //  * @category Query
    //  */
    // static choose<K, V>(chooser: () => K, choices: Iterable<Choice<K, V>>, otherwise?: Iterable<V>): Query<V> {
    //     return this.from(fn.choose(chooser, choices, otherwise));
    // }

    // /**
    //  * Creates a `Query` for the own property keys of an object.
    //  *
    //  * @param source An object.
    //  * @category Query
    //  */
    // static objectKeys<T extends object>(source: T): Query<Extract<keyof T, string>> {
    //     return this.from(fn.objectKeys(source));
    // }

    // /**
    //  * Creates a `Query` for the own property values of an object.
    //  *
    //  * @param source An object.
    //  * @category Query
    //  */
    // static objectValues<T extends object>(source: T): Query<T[Extract<keyof T, string>]> {
    //     return this.from(fn.objectValues(source));
    // }

    // /**
    //  * Creates a `Query` for the own property key-value pairs of an object.
    //  *
    //  * @param source An object.
    //  * @category Query
    //  */
    // static objectEntries<T extends object>(source: T): Query<KeyValuePair<T, Extract<keyof T, string>>> {
    //     return this.from(fn.objectEntries(source));
    // }

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
    filter<U extends T>(predicate: (element: T, offset: number) => element is U): Query<U>;
    /**
     * Creates a subquery whose elements match the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to test.
     * @param predicate.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    filter(predicate: (element: T, offset: number) => boolean): Query<T>;
    filter(predicate: (element: T, offset: number) => boolean) {
        return this._from(fn.filter(getSource(this), predicate));
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
    filterBy<K>(keySelector: (element: T) => K, predicate: (key: K, offset: number) => boolean): Query<T> {
        return this._from(fn.filterBy(getSource(this), keySelector, predicate));
    }

    /**
     * Creates a subquery whose elements are neither `null` nor `undefined`.
     *
     * @category Subquery
     */
    filterDefined(): Query<NonNullable<T>> {
        return this._from(fn.filterDefined(getSource(this)));
    }

    /**
     * Creates a subquery where the selected key for each element is neither `null` nor `undefined`.
     *
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element The element from which to select a key.
     * @category Subquery
     */
    filterDefinedBy<K>(keySelector: (element: T) => K): Query<T> {
        return this._from(fn.filterDefinedBy(getSource(this), keySelector));
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
    where<U extends T>(predicate: (element: T, offset: number) => element is U): Query<U>;
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
    where(predicate: (element: T, offset: number) => boolean): Query<T>;
    where(predicate: (element: T, offset: number) => boolean) {
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
    whereBy<K>(keySelector: (element: T) => K, predicate: (key: K, offset: number) => boolean) {
        return this.filterBy(keySelector, predicate);
    }

    /**
     * Creates a subquery whose elements are neither `null` nor `undefined`.
     *
     * NOTE: This is an alias for `filterDefined`.
     *
     * @category Subquery
     */
    whereDefined() {
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
    whereDefinedBy<K>(keySelector: (element: T) => K) {
        return this.filterDefinedBy(keySelector);
    }

    /**
     * Creates a subquery whose elements do not match the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to test.
     * @param predicate.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    filterNot<U extends T>(predicate: (element: T, offset: number) => element is U): Query<U>;
    /**
     * Creates a subquery whose elements do not match the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to test.
     * @param predicate.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    filterNot(predicate: (element: T, offset: number) => boolean): Query<T>;
    filterNot(predicate: (element: T, offset: number) => boolean) {
        return this._from(fn.filterNot(getSource(this), predicate));
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
    filterNotBy<K>(keySelector: (element: T) => K, predicate: (key: K, offset: number) => boolean): Query<T> {
        return this._from(fn.filterNotBy(getSource(this), keySelector, predicate));
    }

    /**
     * Creates a subquery where the selected key for each element is either `null` or `undefined`.
     *
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element The element from which to select a key.
     * @category Subquery
     */
    filterNotDefinedBy<K>(keySelector: (element: T) => K): Query<T> {
        return this._from(fn.filterNotDefinedBy(getSource(this), keySelector));
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
    whereNot<U extends T>(predicate: (element: T, offset: number) => element is U): Query<U>;
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
    whereNot(predicate: (element: T, offset: number) => boolean): Query<T>;
    whereNot(predicate: (element: T, offset: number) => boolean) {
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
    whereNotBy<K>(keySelector: (element: T) => K, predicate: (key: K, offset: number) => boolean) {
        return this.filterNotBy(keySelector, predicate);
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
    whereNotDefinedBy<K>(keySelector: (element: T) => K) {
        return this.filterNotDefinedBy(keySelector);
    }

    /**
     * Creates a subquery by applying a callback to each element.
     *
     * @param selector A callback used to map each element.
     * @param selector.element The element to map.
     * @param selector.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    map<U>(selector: (element: T, offset: number) => U) {
        return this._from(fn.map(getSource(this), selector));
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
    select<U>(selector: (element: T, offset: number) => U) {
        return this.map(selector);
    }

    /**
     * Creates a subquery that iterates the results of applying a callback to each element.
     *
     * @param projection A callback used to map each element into a `Iterable`.
     * @param projection.element The element to map.
     * @category Subquery
     */
    flatMap<U>(projection: (element: T) => Iterable<U>): Query<U>;
    /**
     * Creates a subquery that iterates the results of applying a callback to each element.
     *
     * @param projection A callback used to map each element into a `Iterable`.
     * @param projection.element The outer element to map.
     * @param resultSelector An optional callback used to map the outer and projected inner elements.
     * @param resultSelector.element The outer element to map.
     * @param resultSelector.innerElement An inner element produced by the `projection` of the outer element.
     * @category Subquery
     */
    flatMap<U, R>(projection: (element: T) => Iterable<U>, resultSelector: (element: T, innerElement: U) => R): Query<R>;
    flatMap<U, R>(projection: (element: T) => Iterable<U>, resultSelector?: (element: T, innerElement: U) => R) {
        return this._from(fn.flatMap(getSource(this), projection, resultSelector!));
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
    selectMany<U>(projection: (element: T) => Iterable<U>): Query<U>;
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
    selectMany<U, R>(projection: (element: T) => Iterable<U>, resultSelector: (element: T, innerElement: U) => R): Query<R>;
    selectMany<U, R>(projection: (element: T) => Iterable<U>, resultSelector?: (element: T, innerElement: U) => R) {
        return this.flatMap(projection, resultSelector!);
    }

    // /**
    //  * Creates a subquery that iterates the results of recursively expanding the
    //  * elements of the source.
    //  *
    //  * @param projection A callback used to recusively expand each element.
    //  * @param projection.element The element to expand.
    //  * @category Subquery
    //  */
    // expand(projection: (element: T) => Iterable<T>): Query<T> {
    //     return this._from(fn.expand(getSource(this), projection));
    // }

    /**
     * Lazily invokes a callback as each element of the `Query` is iterated.
     *
     * @param callback The callback to invoke.
     * @param callback.element An element of the source.
     * @param callback.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    tap(callback: (element: T, offset: number) => void): Query<T> {
        return this._from(fn.tap(getSource(this), callback));
    }

    /**
     * Creates a subquery whose elements are in the reverse order.
     *
     * @category Subquery
     */
    reverse(): Query<T> {
        return this._from(fn.reverse(getSource(this)));
    }

    /**
     * Creates a subquery with every instance of the specified value removed.
     *
     * @param values The values to exclude.
     * @category Subquery
     */
    exclude(...values: [T, ...T[]]): Query<T> {
        return this._from(fn.exclude(getSource(this), ...values));
    }

    /**
     * Creates a subquery containing all elements except the first elements up to the supplied
     * count.
     *
     * @param count The number of elements to drop.
     * @category Subquery
     */
    drop(count: number): Query<T> {
        return this._from(fn.drop(getSource(this), count));
    }

    /**
     * Creates a subquery containing all elements except the last elements up to the supplied
     * count.
     *
     * @param count The number of elements to drop.
     * @category Subquery
     */
    dropRight(count: number): Query<T> {
        return this._from(fn.dropRight(getSource(this), count));
    }

    /**
     * Creates a subquery containing all elements except the first elements that match
     * the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to match.
     * @category Subquery
     */
    dropWhile(predicate: (element: T) => boolean): Query<T> {
        return this._from(fn.dropWhile(getSource(this), predicate));
    }

    /**
     * Creates a subquery containing all elements except the first elements that don't match
     * the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to match.
     * @category Subquery
     */
    dropUntil(predicate: (element: T) => boolean): Query<T> {
        return this._from(fn.dropUntil(getSource(this), predicate));
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
    skip(count: number) {
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
    skipRight(count: number) {
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
    skipWhile(predicate: (element: T) => boolean) {
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
    skipUntil(predicate: (element: T) => boolean) {
        return this.dropUntil(predicate);
    }

    /**
     * Creates a subquery containing the first elements up to the supplied
     * count.
     *
     * @param count The number of elements to take.
     * @category Subquery
     */
    take(count: number): Query<T> {
        return this._from(fn.take(getSource(this), count));
    }

    /**
     * Creates a subquery containing the last elements up to the supplied
     * count.
     *
     * @param count The number of elements to take.
     * @category Subquery
     */
    takeRight(count: number): Query<T> {
        return this._from(fn.takeRight(getSource(this), count));
    }

    /**
     * Creates a subquery containing the first elements that match the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to match.
     * @category Subquery
     */
    takeWhile<U extends T>(predicate: (element: T) => element is U): Query<U>;
    /**
     * Creates a subquery containing the first elements that match the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to match.
     */
    takeWhile(predicate: (element: T) => boolean): Query<T>;
    takeWhile(predicate: (element: T) => boolean) {
        return this._from(fn.takeWhile(getSource(this), predicate));
    }

    /**
     * Creates a subquery containing the first elements that do not match the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to match.
     * @category Subquery
     */
    takeUntil(predicate: (element: T) => boolean): Query<T> {
        return this._from(fn.takeUntil(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the set intersection of this `Query` and another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    intersect<TNode, T extends TNode>(this: Query<T>, right: HierarchyIterable<TNode, T>, equaler?: Equaler<T>): HierarchyQuery<TNode, T>;
    /**
     * Creates a subquery for the set intersection of this `Query` and another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    intersect(right: Iterable<T>, equaler?: Equaler<T>): Query<T>;
    intersect(right: Iterable<T>, equaler?: Equaler<T>): Query<T> | HierarchyQuery<T> {
        return this._from(fn.intersect(getSource(this), right, equaler));
    }

    /**
     * Creates a subquery for the set intersection of this `Query` and another `Iterable`, where set identity is determined by the selected key.
     *
     * @param right A `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    intersectBy<TNode, T extends TNode, K>(this: Query<T>, right: HierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): HierarchyQuery<TNode, T>;
    /**
     * Creates a subquery for the set intersection of this `Query` and another `Iterable`, where set identity is determined by the selected key.
     *
     * @param right A `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    intersectBy<K>(right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Query<T>;
    intersectBy<K>(right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Query<T> | HierarchyQuery<T> {
        return this._from(fn.intersectBy(getSource(this), getSource(right), keySelector, keyEqualer));
    }

    /**
     * Creates a subquery for the set union of this `Query` and another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    union<TNode, T extends TNode>(this: Query<T>, right: HierarchyIterable<TNode, T>, equaler?: Equaler<T>): HierarchyQuery<TNode, T>;
    /**
     * Creates a subquery for the set union of this `Query` and another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    union(right: Iterable<T>, equaler?: Equaler<T>): Query<T>;
    union(right: Iterable<T>, equaler?: Equaler<T>): Query<T> | HierarchyQuery<T> {
        return this._from(fn.union(getSource(this), getSource(right), equaler));
    }

    /**
     * Creates a subquery for the set union of this `Query` and another `Iterable`, where set identity is determined by the selected key.
     *
     * @param right A `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    unionBy<TNode, T extends TNode, K>(this: Query<T>, right: HierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): HierarchyQuery<TNode, T>;
    /**
     * Creates a subquery for the set union of this `Query` and another `Iterable`, where set identity is determined by the selected key.
     *
     * @param right A `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    unionBy<K>(right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Query<T>;
    unionBy<K>(right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Query<T> | HierarchyQuery<T> {
        return this._from(fn.unionBy(getSource(this), getSource(right), keySelector, keyEqualer));
    }

    /**
     * Creates a subquery for the set difference between this and another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    except(right: Iterable<T>, equaler?: Equaler<T>): Query<T> {
        return this._from(fn.except(getSource(this), getSource(right), equaler));
    }

    /**
     * Creates a subquery for the set difference between this and another `Iterable`, where set identity is determined by the selected key.
     *
     * @param right A `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    exceptBy<K>(right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Query<T> {
        return this._from(fn.exceptBy(getSource(this), getSource(right), keySelector, keyEqualer));
    }

    /**
     * Creates a subquery for the set difference between this and another `Iterable`.
     *
     * NOTE: This is an alias for `except`.
     *
     * @param right A `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    relativeComplement(right: Iterable<T>, equaler?: Equaler<T>) {
        return this.except(right, equaler);
    }

    /**
     * Creates a subquery for the set difference between this and another `Iterable`, where set identity is determined by the selected key.
     *
     * NOTE: This is an alias for `exceptBy`.
     *
     * @param right A `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    relativeComplementBy<K>(right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>) {
        return this.exceptBy(right, keySelector, keyEqualer);
    }

    /**
     * Creates a subquery for the symmetric difference between this and another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    symmetricDifference<TNode, T extends TNode>(this: Query<T>, right: HierarchyIterable<TNode, T>, equaler?: Equaler<T>): HierarchyQuery<TNode, T>;
    /**
     * Creates a subquery for the symmetric difference between this and another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    symmetricDifference(right: Iterable<T>, equaler?: Equaler<T>): Query<T>;
    symmetricDifference(right: Iterable<T>, equaler?: Equaler<T>): Query<T> | HierarchyQuery<T> {
        return this._from(fn.symmetricDifference(getSource(this), getSource(right), equaler));
    }

    /**
     * Creates a subquery for the symmetric difference between this and another `Iterable`, where set identity is determined by the selected key.
     *
     * @param right A `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    symmetricDifferenceBy<TNode, T extends TNode, K>(this: Query<T>, right: HierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): HierarchyQuery<TNode, T>;
    /**
     * Creates a subquery for the symmetric difference between this and another `Iterable`, where set identity is determined by the selected key.
     *
     * @param right A `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    symmetricDifferenceBy<K>(right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Query<T>;
    symmetricDifferenceBy<K>(right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Query<T> | HierarchyQuery<T> {
        return this._from(fn.symmetricDifferenceBy(getSource(this), getSource(right), keySelector, keyEqualer));
    }

    /**
     * Creates a subquery that concatenates this `Query` with another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @category Subquery
     */
    concat<TNode, T extends TNode>(this: Query<T>, right: HierarchyIterable<TNode, T>): HierarchyQuery<TNode, T>;
    /**
     * Creates a subquery that concatenates this `Query` with another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @category Subquery
     */
    concat(right: Iterable<T>): Query<T>;
    concat(right: Iterable<T>): Query<T> | HierarchyQuery<T> {
        return this._from(fn.concat(getSource(this), getSource(right)));
    }

    /**
     * Creates a subquery for the distinct elements of this `Query`.
     * @param equaler An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    distinct(equaler?: Equaler<T>): Query<T> {
        return this._from(fn.distinct(getSource(this), equaler));
    }

    /**
     * Creates a subquery for the distinct elements of this `Query`.
     *
     * @param keySelector A callback used to select the key to determine uniqueness.
     * @param keySelector.value An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    distinctBy<K>(keySelector: (value: T) => K, keyEqualer?: Equaler<K>): Query<T> {
        return this._from(fn.distinctBy(getSource(this), keySelector, keyEqualer));
    }

    /**
     * Creates a subquery for the elements of this `Query` with the provided value appended to the end.
     *
     * @param value The value to append.
     * @category Subquery
     */
    append(value: T): Query<T> {
        return this._from(fn.append(getSource(this), value));
    }

    /**
     * Creates a subquery for the elements of this `Query` with the provided value prepended to the beginning.
     *
     * @param value The value to prepend.
     * @category Subquery
     */
    prepend(value: T): Query<T> {
        return this._from(fn.prepend(getSource(this), value));
    }

    /**
     * Creates a subquery for the elements of this `Query` with the provided range
     * patched into the results.
     *
     * @param start The offset at which to patch the range.
     * @param skipCount The number of elements to skip from start.
     * @param range The range to patch into the result.
     * @category Subquery
     */
    patch(start: number, skipCount?: number, range?: Iterable<T>): Query<T> {
        return this._from(fn.patch(getSource(this), start, skipCount, range && getSource(range)));
    }

    /**
     * Creates a subquery that contains the provided default value if this `Query`
     * contains no elements.
     *
     * @param defaultValue The default value.
     * @category Subquery
     */
    defaultIfEmpty(defaultValue: T): Query<T> {
        return this._from(fn.defaultIfEmpty(getSource(this), defaultValue));
    }

    /**
     * Creates a subquery that splits this `Query` into one or more pages.
     * While advancing from page to page is evaluated lazily, the elements of the page are
     * evaluated eagerly.
     *
     * @param pageSize The number of elements per page.
     * @category Subquery
     */
    pageBy(pageSize: number): Query<Page<T>>;
    /**
     * Creates a subquery that splits this `Query` into one or more pages.
     * While advancing from page to page is evaluated lazily, the elements of the page are
     * evaluated eagerly.
     *
     * @param pageSize The number of elements per page.
     * @category Subquery
     */
    pageBy<R>(pageSize: number, pageSelector: (page: number, offset: number, values: Query<T>) => R): Query<R>;
    pageBy<R>(pageSize: number, pageSelector?: (page: number, offset: number, values: Query<T>) => R) {
        return this._from(fn.pageBy(getSource(this), pageSize, wrapPageSelector(this, pageSelector!)));
    }

    /**
     * Creates a subquery whose elements are the contiguous ranges of elements that share the same key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param keySelector.element An element from which to select a key.
     * @category Subquery
     */
    spanMap<K>(keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Query<Grouping<K, T>>;
    /**
     * Creates a subquery whose values are computed from each element of the contiguous ranges of elements that share the same key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param keySelector.element An element from which to select a key.
     * @param elementSelector A callback used to select a value for an element.
     * @param elementSelector.element An element from which to select a value.
     * @category Subquery
     */
    spanMap<K, V>(keySelector: (element: T) => K, elementSelector: (element: T) => V, keyEqualer?: Equaler<K>): Query<Grouping<K, V>>;
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
    spanMap<K, V, R>(keySelector: (element: T) => K, elementSelector: (element: T) => V, spanSelector: (key: K, elements: Query<V>) => R, keyEqualer?: Equaler<K>): Query<R>;
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
    spanMap<K, R>(keySelector: (element: T) => K, elementSelector: undefined, spanSelector: (key: K, elements: Query<T>) => R, keyEqualer?: Equaler<K>): Query<R>;
    spanMap<K, V, R>(keySelector: (element: T) => K, elementSelector?: ((element: T) => T | V) | Equaler<K>, spanSelector?: ((key: K, elements: Query<T | V>) => Grouping<K, T | V> | R) | Equaler<K>, keyEqualer?: Equaler<K>) {
        if (typeof elementSelector === "object") {
            keyEqualer = elementSelector;
            elementSelector = fn.identity;
        }
        if (typeof spanSelector === "object") {
            keyEqualer = spanSelector;
            spanSelector = Grouping.from;
        }
        return this._from(fn.spanMap(getSource(this), keySelector, elementSelector!, wrapResultSelector(this, spanSelector!), keyEqualer));
    }

    /**
     * Groups each element of this `Query` by its key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    groupBy<K>(keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Query<Grouping<K, T>>;
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
    groupBy<K, V>(keySelector: (element: T) => K, elementSelector: (element: T) => V, keyEqualer?: Equaler<K>): Query<Grouping<K, V>>;
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
    groupBy<K, V, R>(keySelector: (element: T) => K, elementSelector: (element: T) => V, resultSelector: (key: K, elements: Query<V>) => R, keyEqualer?: Equaler<K>): Query<R>;
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
    groupBy<K, R>(keySelector: (element: T) => K, elementSelector: undefined, resultSelector: (key: K, elements: Query<T>) => R, keyEqualer?: Equaler<K>): Query<R>;
    groupBy<K, V, R>(keySelector: (element: T) => K, elementSelector?: ((element: T) => V) | Equaler<K>, resultSelector?: ((key: K, elements: Query<V>) => R) | Equaler<K>, keyEqualer?: Equaler<K>) {
        if (typeof elementSelector === "object") {
            resultSelector = elementSelector;
            elementSelector = undefined;
        }
        if (typeof resultSelector === "object") {
            keyEqualer = resultSelector;
            resultSelector = undefined;
        }
        return this._from(fn.groupBy(getSource(this), keySelector, elementSelector!, wrapResultSelector(this, resultSelector!), keyEqualer));
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
    scan(accumulator: (current: T, element: T, offset: number) => T): Query<T>;
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
    scan<U>(accumulator: (current: U, element: T, offset: number) => U, seed: U): Query<U>;
    scan(accumulator: (current: T, element: T, offset: number) => T, seed?: T): Query<T> {
        return this._from(arguments.length > 1
            ? fn.scan(getSource(this), accumulator, seed as T)
            : fn.scan(getSource(this), accumulator));
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
    scanRight(accumulator: (current: T, element: T, offset: number) => T): Query<T>;
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
    scanRight<U>(accumulator: (current: U, element: T, offset: number) => U, seed?: U): Query<U>;
    scanRight(accumulator: (current: T, element: T, offset: number) => T, seed?: T): Query<T> {
        return this._from(arguments.length > 1
            ? fn.scanRight(getSource(this), accumulator, seed as T)
            : fn.scanRight(getSource(this), accumulator));
    }

    /**
     * Pass the entire `Query` to the provided callback, creating a new `Query` from the result.
     *
     * @param callback A callback function.
     * @param callback.source The outer `Query`.
     * @category Subquery
     */
    through<RNode, R extends RNode>(callback: (source: this) => OrderedHierarchyIterable<RNode, R>): OrderedHierarchyQuery<RNode, R>;
    /**
     * Pass the entire `Query` to the provided callback, creating a new `Query` from the result.
     *
     * @param callback A callback function.
     * @param callback.source The outer `Query`.
     * @category Subquery
     */
    through<RNode, R extends RNode>(callback: (source: this) => HierarchyIterable<RNode, R>): HierarchyQuery<RNode, R>;
    /**
     * Pass the entire `Query` to the provided callback, creating a new `Query` from the result.
     *
     * @param callback A callback function.
     * @param callback.source The outer `Query`.
     * @category Subquery
     */
    through<R>(callback: (source: this) => OrderedIterable<R>): OrderedQuery<R>;
    /**
     * Pass the entire `Query` to the provided callback, creating a new `Query` from the result.
     *
     * @param callback A callback function.
     * @param callback.source The outer `Query`.
     * @category Subquery
     */
    through<R>(callback: (source: this) => Iterable<R>): Query<R>;
    through<R>(callback: (source: this) => Iterable<R>): Query<R> | HierarchyQuery<R> {
        return this._from(this.into(callback));
    }

    /**
     * Eagerly evaluate the `Query`, returning a new `Query`.
     * @category Subquery
     */
    materialize(): Query<T> {
        return this._from(fn.materialize(getSource(this)));
    }

    // #endregion Subquery

    // #region Join

    /**
     * Creates a grouped subquery for the correlated elements of this `Query` and another `Iterable` object.
     *
     * @param inner A `Iterable` object.
     * @param outerKeySelector A callback used to select the key for an element in this `Query`.
     * @param innerKeySelector A callback used to select the key for an element in the other `Iterable` object.
     * @param resultSelector A callback used to select the result for the correlated elements.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Join
     */
    groupJoin<I, K, R>(inner: Iterable<I>, outerKeySelector: (element: T) => K, innerKeySelector: (element: I) => K, resultSelector: (outer: T, inner: Query<I>) => R, keyEqualer?: Equaler<K>): Query<R> {
        return this._from(fn.groupJoin(getSource(this), getSource(inner), outerKeySelector, innerKeySelector, wrapResultSelector(this, resultSelector), keyEqualer));
    }

    /**
     * Creates a subquery for the correlated elements of this `Query` and another `Iterable`.
     *
     * @param inner A `Iterable` object.
     * @param outerKeySelector A callback used to select the key for an element in this `Query`.
     * @param innerKeySelector A callback used to select the key for an element in the other Iterable.
     * @param resultSelector A callback used to select the result for the correlated elements.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Join
     */
    join<I, K, R>(inner: Iterable<I>, outerKeySelector: (element: T) => K, innerKeySelector: (element: I) => K, resultSelector: (outer: T, inner: I) => R, keyEqualer?: Equaler<K>): Query<R> {
        return this._from(fn.join(getSource(this), getSource(inner), outerKeySelector, innerKeySelector, resultSelector, keyEqualer));
    }

    /**
     * Creates a subquery for the correlated elements of this `Query` and another `Iterable`.
     *
     * @param inner A `Iterable` object.
     * @param outerKeySelector A callback used to select the key for an element in this `Query`.
     * @param innerKeySelector A callback used to select the key for an element in the other Iterable.
     * @param resultSelector A callback used to select the result for the correlated elements.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Join
     */
    fullJoin<I, K, R>(inner: Iterable<I>, outerKeySelector: (element: T) => K, innerKeySelector: (element: I) => K, resultSelector: (outer: T | undefined, inner: I | undefined) => R, keyEqualer?: Equaler<K>): Query<R> {
        return this._from(fn.fullJoin(getSource(this), getSource(inner), outerKeySelector, innerKeySelector, resultSelector, keyEqualer));
    }

    /**
     * Creates a subquery that combines this `Query` with another `Iterable` by combining elements
     * in tuples.
     *
     * @param right A `Iterable` object.
     * @category Join
     */
    zip<U>(right: Iterable<U>): Query<[T, U]>;
    /**
     * Creates a subquery that combines this `Query` with another `Iterable` by combining elements
     * using the supplied callback.
     *
     * @param right A `Iterable` object.
     * @param selector A callback used to combine two elements.
     * @category Join
     */
    zip<U, R>(right: Iterable<U>, selector: (left: T, right: U) => R): Query<R>;
    zip<U, R>(right: Iterable<U>, selector?: (left: T, right: U) => R): Query<R> {
        return this._from(fn.zip(getSource(this), getSource(right), selector!));
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
    orderBy<K>(keySelector: (element: T) => K, comparer?: Comparison<K> | Comparer<K>): OrderedQuery<T> {
        return this._from(fn.orderBy(getSource(this), keySelector, comparer));
    }

    /**
     * Creates an ordered subquery whose elements are sorted in descending order by the provided key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param comparer An optional callback used to compare two keys.
     * @category Order
     */
    orderByDescending<K>(keySelector: (element: T) => K, comparer?: Comparison<K> | Comparer<K>): OrderedQuery<T>;
    orderByDescending<K>(keySelector: (element: T) => K, comparer?: Comparison<K> | Comparer<K>) {
        return this._from(fn.orderByDescending(getSource(this), keySelector, comparer));
    }

    // #endregion Order

    // #region Hierarchy

    /**
     * Creates a `HierarchyQuery` using the provided `HierarchyProvider`.
     *
     * @param provider A `HierarchyProvider`.
     * @category Hierarchy
     */
    toHierarchy<TNode, T extends TNode>(this: OrderedQuery<T>, provider: HierarchyProvider<TNode>): OrderedHierarchyQuery<TNode, T>;
    /**
     * Creates a `HierarchyQuery` using the provided `HierarchyProvider`.
     *
     * @param provider A `HierarchyProvider`.
     * @category Hierarchy
     */
    toHierarchy(this: OrderedQuery<T>, provider: HierarchyProvider<T>): OrderedHierarchyQuery<T>;
    /**
     * Creates a `HierarchyQuery` using the provided `HierarchyProvider`.
     *
     * @param provider A `HierarchyProvider`.
     * @category Hierarchy
     */
    toHierarchy<TNode, T extends TNode>(this: Query<T>, provider: HierarchyProvider<TNode>): HierarchyQuery<TNode, T>;
    /**
     * Creates a `HierarchyQuery` using the provided `HierarchyProvider`.
     *
     * @param provider A `HierarchyProvider`.
     * @category Hierarchy
     */
    toHierarchy(provider: HierarchyProvider<T>): HierarchyQuery<T>;
    toHierarchy(provider: HierarchyProvider<unknown>): HierarchyQuery<unknown, T> | OrderedHierarchyQuery<unknown, T> {
        return this._from(fn.toHierarchy(getSource(this), provider));
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
    reduce(accumulator: (current: T, element: T, offset: number) => T): T;

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
    reduce<U>(accumulator: (current: U, element: T, offset: number) => U, seed: U, resultSelector?: (result: U, count: number) => U): U;

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
    reduce<U, R>(accumulator: (current: U, element: T, offset: number) => U, seed: U, resultSelector: (result: U, count: number) => R): R;
    reduce(accumulator: (current: T, element: T, offset: number) => T, seed?: T, resultSelector?: (result: T, count: number) => T): T {
        return arguments.length > 1
            ? fn.reduce(getSource(this), accumulator, seed as T, resultSelector!)
            : fn.reduce(getSource(this), accumulator);
    }

    /**
     * Computes a scalar value by applying an accumulator callback over each element in reverse.
     *
     * @param accumulator the callback used to compute the result.
     * @category Scalar
     */
    reduceRight(accumulator: (current: T, element: T, offset: number) => T): T;
    /**
     * Computes a scalar value by applying an accumulator callback over each element in reverse.
     *
     * @param accumulator the callback used to compute the result.
     * @param seed An optional seed value.
     * @category Scalar
     */
    reduceRight<U>(accumulator: (current: U, element: T, offset: number) => U, seed: U, resultSelector?: (result: U, count: number) => U): U;
    /**
     * Computes a scalar value by applying an accumulator callback over each element in reverse.
     *
     * @param accumulator the callback used to compute the result.
     * @param seed An optional seed value.
     * @param resultSelector An optional callback used to compute the final result.
     * @category Scalar
     */
    reduceRight<U, R>(accumulator: (current: U, element: T, offset: number) => U, seed: U, resultSelector: (result: U, count: number) => R): R;
    reduceRight(accumulator: (current: T, element: T, offset: number) => T, seed?: T, resultSelector?: (result: T, count: number) => T): T {
        return arguments.length > 1
            ? fn.reduceRight(getSource(this), accumulator, seed as T, resultSelector!)
            : fn.reduceRight(getSource(this), accumulator);
    }

    /**
     * Counts the number of elements in the `Query`, optionally filtering elements using the supplied
     * callback.
     *
     * @param predicate An optional callback used to match each element.
     * @category Scalar
     */
    count(predicate?: (element: T) => boolean): number {
        return fn.count(getSource(this), predicate);
    }

    /**
     * Gets the first element in the `Query`, optionally filtering elements using the supplied
     * callback.
     *
     * @param predicate An optional callback used to match each element.
     * @category Scalar
     */
    first<U extends T>(predicate: (element: T) => element is U): U | undefined;
    /**
     * Gets the first element in the `Query`, optionally filtering elements using the supplied
     * callback.
     *
     * @param predicate An optional callback used to match each element.
     * @category Scalar
     */
    first(predicate?: (element: T) => boolean): T | undefined;
    first(predicate?: (element: T) => boolean): T | undefined {
        return fn.first(getSource(this), predicate);
    }

    /**
     * Gets the last element in the `Query`, optionally filtering elements using the supplied
     * callback.
     *
     * @param predicate An optional callback used to match each element.
     * @category Scalar
     */
    last<U extends T>(predicate: (element: T) => element is U): U | undefined;
    /**
     * Gets the last element in the `Query`, optionally filtering elements using the supplied
     * callback.
     *
     * @param predicate An optional callback used to match each element.
     * @category Scalar
     */
    last(predicate?: (element: T) => boolean): T | undefined;
    last(predicate?: (element: T) => boolean): T | undefined {
        return fn.last(getSource(this), predicate);
    }

    /**
     * Gets the only element in the `Query`, or returns `undefined`.
     *
     * @param predicate An optional callback used to match each element.
     * @category Scalar
     */
    single<U extends T>(predicate: (element: T) => element is U): U | undefined;
    /**
     * Gets the only element in the `Query`, or returns undefined.
     *
     * @param predicate An optional callback used to match each element.
     * @category Scalar
     */
    single(predicate?: (element: T) => boolean): T | undefined;
    single(predicate?: (element: T) => boolean): T | undefined {
        return fn.single(getSource(this), predicate);
    }

    /**
     * Gets the minimum element in the `Query`, optionally comparing elements using the supplied
     * callback.
     *
     * @param comparer An optional callback used to compare two elements.
     * @category Scalar
     */
    min(comparer?: Comparison<T> | Comparer<T>): T | undefined {
        return fn.min(getSource(this), comparer);
    }

    /**
     * Gets the minimum element by its key in the `Query`, optionally comparing the keys of each element using the supplied callback.
     *
     * @param keySelector A callback used to choose the key to compare.
     * @param keyComparer An optional callback used to compare the keys.
     * @category Scalar
     */
    minBy<K>(keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): T | undefined {
        return fn.minBy(getSource(this), keySelector, keyComparer);
    }

    /**
     * Gets the maximum element in the `Query`, optionally comparing elements using the supplied
     * callback.
     *
     * @param comparer An optional callback used to compare two elements.
     * @category Scalar
     */
    max(comparer?: Comparison<T> | Comparer<T>): T | undefined {
        return fn.max(getSource(this), comparer);
    }

    /**
     * Gets the maximum element by its key in the `Query`, optionally comparing the keys of each element using the supplied callback.
     *
     * @param keySelector A callback used to choose the key to compare.
     * @param keyComparer An optional callback used to compare the keys.
     * @category Scalar
     */
    maxBy<K>(keySelector: (element: T) => K, keyComparer?: Comparison<K> | Comparer<K>): T | undefined {
        return fn.maxBy(getSource(this), keySelector, keyComparer);
    }

    /**
     * Computes the sum for a series of numbers.
     *
     * @category Scalar
     */
    sum(): T extends number ? number : never;
    /**
     * Computes the sum for a series of numbers.
     *
     * @category Scalar
     */
    sum(elementSelector: (element: T) => number): number;
    sum(elementSelector?: (element: T) => number): number {
        return fn.sum(getSource(this), elementSelector!);
    }

    /**
     * Computes the average for a series of numbers.
     *
     * @category Scalar
     */
    average(): T extends number ? number : never;
    /**
     * Computes the average for a series of numbers.
     *
     * @category Scalar
     */
    average(elementSelector: (element: T) => number): number;
    average(elementSelector?: (element: T) => number): number {
        return fn.average(getSource(this), elementSelector!);
    }

    /**
     * Computes a scalar value indicating whether the `Query` contains any elements,
     * optionally filtering the elements using the supplied callback.
     *
     * @param predicate An optional callback used to match each element.
     * @category Scalar
     */
    some(predicate?: (element: T) => boolean): boolean {
        return fn.some(getSource(this), predicate);
    }

    /**
     * Computes a scalar value indicating whether all elements of the `Query`
     * match the supplied callback.
     *
     * @param predicate A callback used to match each element.
     * @category Scalar
     */
    every<U extends T>(predicate: (element: T) => element is U): this is Query<U>;
    /**
     * Computes a scalar value indicating whether all elements of the `Query`
     * match the supplied callback.
     *
     * @param predicate A callback used to match each element.
     * @category Scalar
     */
    every(predicate: (element: T) => boolean): boolean;
    every(predicate: (element: T) => boolean): boolean {
        return fn.every(getSource(this), predicate);
    }

    /**
     * Computes a scalar value indicating whether every element in this `Query` corresponds to a matching element
     * in another `Iterable` at the same position.
     *
     * @param right A `Iterable` object.
     * @param equaler An optional callback used to compare the equality of two elements.
     * @category Scalar
     */
    corresponds(right: Iterable<T>, equaler?: EqualityComparison<T> | Equaler<T>): boolean;
    /**
     * Computes a scalar value indicating whether every element in this `Query` corresponds to a matching element
     * in another `Iterable` at the same position.
     *
     * @param right A `Iterable` object.
     * @param equaler An optional callback used to compare the equality of two elements.
     * @category Scalar
     */
    corresponds<U>(right: Iterable<U>, equaler: (left: T, right: U) => boolean): boolean;
    corresponds(right: Iterable<T>, equaler?: EqualityComparison<T> | Equaler<T>): boolean {
        return fn.corresponds(getSource(this), getSource(right), equaler!);
    }

    /**
     * Computes a scalar value indicating whether every element in this `Query` corresponds to a matching element
     * in another `Iterable` at the same position.
     *
     * @param right A `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keyEqualer An `Equaler` used to compare the equality of two keys.
     * @category Scalar
     */
    correspondsBy<K>(right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): boolean;
    /**
     * Computes a scalar value indicating whether the key for every element in this `Query` corresponds to a matching key
     * in `right` at the same position.
     *
     * @param right A `Iterable` object.
     * @param leftKeySelector A callback used to select the key for each element in this `Query`.
     * @param rightKeySelector A callback used to select the key for each element in `right`.
     * @param keyEqualer An optional callback used to compare the equality of two keys.
     * @category Scalar
     */
    correspondsBy<U, K>(right: Iterable<U>, leftKeySelector: (element: T) => K, rightKeySelector: (element: U) => K, keyEqualer?: EqualityComparison<K> | Equaler<K>): boolean;
    correspondsBy<U, K>(right: Iterable<U>, leftKeySelector: (element: T) => K, rightKeySelector?: ((element: U) => K) | Equaler<K>, keyEqualer?: EqualityComparison<K> | Equaler<K>): boolean {
        if (typeof rightKeySelector === "object") {
            keyEqualer = rightKeySelector;
            rightKeySelector = undefined;
        }
        return fn.correspondsBy(getSource(this), getSource(right), leftKeySelector, rightKeySelector!, keyEqualer);
    }

    /**
     * Computes a scalar value indicating whether the provided value is included in the `Query`.
     *
     * @param value A value.
     * @param equaler An optional callback used to compare the equality of two elements.
     * @category Scalar
     */
    includes(value: T, equaler?: EqualityComparison<T> | Equaler<T>): boolean;
    /**
     * Computes a scalar value indicating whether the provided value is included in the `Query`.
     *
     * @param value A value.
     * @param equaler An optional callback used to compare the equality of two elements.
     * @category Scalar
     */
    includes<U>(value: U, equaler: (left: T, right: U) => boolean): boolean;
    includes(value: T, equaler?: EqualityComparison<T> | Equaler<T>): boolean {
        return fn.includes(getSource(this), value, equaler!);
    }

    /**
     * Computes a scalar value indicating whether the elements of this `Query` include
     * an exact sequence of elements from another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @param equaler A callback used to compare the equality of two elements.
     * @category Scalar
     */
    includesSequence(right: Iterable<T>, equaler?: EqualityComparison<T> | Equaler<T>): boolean;
    /**
     * Computes a scalar value indicating whether the elements of this `Query` include
     * an exact sequence of elements from another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @param equaler A callback used to compare the equality of two elements.
     * @category Scalar
     */
    includesSequence<U>(right: Iterable<U>, equaler: (left: T, right: U) => boolean): boolean;
    includesSequence(right: Iterable<T>, equaler?: EqualityComparison<T> | Equaler<T>): boolean {
        return fn.includesSequence(getSource(this), getSource(right), equaler!);
    }

    /**
     * Computes a scalar value indicating whether the elements of this `Query` start
     * with the same sequence of elements in another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @param equaler A callback used to compare the equality of two elements.
     * @category Scalar
     */
    startsWith(right: Iterable<T>, equaler?: EqualityComparison<T> | Equaler<T>): boolean;
    /**
     * Computes a scalar value indicating whether the elements of this `Query` start
     * with the same sequence of elements in another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @param equaler A callback used to compare the equality of two elements.
     * @category Scalar
     */
    startsWith<U>(right: Iterable<U>, equaler: (left: T, right: U) => boolean): boolean;
    startsWith(right: Iterable<T>, equaler?: EqualityComparison<T> | Equaler<T>): boolean {
        return fn.startsWith(getSource(this), getSource(right), equaler!);
    }

    /**
     * Computes a scalar value indicating whether the elements of this `Query` end
     * with the same sequence of elements in another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @param equaler A callback used to compare the equality of two elements.
     * @category Scalar
     */
    endsWith(right: Iterable<T>, equaler?: EqualityComparison<T> | Equaler<T>): boolean;
    /**
     * Computes a scalar value indicating whether the elements of this `Query` end
     * with the same sequence of elements in another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @param equaler A callback used to compare the equality of two elements.
     * @category Scalar
     */
    endsWith<U>(right: Iterable<U>, equaler: (left: T, right: U) => boolean): boolean;
    endsWith(right: Iterable<T>, equaler?: EqualityComparison<T> | Equaler<T>): boolean {
        return fn.endsWith(getSource(this), getSource(right), equaler!);
    }

    /**
     * Finds the value in the `Query` at the provided offset. A negative offset starts from the
     * last element.
     *
     * @param offset An offset.
     * @category Scalar
     */
    elementAt(offset: number | Index): T | undefined {
        return fn.elementAt(getSource(this), offset);
    }

    /**
     * Finds the value in the `Query` at the provided offset. A negative offset starts from the
     * last element.
     *
     * NOTE: This is an alias for `elementAt`.
     *
     * @param offset An offset.
     * @category Scalar
     */
    nth(offset: number | Index): T | undefined {
        return fn.nth(getSource(this), offset);
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
    span<U extends T>(predicate: (element: T, offset: number) => element is U): [Query<U>, Query<T>];
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
    span(predicate: (element: T, offset: number) => boolean): [Query<T>, Query<T>];
    span(predicate: (element: T, offset: number) => boolean): [Query<T>, Query<T>] {
        const [left, right] = fn.span(getSource(this), predicate);
        return [from(left), from(right)];
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
    spanUntil(predicate: (element: T, offset: number) => boolean): [Query<T>, Query<T>] {
        const [left, right] = fn.spanUntil(getSource(this), predicate);
        return [from(left), from(right)];
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
    break(predicate: (element: T, offset: number) => boolean): [Query<T>, Query<T>] {
        return this.spanUntil(predicate);
    }

    /**
     * Invokes a callback for each element of the `Query`.
     *
     * @param callback The callback to invoke.
     * @category Scalar
     */
    forEach(callback: (element: T, offset: number) => void): void {
        fn.forEach(getSource(this), callback);
    }

    // /**
    //  * Iterates over all of the elements in the `Query`, ignoring the results.
    //  * @category Scalar
    //  */
    // drain(): void {
    //     fn.drain(getSource(this));
    // }

    /**
     * Unzips a sequence of tuples into a tuple of sequences.
     * @param source A `Iterable`
     * @category Scalar
     */
    unzip(): T extends [any, ...any[]] ? { [I in keyof T]: T[I][]; } : unknown[];
    /**
     * Unzips a sequence of tuples into a tuple of sequences.
     * @param source A `Iterable`
     * @param partSelector A callback that converts a result into a tuple.
     * @category Scalar
     */
    unzip<U extends [any, ...any[]]>(partSelector: (value: T) => U): { [I in keyof U]: U[I][]; };
    unzip<U extends [any, ...any[]]>(partSelector?: (value: T) => U): any {
        return fn.unzip(getSource(this), partSelector!);
    }

    /**
     * Creates an Array for the elements of the `Query`.
     * @category Scalar
     */
    toArray(): T[];
    /**
     * Creates an Array for the elements of the `Query`.
     *
     * @param elementSelector A callback that selects a value for each element.
     * @category Scalar
     */
    toArray<V>(elementSelector: (element: T) => V): V[];
    toArray<V>(elementSelector?: (element: T) => V): V[] {
        return fn.toArray(getSource(this), elementSelector!);
    }

    /**
     * Creates a `Set` for the elements of the `Query`.
     * @category Scalar
     */
    toSet(): Set<T>;
    /**
     * Creates a `Set` for the elements of the `Query`.
     *
     * @param elementSelector A callback that selects a value for each element.
     * @category Scalar
     */
    toSet<V>(elementSelector: (element: T) => V): Set<V>;
    toSet<V>(elementSelector?: ((element: T) => T | V) | Equaler<T>): Set<T | V> {
        return fn.toSet(getSource(this), elementSelector as (element: T) => T | V);
    }

    /**
     * Creates a `HashSet` for the elements of the `Query`.
     * 
     * @param equaler An `Equaler` object used to compare equality.
     * @category Scalar
     */
    toHashSet(equaler?: Equaler<T>): HashSet<T>;
    /**
     * Creates a `HashSet` for the elements of the `Query`.
     *
     * @param elementSelector A callback that selects a value for each element.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Scalar
     */
    toHashSet<V>(elementSelector: (element: T) => V, equaler?: Equaler<V>): HashSet<V>;
    toHashSet<V>(elementSelector?: ((element: T) => T | V) | Equaler<T>, equaler?: Equaler<T>): HashSet<T | V> {
        return fn.toHashSet(getSource(this), elementSelector as (element: T) => T | V, equaler!);
    }

    /**
     * Creates a `Map` for the elements of the `Query`.
     *
     * @param keySelector A callback used to select a key for each element.
     * @category Scalar
     */
    toMap<K>(keySelector: (element: T) => K): Map<K, T>;
    /**
     * Creates a `Map` for the elements of the `Query`.
     *
     * @param keySelector A callback used to select a key for each element.
     * @param elementSelector A callback that selects a value for each element.
     * @category Scalar
     */
    toMap<K, V>(keySelector: (element: T) => K, elementSelector: (element: T) => V): Map<K, V>;
    toMap<K>(keySelector: (element: T) => K, elementSelector?: (element: T) => T) {
        return fn.toMap(getSource(this), keySelector, elementSelector!);
    }

    /**
     * Creates a `Map` for the elements of the `Query`.
     *
     * @param keySelector A callback used to select a key for each element.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Scalar
     */
    toHashMap<K>(keySelector: (element: T) => K, keyEqualer?: Equaler<K>): HashMap<K, T>;
    /**
     * Creates a `Map` for the elements of the `Query`.
     *
     * @param keySelector A callback used to select a key for each element.
     * @param elementSelector A callback that selects a value for each element.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Scalar
     */
    toHashMap<K, V>(keySelector: (element: T) => K, elementSelector: (element: T) => V, keyEqualer?: Equaler<K>): HashMap<K, V>;
    toHashMap<K, V>(keySelector: (element: T) => K, elementSelector?: ((element: T) => T | V) | Equaler<K>, keyEqualer?: Equaler<K>) {
        return fn.toHashMap(getSource(this), keySelector, elementSelector as (element: T) => T | V, keyEqualer!);
    }

    /**
     * Creates a `Lookup` for the elements of the `Query`.
     *
     * @param keySelector A callback used to select a key for each element.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Scalar
     */
    toLookup<K>(keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Lookup<K, T>;
    /**
     * Creates a `Lookup` for the elements of the `Query`.
     *
     * @param keySelector A callback used to select a key for each element.
     * @param elementSelector A callback that selects a value for each element.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Scalar
     */
    toLookup<K, V>(keySelector: (element: T) => K, elementSelector: (element: T) => V, keyEqualer?: Equaler<K>): Lookup<K, V>;
    toLookup<K, V>(keySelector: (element: T) => K, elementSelector?: ((element: T) => V) | Equaler<K>, keyEqualer?: Equaler<K>): Lookup<K, V> {
        return fn.toLookup(getSource(this), keySelector, elementSelector as (element: T) => V, keyEqualer!);
    }

    /**
     * Creates an Object for the elements of the `Query`. Properties are added via `Object.defineProperty`.
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
    toObject<TProto extends object, K extends PropertyKey>(prototype: TProto, keySelector: (element: T) => K): TProto & Record<K, T>;
    /**
     * Creates an Object for the elements of the `Query`. Properties are added via `Object.defineProperty`.
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
    toObject<TProto extends object>(prototype: TProto, keySelector: (element: T) => PropertyKey): TProto & Record<PropertyKey, T>;
    /**
     * Creates an Object for the elements of the `Query`. Properties are added via `Object.defineProperty`.
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
    toObject<K extends PropertyKey>(prototype: object | null | undefined, keySelector: (element: T) => K): Record<K, T>;
    /**
     * Creates an Object for the elements of the `Query`. Properties are added via `Object.defineProperty`.
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
    toObject(prototype: object | null | undefined, keySelector: (element: T) => PropertyKey): Record<PropertyKey, T>;
    /**
     * Creates an Object for the elements the `Query`. Properties are added via `Object.defineProperty`.
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
    toObject<TProto extends object, K extends PropertyKey, V>(prototype: TProto, keySelector: (element: T) => K, elementSelector: (element: T) => V, descriptorSelector?: (key: K, element: V) => TypedPropertyDescriptor<V>): TProto & Record<K, V>;
    /**
     * Creates an Object for the elements the `Query`. Properties are added via `Object.defineProperty`.
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
    toObject<TProto extends object, V>(prototype: TProto, keySelector: (element: T) => PropertyKey, elementSelector: (element: T) => V, descriptorSelector?: (key: PropertyKey, element: V) => TypedPropertyDescriptor<V>): TProto & Record<PropertyKey, V>;
    /**
     * Creates an Object for the elements the `Query`. Properties are added via `Object.defineProperty`.
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
    toObject<K extends PropertyKey, V>(prototype: object | null | undefined, keySelector: (element: T) => K, elementSelector: (element: T) => V, descriptorSelector?: (key: K, element: V) => TypedPropertyDescriptor<V>): Record<K, V>;
    /**
     * Creates an Object for the elements the `Query`. Properties are added via `Object.defineProperty`.
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
    toObject<V>(prototype: object | null | undefined, keySelector: (element: T) => PropertyKey, elementSelector: (element: T) => V, descriptorSelector?: (key: PropertyKey, element: V) => TypedPropertyDescriptor<V>): Record<PropertyKey, V>;
    /**
     * Creates an Object for the elements the `Query`. Properties are added via `Object.defineProperty`.
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
    toObject<V>(prototype: object | null | undefined, keySelector: (element: T) => PropertyKey, elementSelector: (element: T) => V, descriptorSelector?: (key: PropertyKey, element: V) => PropertyDescriptor): object;
    toObject<V>(prototype: object | null | undefined, keySelector: (element: T) => PropertyKey, elementSelector?: (element: T) => V, descriptorSelector?: (key: PropertyKey, element: V) => PropertyDescriptor): object {
        return fn.toObject(getSource(this), prototype, keySelector, elementSelector!, descriptorSelector);
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
    copyTo(dest: T[], start?: number, count?: number): T[];
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
    copyTo<U extends IndexedCollection<T>>(dest: U, start?: number, count?: number): U;
    copyTo<U extends IndexedCollection<T> | T[]>(dest: U, start?: number, count?: number): U {
        return fn.copyTo(getSource(this), dest, start, count);
    }

    /**
     * Pass the entire `Query` to the provided callback, returning the result.
     *
     * @param callback A callback function.
     * @param callback.source The outer `Query`.
     * @category Scalar
     */
    into<R>(callback: (source: this) => R) {
        return fn.into(this, callback);
    }

    toJSON() {
        return this.toArray();
    }

    // #endregion Scalar

    [Symbol.iterator](): Iterator<T> {
        return this[kSource][Symbol.iterator]();
    }

    protected _from<TNode, T extends TNode>(source: OrderedHierarchyIterable<TNode, T>): OrderedHierarchyQuery<TNode, T>;
    protected _from<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>): HierarchyQuery<TNode, T>;
    protected _from<TNode, T extends TNode>(source: OrderedIterable<T>, provider: HierarchyProvider<TNode>): OrderedHierarchyQuery<TNode, T>;
    protected _from<TNode, T extends TNode>(source: Iterable<T>, provider: HierarchyProvider<TNode>): HierarchyQuery<TNode, T>;
    protected _from<T>(source: OrderedIterable<T>): OrderedQuery<T>;
    protected _from<T extends readonly unknown[] | []>(source: Iterable<T>): Query<T>;
    protected _from<T>(source: Iterable<T>): Query<T>;
    protected _from<TNode, T extends TNode>(source: Iterable<T>, provider?: HierarchyProvider<TNode>): Query<T> {
        return (this.constructor as typeof Query).from(source, provider!);
    }
}

/**
 * Represents an ordered sequence of elements.
 */
export class OrderedQuery<T> extends Query<T> implements OrderedIterable<T> {
    constructor(source: OrderedIterable<T>) {
        assert.mustBeType(OrderedIterable.hasInstance, source, "source");
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
    thenBy<K>(keySelector: (element: T) => K, comparer?: Comparison<K> | Comparer<K>): OrderedQuery<T> {
        return this._from(fn.thenBy(getSource(this), keySelector, comparer));
    }

    /**
     * Creates a subsequent ordered subquery whose elements are sorted in descending order by the provided key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param comparer An optional callback used to compare two keys.
     * @category Order
     */
    thenByDescending<K>(keySelector: (element: T) => K, comparer?: Comparison<K> | Comparer<K>): OrderedQuery<T> {
        return this._from(fn.thenByDescending(getSource(this), keySelector, comparer));
    }

    // #endregion Order

    [OrderedIterable.thenBy]<K>(keySelector: (element: T) => K, comparer: Comparison<K> | Comparer<K>, descending: boolean): OrderedIterable<T> {
        return getSource(this)[OrderedIterable.thenBy](keySelector, comparer, descending);
    }
}

/**
 * Represents a sequence of hierarchically organized values.
 */
export class HierarchyQuery<TNode, T extends TNode = TNode> extends Query<T> implements HierarchyIterable<TNode, T> {
    constructor(source: HierarchyIterable<TNode, T>);
    constructor(source: Iterable<T>, provider: HierarchyProvider<TNode>);
    constructor(source: Iterable<T> | HierarchyIterable<TNode, T>, provider?: HierarchyProvider<TNode>) {
        if (provider !== undefined) {
            assert.mustBeIterableObject(source, "source");
            assert.mustBeType(HierarchyProvider.hasInstance, provider, "provider");
            source = fn.toHierarchy(source, provider);
        }
        else {
            assert.mustBeType(HierarchyIterable.hasInstance, source, "source");
        }
        super(source);
    }

    // #region Subquery

    /**
     * Creates a subquery whose elements match the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to test.
     * @param predicate.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    filter<U extends T>(predicate: (element: T, offset: number) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery whose elements match the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to test.
     * @param predicate.offset The offset from the start of the source iterable.
     * @category Subquery
     */
    filter(predicate: (element: T, offset: number) => boolean): HierarchyQuery<TNode, T>;
    filter(predicate: (element: T, offset: number) => boolean) {
        return super.filter(predicate) as HierarchyQuery<TNode, T>;
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
    filterBy<K>(keySelector: (element: T) => K, predicate: (key: K, offset: number) => boolean): HierarchyQuery<TNode, T> {
        return super.filterBy(keySelector, predicate) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery whose elements are neither `null` nor `undefined`.
     *
     * @category Subquery
     */
    filterDefined(): HierarchyQuery<TNode, NonNullable<T>> {
        return super.filterDefined() as HierarchyQuery<TNode, NonNullable<T>>;
    }

    /**
     * Creates a subquery where the selected key for each element is neither `null` nor `undefined`.
     *
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element The element from which to select a key.
     * @category Subquery
     */
    filterDefinedBy<K>(keySelector: (element: T) => K): HierarchyQuery<TNode, T> {
        return super.filterDefinedBy(keySelector) as HierarchyQuery<TNode, T>;
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
    where<U extends T>(predicate: (element: T, offset: number) => element is U): HierarchyQuery<TNode, U>;
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
    where(predicate: (element: T, offset: number) => boolean): HierarchyQuery<TNode, T>;
    where(predicate: (element: T, offset: number) => boolean) {
        return this.filter(predicate) as HierarchyQuery<TNode, T>;
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
    whereBy<K>(keySelector: (element: T) => K, predicate: (key: K, offset: number) => boolean) {
        return this.filterBy(keySelector, predicate);
    }

    /**
     * Creates a subquery whose elements are neither `null` nor `undefined`.
     *
     * NOTE: This is an alias for `filterDefined`.
     *
     * @category Subquery
     */
    whereDefined() {
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
    whereDefinedBy<K>(keySelector: (element: T) => K) {
        return this.filterDefinedBy(keySelector);
    }

    /**
     * Creates a subquery whose elements are in the reverse order.
     *
     * @category Subquery
     */
    reverse(): HierarchyQuery<TNode, T> {
        return super.reverse() as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery with every instance of the specified value removed.
     *
     * @param values The values to exclude.
     * @category Subquery
     */
    exclude(...values: [T, ...T[]]): HierarchyQuery<TNode, T> {
        return super.exclude(...values) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery containing all elements except the first elements up to the supplied
     * count.
     *
     * @param count The number of elements to drop.
     * @category Subquery
     */
    drop(count: number): HierarchyQuery<TNode, T> {
        return super.drop(count) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery containing all elements except the last elements up to the supplied
     * count.
     *
     * @param count The number of elements to drop.
     * @category Subquery
     */
    dropRight(count: number): HierarchyQuery<TNode, T> {
        return super.dropRight(count) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery containing all elements except the first elements that match
     * the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to match.
     * @category Subquery
     */
    dropWhile(predicate: (element: T) => boolean): HierarchyQuery<TNode, T> {
        return super.dropWhile(predicate) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery containing all elements except the first elements that don't match
     * the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to match.
     * @category Subquery
     */
    dropUntil(predicate: (element: T) => boolean): HierarchyQuery<TNode, T> {
        return super.dropUntil(predicate) as HierarchyQuery<TNode, T>;
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
    skip(count: number) {
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
    skipRight(count: number) {
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
    skipWhile(predicate: (element: T) => boolean) {
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
    skipUntil(predicate: (element: T) => boolean) {
        return this.dropUntil(predicate);
    }

    /**
     * Creates a subquery containing the first elements up to the supplied
     * count.
     *
     * @param count The number of elements to take.
     * @category Subquery
     */
    take(count: number): HierarchyQuery<TNode, T> {
        return super.take(count) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery containing the last elements up to the supplied
     * count.
     *
     * @param count The number of elements to take.
     * @category Subquery
     */
    takeRight(count: number): HierarchyQuery<TNode, T> {
        return super.takeRight(count) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery containing the first elements that match the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to match.
     * @category Subquery
     */
    takeWhile<U extends T>(predicate: (element: T) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery containing the first elements that match the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to match.
     */
    takeWhile(predicate: (element: T) => boolean): HierarchyQuery<TNode, T>;
    takeWhile(predicate: (element: T) => boolean): HierarchyQuery<TNode, T> {
        return super.takeWhile(predicate) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery containing the first elements that do not match the supplied predicate.
     *
     * @param predicate A callback used to match each element.
     * @param predicate.element The element to match.
     * @category Subquery
     */
    takeUntil(predicate: (element: T) => boolean): HierarchyQuery<TNode, T> {
        return super.takeUntil(predicate) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery for the set intersection of this `Query` and another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    intersect(right: Iterable<T>, equaler?: Equaler<T>): HierarchyQuery<TNode, T> {
        return super.intersect(right, equaler) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery for the set intersection of this `Query` and another `Iterable`, where set identity is determined by the selected key.
     *
     * @param right A `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    intersectBy<K>(right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): HierarchyQuery<TNode, T> {
        return super.intersectBy(right, keySelector, keyEqualer) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery for the set union of this `Query` and another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    union(right: Iterable<T>, equaler?: Equaler<T>): HierarchyQuery<TNode, T> {
        return super.union(right, equaler) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery for the set union of this `Query` and another `Iterable`, where set identity is determined by the selected key.
     *
     * @param right A `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    unionBy<K>(right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): HierarchyQuery<TNode, T> {
        return super.unionBy(right, keySelector, keyEqualer) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery for the set difference between this and another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    except(right: Iterable<T>, equaler?: Equaler<T>): HierarchyQuery<TNode, T> {
        return super.except(right, equaler) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery for the set difference between this and another `Iterable`, where set identity is determined by the selected key.
     *
     * @param right A `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    exceptBy<K>(right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): HierarchyQuery<TNode, T> {
        return super.exceptBy(right, keySelector, keyEqualer) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery for the set difference between this and another `Iterable`.
     *
     * NOTE: This is an alias for `except`.
     *
     * @param right A `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    relativeComplement(right: Iterable<T>, equaler?: Equaler<T>) {
        return this.except(right, equaler);
    }

    /**
     * Creates a subquery for the set difference between this and another `Iterable`, where set identity is determined by the selected key.
     *
     * NOTE: This is an alias for `exceptBy`.
     *
     * @param right A `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    relativeComplementBy<K>(right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>) {
        return this.exceptBy(right, keySelector, keyEqualer);
    }

    /**
     * Creates a subquery for the symmetric difference between this and another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    symmetricDifference(right: Iterable<T>, equaler?: Equaler<T>): HierarchyQuery<TNode, T> {
        return super.symmetricDifference(right, equaler) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery for the symmetric difference between this and another `Iterable`, where set identity is determined by the selected key.
     *
     * @param right A `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    symmetricDifferenceBy<K>(right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): HierarchyQuery<TNode, T> {
        return super.symmetricDifferenceBy(right, keySelector, keyEqualer) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery for the symmetric difference between this and another `Iterable`.
     *
     * NOTE: This is an alias for `symmetricDifference`.
     *
     * @param right A `Iterable` object.
     * @param equaler An `Equaler` object used to compare equality.
     * @category Subquery
     */
    xor(right: Iterable<T>, equaler?: Equaler<T>) {
        return this.symmetricDifference(right, equaler);
    }

    /**
     * Creates a subquery for the symmetric difference between this and another `Iterable`, where set identity is determined by the selected key.
     *
     * NOTE: This is an alias for `symmetricDifferenceBy`.
     *
     * @param right A `Iterable` object.
     * @param keySelector A callback used to select the key for each element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    xorBy<K>(right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>) {
        return this.symmetricDifferenceBy(right, keySelector, keyEqualer);
    }

    /**
     * Creates a subquery that concatenates this `Query` with another `Iterable`.
     *
     * @param right A `Iterable` object.
     * @category Subquery
     */
    concat(right: Iterable<T>): HierarchyQuery<TNode, T> {
        return super.concat(right) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery for the distinct elements of this `Query`.
     * @param equaler An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    distinct(equaler?: Equaler<T>): HierarchyQuery<TNode, T> {
        return super.distinct(equaler) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery for the distinct elements of this `Query`.
     *
     * @param keySelector A callback used to select the key to determine uniqueness.
     * @param keySelector.value An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    distinctBy<K>(keySelector: (value: T) => K, keyEqualer?: Equaler<K>): HierarchyQuery<TNode, T> {
        return super.distinctBy(keySelector, keyEqualer) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery for the elements of this `Query` with the provided value appended to the end.
     *
     * @param value The value to append.
     * @category Subquery
     */
    append(value: T): HierarchyQuery<TNode, T> {
        return super.append(value) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery for the elements of this `Query` with the provided value prepended to the beginning.
     *
     * @param value The value to prepend.
     * @category Subquery
     */
    prepend(value: T): HierarchyQuery<TNode, T> {
        return super.prepend(value) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery for the elements of this `Query` with the provided range
     * patched into the results.
     *
     * @param start The offset at which to patch the range.
     * @param skipCount The number of elements to skip from start.
     * @param range The range to patch into the result.
     * @category Subquery
     */
    patch(start: number, skipCount?: number, range?: Iterable<T>): HierarchyQuery<TNode, T> {
        return super.patch(start, skipCount, range) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery that contains the provided default value if this `Query`
     * contains no elements.
     *
     * @param defaultValue The default value.
     * @category Subquery
     */
    defaultIfEmpty(defaultValue: T): HierarchyQuery<TNode, T> {
        return super.defaultIfEmpty(defaultValue) as HierarchyQuery<TNode, T>;
    }

    /**
     * Creates a subquery that splits this `Query` into one or more pages.
     * While advancing from page to page is evaluated lazily, the elements of the page are
     * evaluated eagerly.
     *
     * @param pageSize The number of elements per page.
     * @category Subquery
     */
    pageBy(pageSize: number): Query<HierarchyPage<TNode, T>>;
    /**
     * Creates a subquery that splits this `Query` into one or more pages.
     * While advancing from page to page is evaluated lazily, the elements of the page are
     * evaluated eagerly.
     *
     * @param pageSize The number of elements per page.
     * @category Subquery
     */
    pageBy<R>(pageSize: number, pageSelector: (page: number, offset: number, values: HierarchyQuery<TNode, T>) => R): Query<R>;
    pageBy<R>(pageSize: number, pageSelector?: (page: number, offset: number, values: HierarchyQuery<TNode, T>) => R): Query<R> {
        return super.pageBy(pageSize, pageSelector as (page: number, offset: number, values: Query<T>) => R);
    }

    /**
     * Creates a subquery whose elements are the contiguous ranges of elements that share the same key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param keySelector.element An element from which to select a key.
     * @category Subquery
     */
    spanMap<K>(keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Query<Grouping<K, T> & Hierarchical<TNode>>;
    /**
     * Creates a subquery whose values are computed from each element of the contiguous ranges of elements that share the same key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param keySelector.element An element from which to select a key.
     * @param elementSelector A callback used to select a value for an element.
     * @param elementSelector.element An element from which to select a value.
     * @category Subquery
     */
    spanMap<K, V>(keySelector: (element: T) => K, elementSelector: (element: T) => V, keyEqualer?: Equaler<K>): Query<Grouping<K, V>>;
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
    spanMap<K, V, R>(keySelector: (element: T) => K, elementSelector: (element: T) => V, spanSelector: (key: K, elements: Query<V>) => R, keyEqualer?: Equaler<K>): Query<R>;
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
    spanMap<K, R>(keySelector: (element: T) => K, elementSelector: undefined, spanSelector: (key: K, elements: HierarchyQuery<TNode, T>) => R, keyEqualer?: Equaler<K>): Query<R>;
    spanMap<K, V, R>(keySelector: (element: T) => K, elementSelector?: ((element: T) => T | V) | Equaler<K>, spanSelector?: ((key: K, elements: Query<T | V>) => Grouping<K, T | V> | R) | ((key: K, elements: HierarchyQuery<TNode, T>) => Grouping<K, T | V> | R) | Equaler<K>, keyEqualer?: Equaler<K>) {
        return super.spanMap(keySelector, elementSelector as (element: T) => V, spanSelector as (key: K, elements: Query<V>) => R, keyEqualer);
    }

    /**
     * Groups each element of this `Query` by its key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param keySelector.element An element from which to select a key.
     * @param keyEqualer An `Equaler` object used to compare key equality.
     * @category Subquery
     */
    groupBy<K>(keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Query<Grouping<K, T> & Hierarchical<TNode>>;
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
    groupBy<K, V>(keySelector: (element: T) => K, elementSelector: (element: T) => V, keyEqualer?: Equaler<K>): Query<Grouping<K, V>>;
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
    groupBy<K, V, R>(keySelector: (element: T) => K, elementSelector: (element: T) => V, resultSelector: (key: K, elements: Query<V>) => R, keyEqualer?: Equaler<K>): Query<R>;
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
    groupBy<K, R>(keySelector: (element: T) => K, elementSelector: undefined, resultSelector: (key: K, elements: HierarchyQuery<TNode, T>) => R, keyEqualer?: Equaler<K>): Query<R>;
    groupBy<K, V, R>(keySelector: (element: T) => K, elementSelector?: ((element: T) => V) | Equaler<K>, resultSelector?: ((key: K, elements: Query<V>) => R) | ((key: K, elements: HierarchyQuery<TNode, T>) => R) | Equaler<K>, keyEqualer?: Equaler<K>) {
        return super.groupBy(keySelector, elementSelector as (element: T) => V, resultSelector as (key: K, elements: Query<V>) => R, keyEqualer);
    }
    
    /**
     * Eagerly evaluate the `Query`, returning a new `Query`.
     * @category Subquery
     */
    materialize(): HierarchyQuery<TNode, T> {
        return super.materialize() as HierarchyQuery<TNode, T>;
    }

    // #endregion Subquery

    // #region Order

    /**
     * Creates an ordered subquery whose elements are sorted in ascending order by the provided key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param comparer An optional callback used to compare two keys.
     * @category Order
     */
    orderBy<K>(keySelector: (element: T) => K, comparer?: Comparison<K> | Comparer<K>): OrderedHierarchyQuery<TNode, T> {
        return super.orderBy(keySelector, comparer) as OrderedHierarchyQuery<TNode, T>;
    }

    /**
     * Creates an ordered subquery whose elements are sorted in descending order by the provided key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param comparer An optional callback used to compare two keys.
     * @category Order
     */
    orderByDescending<K>(keySelector: (element: T) => K, comparer?: Comparison<K> | Comparer<K>): OrderedHierarchyQuery<TNode, T> {
        return super.orderByDescending(keySelector, comparer) as OrderedHierarchyQuery<TNode, T>;
    }

    // #endregion Order
    
    // #region Hierarchy

    /**
     * Creates a subquery for the roots of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    root<U extends TNode>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the roots of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    root(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    root(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this._from(fn.root(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the ancestors of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    ancestors<U extends TNode>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the ancestors of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    ancestors(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    ancestors(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this._from(fn.ancestors(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the ancestors of each element as well as each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    ancestorsAndSelf<U extends TNode>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the ancestors of each element as well as each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    ancestorsAndSelf(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    ancestorsAndSelf(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this._from(fn.ancestorsAndSelf(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the descendants of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    descendants<U extends TNode>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the descendants of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    descendants(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    descendants(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this._from(fn.descendants(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the descendants of each element as well as each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    descendantsAndSelf<U extends TNode>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the descendants of each element as well as each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    descendantsAndSelf(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    descendantsAndSelf(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this._from(fn.descendantsAndSelf(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the parents of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    parents<U extends TNode>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the parents of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    parents(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    parents(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this._from(fn.parents(getSource(this), predicate));
    }

    /**
     * Creates a subquery for this `query`.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    self<U extends T>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for this `query`.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    self<U extends TNode>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for this `query`.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    self(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    self(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this._from(fn.self(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the siblings of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    siblings<U extends TNode>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the siblings of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    siblings(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    siblings(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this._from(fn.siblings(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the siblings of each element as well as each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    siblingsAndSelf<U extends TNode>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the siblings of each element as well as each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    siblingsAndSelf(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    siblingsAndSelf(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this._from(fn.siblingsAndSelf(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the children of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    children<U extends TNode>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;

    /**
     * Creates a subquery for the children of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    children(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    children(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this._from(fn.children(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the siblings before each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    precedingSiblings<U extends TNode>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the siblings before each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    precedingSiblings(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    precedingSiblings(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this._from(fn.precedingSiblings(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the siblings before each element in the hierarchy.
     *
     * NOTE: This is an alias for `precedingSiblings`.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    siblingsBeforeSelf<U extends TNode>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the siblings before each element in the hierarchy.
     *
     * NOTE: This is an alias for `precedingSiblings`.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    siblingsBeforeSelf(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    siblingsBeforeSelf(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this.precedingSiblings(predicate);
    }

    /**
     * Creates a subquery for the siblings after each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    followingSiblings<U extends TNode>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the siblings after each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    followingSiblings(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    followingSiblings(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this._from(fn.followingSiblings(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the siblings after each element in the hierarchy.
     *
     * NOTE: This is an alias for `followingSiblings`.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    siblingsAfterSelf<U extends TNode>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the siblings after each element in the hierarchy.
     *
     * NOTE: This is an alias for `followingSiblings`.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    siblingsAfterSelf(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    siblingsAfterSelf(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this.followingSiblings(predicate);
    }

    /**
     * Creates a subquery for the nodes preceding each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    preceding<U extends TNode>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the nodes preceding each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    preceding(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    preceding(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this._from(fn.preceding(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the nodes following each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    following<U extends TNode>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the nodes following each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    following(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    following(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this._from(fn.following(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the first child of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    firstChild<U extends TNode>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the first child of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    firstChild(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    firstChild(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this._from(fn.firstChild(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the last child of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    lastChild<U extends TNode>(predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the last child of each element in the hierarchy.
     *
     * @param predicate A callback used to filter the results.
     * @category Hierarchy
     */
    lastChild(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    lastChild(predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this._from(fn.lastChild(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the child of each element at the specified offset. A negative offset
     * starts from the last child.
     *
     * @param offset The offset for the child.
     * @category Hierarchy
     */
    nthChild<U extends TNode>(offset: number, predicate: (element: TNode) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the child of each element at the specified offset. A negative offset
     * starts from the last child.
     *
     * @param offset The offset for the child.
     * @category Hierarchy
     */
    nthChild(offset: number, predicate?: (element: TNode) => boolean): HierarchyQuery<TNode>;
    nthChild(offset: number, predicate?: (element: TNode) => boolean): HierarchyQuery<TNode> {
        return this._from(fn.nthChild(getSource(this), offset, predicate));
    }

    /**
     * Creates a subquery for the top-most elements. Elements that are a descendant of any other
     * element are removed.
     * @category Hierarchy
     */
    topMost<U extends T>(predicate: (element: T) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the top-most elements. Elements that are a descendant of any other
     * element are removed.
     * @category Hierarchy
     */
    topMost(predicate?: (element: T) => boolean): HierarchyQuery<TNode, T>;
    topMost(predicate?: (element: T) => boolean): HierarchyQuery<TNode, T> {
        return this._from(fn.topMost(getSource(this), predicate));
    }

    /**
     * Creates a subquery for the bottom-most elements. Elements that are an ancestor of any other
     * element are removed.
     * @category Hierarchy
     */
    bottomMost<U extends T>(predicate: (element: T) => element is U): HierarchyQuery<TNode, U>;
    /**
     * Creates a subquery for the bottom-most elements. Elements that are an ancestor of any other
     * element are removed.
     * @category Hierarchy
     */
    bottomMost(predicate?: (element: T) => boolean): HierarchyQuery<TNode, T>;
    bottomMost(predicate?: (element: T) => boolean): HierarchyQuery<TNode, T> {
        return this._from(fn.bottomMost(getSource(this), predicate));
    }

    // #endregion Hierarchy

    [Hierarchical.hierarchy](): HierarchyProvider<TNode> {
        return getSource(this)[Hierarchical.hierarchy]();
    }
}

/**
 * Represents an ordered sequence of hierarchically organized values.
 */
export class OrderedHierarchyQuery<TNode, T extends TNode = TNode> extends HierarchyQuery<TNode, T> implements OrderedHierarchyIterable<TNode, T> {
    constructor(source: OrderedHierarchyIterable<TNode, T>);
    constructor(source: OrderedIterable<T>, provider: HierarchyProvider<TNode>);
    constructor(source: OrderedIterable<T> | OrderedHierarchyIterable<TNode, T>, provider?: HierarchyProvider<TNode>) {
        if (provider !== undefined) {
            assert.mustBeType(OrderedIterable.hasInstance, source, "source");
            super(source, provider);
        }
        else {
            assert.mustBeType(OrderedHierarchyIterable.hasInstance, source, "source");
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
    thenBy<K>(keySelector: (element: T) => K, comparison?: Comparison<K> | Comparer<K>): OrderedHierarchyQuery<TNode, T> {
        return this._from(fn.thenBy(getSource(this), keySelector, comparison));
    }

    /**
     * Creates a subsequent ordered subquery whose elements are sorted in descending order by the provided key.
     *
     * @param keySelector A callback used to select the key for an element.
     * @param comparison An optional callback used to compare two keys.
     * @category Order
     */
    thenByDescending<K>(keySelector: (element: T) => K, comparison?: Comparison<K> | Comparer<K>): OrderedHierarchyQuery<TNode, T> {
        return this._from(fn.thenByDescending(getSource(this), keySelector, comparison));
    }

    // #endregion Order

    [OrderedIterable.thenBy]<K>(keySelector: (element: T) => K, comparison: Comparison<K> | Comparer<K>, descending: boolean): OrderedHierarchyIterable<TNode, T> {
        return getSource(this)[OrderedIterable.thenBy](keySelector, comparison, descending);
    }
}
