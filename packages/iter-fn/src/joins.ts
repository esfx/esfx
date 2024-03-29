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

import /*#__INLINE__*/ { isFunction, isIterableObject, isUndefined } from "@esfx/internal-guards";
import { Equaler } from "@esfx/equatable";
import { Grouping } from "@esfx/iter-grouping";
import { Lookup } from "@esfx/iter-lookup";
import { identity, tuple } from '@esfx/fn';
import { empty } from './queries.js';
import { union, map, defaultIfEmpty } from './subqueries.js';
import { createGroupings } from './internal/utils.js';

class GroupJoinIterable<O, I, K, R> implements Iterable<R> {
    private _outer: Iterable<O>;
    private _inner: Iterable<I>;
    private _outerKeySelector: (element: O) => K;
    private _innerKeySelector: (element: I) => K;
    private _keyEqualer: Equaler<K>;
    private _resultSelector: (outer: O, inner: Iterable<I>) => R;

    constructor(outer: Iterable<O>, inner: Iterable<I>, outerKeySelector: (element: O) => K, innerKeySelector: (element: I) => K, keyEqualer: Equaler<K>, resultSelector: (outer: O, inner: Iterable<I>) => R) {
        this._outer = outer;
        this._inner = inner;
        this._outerKeySelector = outerKeySelector;
        this._innerKeySelector = innerKeySelector;
        this._keyEqualer = keyEqualer;
        this._resultSelector = resultSelector;
    }

    *[Symbol.iterator](): Iterator<R> {
        const outer = this._outer;
        const inner = this._inner;
        const outerKeySelector = this._outerKeySelector;
        const innerKeySelector = this._innerKeySelector;
        const keyEqualer = this._keyEqualer;
        const resultSelector = this._resultSelector;
        const map = createGroupings(inner, innerKeySelector, keyEqualer, identity);
        for (const outerElement of outer) {
            const outerKey = outerKeySelector(outerElement);
            const innerElements = map.get(outerKey) || empty<I>();
            yield resultSelector(outerElement, innerElements);
        }
    }
}

/**
 * Creates a grouped `Iterable` for the correlated elements between an outer `Iterable` object and an inner `Iterable` object.
 *
 * @param outer An `Iterable` object.
 * @param inner An `Iterable` object.
 * @param outerKeySelector A callback used to select the key for an element in `outer`.
 * @param innerKeySelector A callback used to select the key for an element in `inner`.
 * @param resultSelector A callback used to select the result for the correlated elements.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Join
 */
export function groupJoin<O, I, K, R>(outer: Iterable<O>, inner: Iterable<I>, outerKeySelector: (element: O) => K, innerKeySelector: (element: I) => K, resultSelector: (outer: O, inner: Iterable<I>) => R, keyEqualer: Equaler<K> = Equaler.defaultEqualer): Iterable<R> {
    if (!isIterableObject(outer)) throw new TypeError("Iterable expected: outer");
    if (!isIterableObject(inner)) throw new TypeError("Iterable expected: inner");
    if (!isFunction(outerKeySelector)) throw new TypeError("Function expected: outerKeySelector");
    if (!isFunction(innerKeySelector)) throw new TypeError("Function expected: innerKeySelector");
    if (!isFunction(resultSelector)) throw new TypeError("Function expected: resultSelector");
    if (!isUndefined(keyEqualer) && !Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: equaler");
    return new GroupJoinIterable(outer, inner, outerKeySelector, innerKeySelector, keyEqualer, resultSelector);
}

class JoinIterable<O, I, K, R> implements Iterable<R> {
    private _outer: Iterable<O>;
    private _inner: Iterable<I>;
    private _outerKeySelector: (element: O) => K;
    private _innerKeySelector: (element: I) => K;
    private _keyEqualer: Equaler<K>;
    private _resultSelector: (outer: O, inner: I) => R;

    constructor(outer: Iterable<O>, inner: Iterable<I>, outerKeySelector: (element: O) => K, innerKeySelector: (element: I) => K, keyEqualer: Equaler<K>, resultSelector: (outer: O, inner: I) => R) {
        this._outer = outer;
        this._inner = inner;
        this._outerKeySelector = outerKeySelector;
        this._innerKeySelector = innerKeySelector;
        this._keyEqualer = keyEqualer;
        this._resultSelector = resultSelector;
    }

    *[Symbol.iterator](): Iterator<R> {
        const outer = this._outer;
        const inner = this._inner;
        const outerKeySelector = this._outerKeySelector;
        const innerKeySelector = this._innerKeySelector;
        const keyEqualer = this._keyEqualer;
        const resultSelector = this._resultSelector;
        const map = createGroupings(inner, innerKeySelector, keyEqualer, identity);
        for (const outerElement of outer) {
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
 * Creates an `Iterable` for the correlated elements of two `Iterable` objects.
 *
 * @param outer An `Iterable` object.
 * @param inner An `Iterable` object.
 * @param outerKeySelector A callback used to select the key for an element in `outer`.
 * @param innerKeySelector A callback used to select the key for an element in `inner`.
 * @param resultSelector A callback used to select the result for the correlated elements.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Join
 */
export function join<O, I, K, R>(outer: Iterable<O>, inner: Iterable<I>, outerKeySelector: (element: O) => K, innerKeySelector: (element: I) => K, resultSelector: (outer: O, inner: I) => R, keyEqualer: Equaler<K> = Equaler.defaultEqualer): Iterable<R> {
    if (!isIterableObject(outer)) throw new TypeError("Iterable expected: outer");
    if (!isIterableObject(inner)) throw new TypeError("Iterable expected: inner");
    if (!isFunction(outerKeySelector)) throw new TypeError("Function expected: outerKeySelector");
    if (!isFunction(innerKeySelector)) throw new TypeError("Function expected: innerKeySelector");
    if (!isFunction(resultSelector)) throw new TypeError("Function expected: resultSelector");
    if (!Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: equaler");
    return new JoinIterable(outer, inner, outerKeySelector, innerKeySelector, keyEqualer, resultSelector);
}

function selectGroupingKey<K, V>(grouping: Grouping<K, V>) {
    return grouping.key;
}

class FullJoinIterable<O, I, K, R> implements Iterable<R> {
    private _outer: Iterable<O>;
    private _inner: Iterable<I>;
    private _outerKeySelector: (element: O) => K;
    private _innerKeySelector: (element: I) => K;
    private _keyEqualer: Equaler<K>;
    private _resultSelector: (outer: O | undefined, inner: I | undefined) => R;

    constructor(outer: Iterable<O>, inner: Iterable<I>, outerKeySelector: (element: O) => K, innerKeySelector: (element: I) => K, keyEqualer: Equaler<K>, resultSelector: (outer: O | undefined, inner: I | undefined) => R) {
        this._outer = outer;
        this._inner = inner;
        this._outerKeySelector = outerKeySelector;
        this._innerKeySelector = innerKeySelector;
        this._keyEqualer = keyEqualer;
        this._resultSelector = resultSelector;
    }

    *[Symbol.iterator](): Iterator<R> {
        const outer = this._outer;
        const inner = this._inner;
        const outerKeySelector = this._outerKeySelector;
        const innerKeySelector = this._innerKeySelector;
        const keyEqualer = this._keyEqualer;
        const resultSelector = this._resultSelector;
        const outerLookup = new Lookup<K, O>(createGroupings(outer, outerKeySelector, keyEqualer, identity));
        const innerLookup = new Lookup<K, I>(createGroupings(inner, innerKeySelector, keyEqualer, identity));
        const keys = union(map(outerLookup, selectGroupingKey), map(innerLookup, selectGroupingKey), keyEqualer);
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
 * Creates an `Iterable` for the correlated elements between an outer `Iterable` object and an inner
 * `Iterable` object.
 *
 * @param outer An `Iterable` object.
 * @param inner An `Iterable` object.
 * @param outerKeySelector A callback used to select the key for an element in `outer`.
 * @param innerKeySelector A callback used to select the key for an element in `inner`.
 * @param resultSelector A callback used to select the result for the correlated elements.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Join
 */
export function fullJoin<O, I, K, R>(outer: Iterable<O>, inner: Iterable<I>, outerKeySelector: (element: O) => K, innerKeySelector: (element: I) => K, resultSelector: (outer: O | undefined, inner: I | undefined) => R, keyEqualer: Equaler<K> = Equaler.defaultEqualer): Iterable<R> {
    if (!isIterableObject(outer)) throw new TypeError("Iterable expected: outer");
    if (!isIterableObject(inner)) throw new TypeError("Iterable expected: inner");
    if (!isFunction(outerKeySelector)) throw new TypeError("Function expected: outerKeySelector");
    if (!isFunction(innerKeySelector)) throw new TypeError("Function expected: innerKeySelector");
    if (!isFunction(resultSelector)) throw new TypeError("Function expected: resultSelector");
    if (!Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: equaler");
    return new FullJoinIterable(outer, inner, outerKeySelector, innerKeySelector, keyEqualer, resultSelector);
}

class ZipIterable<T, U, R> implements Iterable<R> {
    private _left: Iterable<T>;
    private _right: Iterable<U>;
    private _selector: (left: T, right: U) => R;

    constructor(left: Iterable<T>, right: Iterable<U>, selector: (left: T, right: U) => R) {
        this._left = left;
        this._right = right;
        this._selector = selector;
    }

    *[Symbol.iterator](): Iterator<R> {
        const selector = this._selector;
        const leftIterator = this._left[Symbol.iterator]();
        let leftResult: IteratorResult<T> | undefined;
        try {
            const rightIterator = this._right[Symbol.iterator]();
            let rightResult: IteratorResult<U> | undefined;
            try {
                for (;;) {
                    leftResult = leftIterator.next();
                    rightResult = rightIterator.next();
                    if (leftResult.done || rightResult.done) break;
                    yield selector(leftResult.value, rightResult.value);
                }
            }
            finally {
                if (rightResult && !rightResult.done) {
                    rightIterator.return?.();
                }
            }
        }
        finally {
            if (leftResult && !leftResult.done) {
                leftIterator.return?.();
            }
        }
    }
}

/**
 * Creates a subquery that combines two `Iterable` objects by combining elements
 * in tuples.
 *
 * @param left A `Iterable`.
 * @param right A `Iterable`.
 * @category Join
 */
export function zip<T, U>(left: Iterable<T>, right: Iterable<U>): Iterable<[T, U]>;
/**
 * Creates a subquery that combines two `Iterable` objects by combining elements
 * using the supplied callback.
 *
 * @param left A `Iterable`.
 * @param right A `Iterable`.
 * @param selector A callback used to combine two elements.
 * @category Join
 */
export function zip<T, U, R>(left: Iterable<T>, right: Iterable<U>, selector: (left: T, right: U) => R): Iterable<R>;
export function zip<T, U, R>(left: Iterable<T>, right: Iterable<U>, selector: (left: T, right: U) => [T, U] | R = tuple): Iterable<[T, U] | R> {
    if (!isIterableObject(left)) throw new TypeError("Iterable expected: left");
    if (!isIterableObject(right)) throw new TypeError("Iterable expected: right");
    if (!isFunction(selector)) throw new TypeError("Function expected: selector");
    return new ZipIterable(left, right, selector);
}
