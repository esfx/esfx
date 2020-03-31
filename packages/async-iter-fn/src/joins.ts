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

import * as assert from "@esfx/internal-assert";
import { Equaler } from "@esfx/equatable";
import { Grouping } from "@esfx/iter-grouping";
import { Lookup } from "@esfx/iter-lookup";
import { identity, tuple } from '@esfx/fn';
import { empty, union, map, defaultIfEmpty } from "@esfx/iter-fn";
import { createGroupingsAsync } from './internal/utils';
import { toAsyncIterable } from '@esfx/async-iter-fromsync/dist';

class AsyncGroupJoinIterable<O, I, K, R> implements AsyncIterable<R> {
    private _outer: AsyncIterable<O> | Iterable<PromiseLike<O> | O>;
    private _inner: AsyncIterable<I> | Iterable<PromiseLike<I> | I>;
    private _outerKeySelector: (element: O) => K;
    private _innerKeySelector: (element: I) => K;
    private _resultSelector: (outer: O, inner: Iterable<I>) => PromiseLike<R> | R;
    private _keyEqualer?: Equaler<K>

    constructor(outer: AsyncIterable<O> | Iterable<PromiseLike<O> | O>, inner: AsyncIterable<I> | Iterable<PromiseLike<I> | I>, outerKeySelector: (element: O) => K, innerKeySelector: (element: I) => K, resultSelector: (outer: O, inner: Iterable<I>) => PromiseLike<R> | R, keyEqualer?: Equaler<K>) {
        this._outer = outer;
        this._inner = inner;
        this._outerKeySelector = outerKeySelector;
        this._innerKeySelector = innerKeySelector;
        this._resultSelector = resultSelector;
        this._keyEqualer = keyEqualer;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<R> {
        const outerKeySelector = this._outerKeySelector;
        const resultSelector = this._resultSelector;
        const map = await createGroupingsAsync(this._inner, this._innerKeySelector, identity, this._keyEqualer);
        for await (const outerElement of this._outer) {
            const outerKey = outerKeySelector(outerElement);
            const innerElements = map.get(outerKey) || empty<I>();
            yield resultSelector(outerElement, innerElements);
        }
    }
}

/**
 * Creates a grouped [[AsyncIterable]] for the correlated elements between an outer [[AsyncQueryable]] object and an inner [[AsyncQueryable]] object.
 *
 * @param outer An [[AsyncQueryable]] object.
 * @param inner An [[AsyncQueryable]] object.
 * @param outerKeySelector A callback used to select the key for an element in `outer`.
 * @param innerKeySelector A callback used to select the key for an element in `inner`.
 * @param resultSelector A callback used to select the result for the correlated elements.
 * @param keyEqualer An [[Equaler]] object used to compare key equality.
 * @category Join
 */
export function groupJoinAsync<O, I, K, R>(outer: AsyncIterable<O> | Iterable<PromiseLike<O> | O>, inner: AsyncIterable<I> | Iterable<PromiseLike<I> | I>, outerKeySelector: (element: O) => K, innerKeySelector: (element: I) => K, resultSelector: (outer: O, inner: Iterable<I>) => PromiseLike<R> | R, keyEqualer?: Equaler<K>): AsyncIterable<R> {
    assert.mustBeAsyncOrSyncIterableObject(outer, "outer");
    assert.mustBeAsyncOrSyncIterableObject(inner, "inner");
    assert.mustBeFunction(outerKeySelector, "outerKeySelector");
    assert.mustBeFunction(innerKeySelector, "innerKeySelector");
    assert.mustBeFunction(resultSelector, "resultSelector");
    assert.mustBeTypeOrUndefined(Equaler.hasInstance, keyEqualer, "keyEqualer");
    return new AsyncGroupJoinIterable(outer, inner, outerKeySelector, innerKeySelector, resultSelector, keyEqualer);
}

class AsyncJoinIterable<O, I, K, R> implements AsyncIterable<R> {
    private _outer: AsyncIterable<O> | Iterable<PromiseLike<O> | O>;
    private _inner: AsyncIterable<I> | Iterable<PromiseLike<I> | I>;
    private _outerKeySelector: (element: O) => K;
    private _innerKeySelector: (element: I) => K;
    private _resultSelector: (outer: O, inner: I) => PromiseLike<R> | R;
    private _keyEqualer?: Equaler<K>

    constructor(outer: AsyncIterable<O> | Iterable<PromiseLike<O> | O>, inner: AsyncIterable<I> | Iterable<PromiseLike<I> | I>, outerKeySelector: (element: O) => K, innerKeySelector: (element: I) => K, resultSelector: (outer: O, inner: I) => PromiseLike<R> | R, keyEqualer?: Equaler<K>) {
        this._outer = outer;
        this._inner = inner;
        this._outerKeySelector = outerKeySelector;
        this._innerKeySelector = innerKeySelector;
        this._resultSelector = resultSelector;
        this._keyEqualer = keyEqualer;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<R> {
        const outerKeySelector = this._outerKeySelector;
        const resultSelector = this._resultSelector;
        const map = await createGroupingsAsync(this._inner, this._innerKeySelector, identity, this._keyEqualer);
        for await (const outerElement of this._outer) {
            const outerKey = outerKeySelector(outerElement);
            const innerElements = map.get(outerKey);
            if (innerElements != undefined) {
                for (const innerElement of innerElements) {
                    yield resultSelector(outerElement, innerElement);
                }
            }
        }
    }
}

/**
 * Creates an [[AsyncIterable]] for the correlated elements of two [[AsyncQueryable]] objects.
 *
 * @param outer An [[AsyncQueryable]].
 * @param inner An [[AsyncQueryable]].
 * @param outerKeySelector A callback used to select the key for an element in `outer`.
 * @param innerKeySelector A callback used to select the key for an element in `inner`.
 * @param resultSelector A callback used to select the result for the correlated elements.
 * @param keyEqualer An [[Equaler]] object used to compare key equality.
 * @category Join
 */
export function joinAsync<O, I, K, R>(outer: AsyncIterable<O> | Iterable<PromiseLike<O> | O>, inner: AsyncIterable<I> | Iterable<PromiseLike<I> | I>, outerKeySelector: (element: O) => K, innerKeySelector: (element: I) => K, resultSelector: (outer: O, inner: I) => PromiseLike<R> | R, keyEqualer?: Equaler<K>): AsyncIterable<R> {
    assert.mustBeAsyncOrSyncIterableObject(outer, "outer");
    assert.mustBeAsyncOrSyncIterableObject(inner, "inner");
    assert.mustBeFunction(outerKeySelector, "outerKeySelector");
    assert.mustBeFunction(innerKeySelector, "innerKeySelector");
    assert.mustBeFunction(resultSelector, "resultSelector");
    assert.mustBeTypeOrUndefined(Equaler.hasInstance, keyEqualer, "keyEqualer");
    return new AsyncJoinIterable(outer, inner, outerKeySelector, innerKeySelector, resultSelector, keyEqualer);
}

function selectGroupingKey<K, V>(grouping: Grouping<K, V>) {
    return grouping.key;
}

class AsyncFullJoinIterable<O, I, K, R> implements AsyncIterable<R> {
    private _outer: AsyncIterable<O> | Iterable<PromiseLike<O> | O>;
    private _inner: AsyncIterable<I> | Iterable<PromiseLike<I> | I>;
    private _outerKeySelector: (element: O) => K;
    private _innerKeySelector: (element: I) => K;
    private _resultSelector: (outer: O | undefined, inner: I | undefined) => PromiseLike<R> | R;
    private _keyEqualer?: Equaler<K>

    constructor(outer: AsyncIterable<O> | Iterable<PromiseLike<O> | O>, inner: AsyncIterable<I> | Iterable<PromiseLike<I> | I>, outerKeySelector: (element: O) => K, innerKeySelector: (element: I) => K, resultSelector: (outer: O | undefined, inner: I | undefined) => PromiseLike<R> | R, keyEqualer?: Equaler<K>) {
        this._outer = outer;
        this._inner = inner;
        this._outerKeySelector = outerKeySelector;
        this._innerKeySelector = innerKeySelector;
        this._resultSelector = resultSelector;
        this._keyEqualer = keyEqualer;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<R> {
        const resultSelector = this._resultSelector;
        const outerLookup = new Lookup<K, O>(await createGroupingsAsync(this._outer, this._outerKeySelector, identity, this._keyEqualer));
        const innerLookup = new Lookup<K, I>(await createGroupingsAsync(this._inner, this._innerKeySelector, identity, this._keyEqualer));
        const keys = union(map(outerLookup, selectGroupingKey), map(innerLookup, selectGroupingKey), this._keyEqualer);
        for (const key of keys) {
            const outer = defaultIfEmpty<O | undefined>(outerLookup.get(key), undefined);
            const inner = defaultIfEmpty<I | undefined>(innerLookup.get(key), undefined);
            for (const outerElement of outer) {
                for (const innerElement of inner) {
                    yield resultSelector(outerElement, innerElement);
                }
            }
        }
    }
}

/**
 * Creates an [[AsyncIterable]] for the correlated elements between an outer [[AsyncQueryable]] object and an inner
 * [[AsyncQueryable]] object.
 *
 * @param outer An [[AsyncQueryable]] object.
 * @param inner An [[AsyncQueryable]] object.
 * @param outerKeySelector A callback used to select the key for an element in `outer`.
 * @param innerKeySelector A callback used to select the key for an element in `inner`.
 * @param resultSelector A callback used to select the result for the correlated elements.
 * @param keyEqualer An [[Equaler]] object used to compare key equality.
 * @category Join
 */
export function fullJoinAsync<O, I, K, R>(outer: AsyncIterable<O> | Iterable<PromiseLike<O> | O>, inner: AsyncIterable<I> | Iterable<PromiseLike<I> | I>, outerKeySelector: (element: O) => K, innerKeySelector: (element: I) => K, resultSelector: (outer: O | undefined, inner: I | undefined) => PromiseLike<R> | R, keyEqualer?: Equaler<K>): AsyncIterable<R> {
    assert.mustBeAsyncOrSyncIterableObject(outer, "outer");
    assert.mustBeAsyncOrSyncIterableObject(inner, "inner");
    assert.mustBeFunction(outerKeySelector, "outerKeySelector");
    assert.mustBeFunction(innerKeySelector, "innerKeySelector");
    assert.mustBeFunction(resultSelector, "resultSelector");
    assert.mustBeTypeOrUndefined(Equaler.hasInstance, keyEqualer, "keyEqualer");
    return new AsyncFullJoinIterable(outer, inner, outerKeySelector, innerKeySelector, resultSelector, keyEqualer);
}

class AsyncZipIterable<T, U, R> implements AsyncIterable<R> {
    private _left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>;
    private _selector: (left: T, right: U) => PromiseLike<R> | R;

    constructor(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>, selector: (left: T, right: U) => PromiseLike<R> | R) {
        this._left = left;
        this._right = right;
        this._selector = selector;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<R> {
        const selector = this._selector;
        const leftIterator: AsyncIterator<T> = toAsyncIterable(this._left)[Symbol.asyncIterator]();
        let leftDone: boolean | undefined = false;
        let leftValue: T;
        try {
            const rightIterator: AsyncIterator<U> = toAsyncIterable(this._right)[Symbol.asyncIterator]();
            let rightDone: boolean | undefined = false;
            let rightValue: U;
            try {
                for (;;) {
                    ({ done: leftDone, value: leftValue } = await leftIterator.next());
                    ({ done: rightDone, value: rightValue } = await rightIterator.next());
                    if (leftDone || rightDone) break;
                    yield selector(leftValue, rightValue);
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
}

/**
 * Creates a subquery that combines two [[AsyncQueryable]] objects by combining elements
 * in tuples.
 *
 * @param left An [[AsyncQueryable]] object.
 * @param right An [[AsyncQueryable]] object.
 * @category Join
 */
export function zipAsync<T, U>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>): AsyncIterable<[T, U]>;
/**
 * Creates a subquery that combines two [[AsyncQueryable]] objects by combining elements
 * using the supplied callback.
 *
 * @param left An [[AsyncQueryable]] object.
 * @param right An [[AsyncQueryable]] object.
 * @param selector A callback used to combine two elements.
 * @category Join
 */
export function zipAsync<T, U, R>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>, selector: (left: T, right: U) => PromiseLike<R> | R): AsyncIterable<R>;
export function zipAsync<T, U, R>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<U> | Iterable<PromiseLike<U> | U>, selector: (left: T, right: U) => PromiseLike<[T, U] | R> | [T, U] | R = tuple): AsyncIterable<[T, U] | R> {
    assert.mustBeAsyncOrSyncIterableObject(left, "left");
    assert.mustBeAsyncOrSyncIterableObject(right, "right");
    assert.mustBeFunction(selector, "selector");
    return new AsyncZipIterable(left, right, selector);
}
