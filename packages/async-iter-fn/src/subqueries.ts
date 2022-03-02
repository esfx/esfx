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

import /*#__INLINE__*/ { isAsyncIterableObject, isFunction, isIterableObject, isNumber, isPositiveFiniteNumber, isPrimitive, isUndefined } from "@esfx/internal-guards";
import { AsyncHierarchyIterable } from '@esfx/async-iter-hierarchy';
import { HashMap } from "@esfx/collections-hashmap";
import { HashSet } from "@esfx/collections-hashset";
import { Equaler } from "@esfx/equatable";
import { identity, isDefined } from '@esfx/fn';
import { HierarchyIterable } from '@esfx/iter-hierarchy';
import { flowHierarchy } from './internal/utils';
import { toArrayAsync, toHashSetAsync } from './scalars';

class AsyncAppendIterable<T> implements AsyncIterable<T> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _value: PromiseLike<T> | T;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, value: PromiseLike<T> | T) {
        this._source = source;
        this._value = value;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        yield* this._source;
        yield this._value;
    }
}

/**
 * Creates an `AsyncIterable` for the elements of `source` with the provided `value` appended to the
 * end.
 *
 * @param source The `AsyncIterable` or `Iterable` object to append to.
 * @param value The value to append.
 * @category Subquery
 */
export function appendAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, value: PromiseLike<T> | T): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the elements of `source` with the provided `value` appended to the
 * end.
 *
 * @param source The `AsyncIterable` or `Iterable` object to append to.
 * @param value The value to append.
 * @category Subquery
 */
export function appendAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, value: PromiseLike<T> | T): AsyncIterable<T>;
export function appendAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, value: PromiseLike<T> | T): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    return flowHierarchy(new AsyncAppendIterable(source, value), source);
}

class AsyncPrependIterable<T> implements AsyncIterable<T> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _value: PromiseLike<T> | T;

    constructor(value: PromiseLike<T> | T, source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>) {
        this._value = value;
        this._source = source;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        yield this._value;
        yield* this._source;
    }
}

/**
 * Creates an `AsyncIterable` for the elements of `source` with the provided `value` prepended to the
 * beginning.
 *
 * @param source An `AsyncIterable` or `Iterable` object value.
 * @param value The value to prepend.
 * @category Subquery
 */
export function prependAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, value: T): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the elements of `source` with the provided `value` prepended to the
 * beginning.
 *
 * @param source An `AsyncIterable` or `Iterable` object value.
 * @param value The value to prepend.
 * @category Subquery
 */
export function prependAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, value: PromiseLike<T> | T): AsyncIterable<T>;
export function prependAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, value: PromiseLike<T> | T): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    return flowHierarchy(new AsyncPrependIterable(value, source), source);
}

class AsyncConcatIterable<T> implements AsyncIterable<T> {
    private _left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;

    constructor(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>) {
        this._left = left;
        this._right = right;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        yield* this._left;
        yield* this._right;
    }
}

/**
 * Creates an `AsyncIterable` that concatenates a `AsyncIterable` or `Iterable`
 * object with an `AsyncIterable` or `Iterable` object.
 *
 * @param left A `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @category Subquery
 */
export function concatAsync<TNode, T extends TNode>(left: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` that concatenates an `AsyncIterable` or `Iterable` object with
 * a `AsyncIterable` or `Iterable` object.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right A `AsyncIterable` or `Iterable` object.
 * @category Subquery
 */
export function concatAsync<TNode, T extends TNode>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` that concatenates two `AsyncIterable` or `Iterable` objects.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @category Subquery
 */
export function concatAsync<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncIterable<T>;
export function concatAsync<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncIterable<T> {
    if (!isAsyncIterableObject(left) && !isIterableObject(left)) throw new TypeError("AsyncIterable expected: left");
    if (!isAsyncIterableObject(right) && !isIterableObject(right)) throw new TypeError("AsyncIterable expected: right");
    return flowHierarchy(new AsyncConcatIterable(left, right), left, right);
}

class AsyncFilterByIterable<T, K> implements AsyncIterable<T> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _keySelector: (element: T) => K;
    private _predicate: (key: K, offset: number) => PromiseLike<boolean> | boolean;
    private _invert: boolean;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, predicate: (key: K, offset: number) => PromiseLike<boolean> | boolean, invert: boolean) {
        this._source = source;
        this._keySelector = keySelector;
        this._predicate = predicate;
        this._invert = invert;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const keySelector = this._keySelector;
        const predicate = this._predicate;
        const inverted = this._invert;
        let offset = 0;
        for await (const element of this._source) {
            let result = predicate(keySelector(element), offset++);
            if (!isPrimitive(result)) result = await result;
            if (inverted) result = !result;
            if (result) {
                yield element;
            }
        }
    }
}

/**
 * Creates an `AsyncIterable` where the selected key for each element matches the supplied predicate.
 *
 * @param source A `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param predicate A callback used to match each key.
 * @category Subquery
 */
export function filterByAsync<TNode, T extends TNode, K>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, keySelector: (element: T) => K, predicate: (key: K, offset: number) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` where the selected key for each element matches the supplied predicate.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param predicate A callback used to match each key.
 * @category Subquery
 */
export function filterByAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, predicate: (key: K, offset: number) => PromiseLike<boolean> | boolean): AsyncIterable<T>;
export function filterByAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, predicate: (key: K, offset: number) => PromiseLike<boolean> | boolean): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return flowHierarchy(new AsyncFilterByIterable(source, keySelector, predicate, /*invert*/ false), source);
}

export { filterByAsync as whereByAsync };
export { filterAsync as whereAsync };
export { filterDefinedAsync as whereDefinedAsync };
export { filterDefinedByAsync as whereDefinedByAsync };
export { filterNotByAsync as whereNotByAsync };
export { filterNotAsync as whereNotAsync };
export { filterNotDefinedByAsync as whereNotDefinedByAsync };
export { mapAsync as selectAsync };
export { flatMapAsync as selectManyAsync };
export { dropAsync as skipAsync };
export { dropRightAsync as skipRightAsync };
export { dropWhileAsync as skipWhileAsync };
export { dropUntilAsync as skipUntilAsync, dropUntilAsync as dropWhileNotAsync, dropUntilAsync as skipWhileNotAsync };
export { exceptByAsync as relativeComplementByAsync };
export { exceptAsync as relativeComplementAsync };

/**
 * Creates an `AsyncIterable` whose elements match the supplied predicate.
 *
 * @param source A `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function filterAsync<TNode, T extends TNode, U extends T>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (element: T, offset: number) => element is U): AsyncHierarchyIterable<TNode, U>;
/**
 * Creates an `AsyncIterable` whose elements match the supplied predicate.
 *
 * @param source A `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function filterAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` whose elements match the supplied predicate.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function filterAsync<T, U extends T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T, offset: number) => element is U): AsyncIterable<U>;
/**
 * Creates an `AsyncIterable` whose elements match the supplied predicate.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function filterAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): AsyncIterable<T>;
export function filterAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): AsyncIterable<T> {
    return filterByAsync(source, identity, predicate);
}


/**
 * Creates an `AsyncIterable` whose elements are neither `null` nor `undefined`.
 *
 * @param source A `AsyncIterable` or `Iterable` object.
 * @category Subquery
 */
export function filterDefinedAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>): AsyncHierarchyIterable<TNode, NonNullable<T>>;
/**
 * Creates an `AsyncIterable` whose elements are neither `null` nor `undefined`.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @category Subquery
 */
export function filterDefinedAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncIterable<NonNullable<T>>;
export function filterDefinedAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>) {
    return filterByAsync(source, identity, isDefined);
}


/**
 * Creates an `AsyncIterable` where the selected key for each element is neither `null` nor `undefined`.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @category Subquery
 */
export function filterDefinedByAsync<TNode, T extends TNode, K>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, keySelector: (value: T) => K): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` where the selected key for each element is neither `null` nor `undefined`.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @category Subquery
 */
export function filterDefinedByAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (value: T) => K): AsyncIterable<T>;
export function filterDefinedByAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (value: T) => K) {
    return filterByAsync(source, keySelector, isDefined);
}


/**
 * Creates an `AsyncIterable` where the selected key for each element does not match the supplied predicate.
 *
 * @param source A `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param predicate A callback used to match each key.
 * @category Subquery
 */
export function filterNotByAsync<TNode, T extends TNode, K>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, keySelector: (element: T) => K, predicate: (key: K, offset: number) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` where the selected key for each element does not match the supplied predicate.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param predicate A callback used to match each key.
 * @category Subquery
 */
export function filterNotByAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, predicate: (key: K, offset: number) => PromiseLike<boolean> | boolean): AsyncIterable<T>;
export function filterNotByAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, predicate: (key: K, offset: number) => PromiseLike<boolean> | boolean): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return flowHierarchy(new AsyncFilterByIterable(source, keySelector, predicate, /*invert*/ false), source);
}


/**
 * Creates an `AsyncIterable` whose elements do not match the supplied predicate.
 *
 * @param source A `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function filterNotAsync<TNode, T extends TNode, U extends T>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (element: T, offset: number) => element is U): AsyncHierarchyIterable<TNode, U>;
/**
 * Creates an `AsyncIterable` whose elements do not match the supplied predicate.
 *
 * @param source A `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function filterNotAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` whose elements do not match the supplied predicate.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function filterNotAsync<T, U extends T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T, offset: number) => element is U): AsyncIterable<U>;
/**
 * Creates an `AsyncIterable` whose elements do not match the supplied predicate.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function filterNotAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): AsyncIterable<T>;
export function filterNotAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T, offset: number) => PromiseLike<boolean> | boolean): AsyncIterable<T> {
    return filterNotByAsync(source, identity, predicate);
}


/**
 * Creates an `AsyncIterable` where the selected key for each element is either `null` or `undefined`.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @category Subquery
 */
export function filterNotDefinedByAsync<TNode, T extends TNode, K>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, keySelector: (value: T) => K): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` where the selected key for each element is either `null` or `undefined`.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @category Subquery
 */
export function filterNotDefinedByAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (value: T) => K): AsyncIterable<T>;
export function filterNotDefinedByAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (value: T) => K) {
    return filterNotByAsync(source, keySelector, isDefined);
}


class AsyncMapIterable<T, U> implements AsyncIterable<U> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _selector: (element: T, offset: number) => PromiseLike<U> | U;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, selector: (element: T, offset: number) => PromiseLike<U> | U) {
        this._source = source;
        this._selector = selector;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<U> {
        const selector = this._selector;
        let offset = 0;
        for await (const element of this._source) {
            yield selector(element, offset++);
        }
    }
}

/**
 * Creates an `AsyncIterable` by applying a callback to each element of an `AsyncIterable` or `Iterable` object.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param selector A callback used to map each element.
 * @category Subquery
 */
export function mapAsync<T, U>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, selector: (element: T, offset: number) => PromiseLike<U> | U): AsyncIterable<U> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(selector)) throw new TypeError("Function expected: selector");
    return new AsyncMapIterable(source, selector);
}


class AsyncFlatMapIterable<T, U, R> implements AsyncIterable<U | R> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _projection: (element: T) => AsyncIterable<U> | Iterable<PromiseLike<U> | U>;
    private _resultSelector?: (element: T, innerElement: U) => PromiseLike<R> | R;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, projection: (element: T) => AsyncIterable<U> | Iterable<PromiseLike<U> | U>, resultSelector?: (element: T, innerElement: U) => PromiseLike<R> | R) {
        this._source = source;
        this._projection = projection;
        this._resultSelector = resultSelector;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<U | R> {
        const projection = this._projection;
        const resultSelector = this._resultSelector;
        for await (const element of this._source) {
            const inner = projection(element);
            if (resultSelector) {
                for await (const innerElement of inner) {
                    yield resultSelector(element, innerElement);
                }
            }
            else {
                yield* inner;
            }
        }
    }
}

/**
 * Creates an `AsyncIterable` that iterates the results of applying a callback to each element of `source`.
 *
 * @param source A [[Queryable]] object.
 * @param projection A callback used to map each element into an iterable.
 * @category Subquery
 */
export function flatMapAsync<T, U>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, projection: (element: T) => AsyncIterable<U> | Iterable<PromiseLike<U> | U>): AsyncIterable<U>;
/**
 * Creates an `AsyncIterable` that iterates the results of applying a callback to each element of `source`.
 *
 * @param source A [[Queryable]] object.
 * @param projection A callback used to map each element into an iterable.
 * @category Subquery
 */
export function flatMapAsync<T, U, R>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, projection: (element: T) => AsyncIterable<U> | Iterable<PromiseLike<U> | U>, resultSelector: (element: T, innerElement: U) => PromiseLike<R> | R): AsyncIterable<R>;
export function flatMapAsync<T, U, R>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, projection: (element: T) => AsyncIterable<U> | Iterable<PromiseLike<U> | U>, resultSelector?: (element: T, innerElement: U) => PromiseLike<R> | R): AsyncIterable<U | R> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(projection)) throw new TypeError("Function expected: projection");
    return new AsyncFlatMapIterable(source, projection, resultSelector);
}


class AsyncDropIterable<T> implements AsyncIterable<T> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _count: number;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, count: number) {
        this._source = source;
        this._count = count;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        let remaining = this._count;
        if (remaining <= 0) {
            yield* this._source;
        }
        else {
            for await (const element of this._source) {
                if (remaining > 0) {
                    remaining--;
                }
                else {
                    yield element;
                }
            }
        }
    }
}

/**
 * Creates an `AsyncIterable` containing all elements except the first elements up to the supplied
 * count.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param count The number of elements to skip.
 * @category Subquery
 */
export function dropAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, count: number): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` containing all elements except the first elements up to the supplied
 * count.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param count The number of elements to skip.
 * @category Subquery
 */
export function dropAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, count: number): AsyncIterable<T>;
export function dropAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, count: number): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isNumber(count)) throw new TypeError("Number expected: count");
    if (!isPositiveFiniteNumber(count)) throw new RangeError("Argument out of range: count");
    return flowHierarchy(new AsyncDropIterable(source, count), source);
}


class AsyncDropRightIterable<T> implements AsyncIterable<T> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _count: number;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, count: number) {
        this._source = source;
        this._count = count;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const pending: T[] = [];
        const count = this._count;
        if (count <= 0) {
            yield* this._source;
        }
        else {
            for await (const element of this._source) {
                pending.push(element);
                if (pending.length > count) {
                    yield pending.shift()!;
                }
            }
        }
    }
}

/**
 * Creates an `AsyncIterable` containing all elements except the first elements up to the supplied
 * count.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param count The number of elements to skip.
 * @category Subquery
 */
export function dropRightAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, count: number): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` containing all elements except the first elements up to the supplied
 * count.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param count The number of elements to skip.
 * @category Subquery
 */
export function dropRightAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, count: number): AsyncIterable<T>;
export function dropRightAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, count: number): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isNumber(count)) throw new TypeError("Number expected: count");
    if (!isPositiveFiniteNumber(count)) throw new RangeError("Argument out of range: count");
    return flowHierarchy(new AsyncDropRightIterable(source, count), source);
}


class AsyncDropWhileIterable<T> implements AsyncIterable<T> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _predicate: (element: T) => PromiseLike<boolean> | boolean;
    private _invert: boolean;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean, invert: boolean) {
        this._source = source;
        this._predicate = predicate;
        this._invert = invert;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const predicate = this._predicate;
        const inverted = this._invert;
        let skipping = true;
        for await (const element of this._source) {
            if (skipping) {
                let result = predicate(element);
                if (!isPrimitive(result)) result = await result;
                if (inverted) result = !result;
                skipping = !!result;
            }
            if (!skipping) {
                yield element;
            }
        }
    }
}

/**
 * Creates an `AsyncIterable` containing all elements except the first elements that match
 * the supplied predicate.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function dropWhileAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` containing all elements except the first elements that match
 * the supplied predicate.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function dropWhileAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncIterable<T>;
export function dropWhileAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return flowHierarchy(new AsyncDropWhileIterable(source, predicate, /*invert*/ false), source);
}


/**
 * Creates an `AsyncIterable` containing all elements except the first elements that do not match
 * the supplied predicate.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function dropUntilAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` containing all elements except the first elements that do not match
 * the supplied predicate.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function dropUntilAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncIterable<T>;
export function dropUntilAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return flowHierarchy(new AsyncDropWhileIterable(source, predicate, /*invert*/ true), source);
}


class AsyncTakeIterable<T> implements AsyncIterable<T> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _count: number;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, count: number) {
        this._source = source;
        this._count = count;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        let remaining = this._count;
        if (remaining > 0) {
            for await (const element of this._source) {
                yield element;
                if (--remaining <= 0) {
                    break;
                }
            }
        }
    }
}

/**
 * Creates an `AsyncIterable` containing the first elements up to the supplied count.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param count The number of elements to take.
 * @category Subquery
 */
export function takeAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, count: number): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` containing the first elements up to the supplied count.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param count The number of elements to take.
 * @category Subquery
 */
export function takeAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, count: number): AsyncIterable<T>;
export function takeAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, count: number): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isNumber(count)) throw new TypeError("Number expected: count");
    if (!isPositiveFiniteNumber(count)) throw new RangeError("Argument out of range: count");
    return flowHierarchy(new AsyncTakeIterable(source, count), source);
}

class AsyncTakeRightIterable<T> implements AsyncIterable<T> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _count: number;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, count: number) {
        this._source = source;
        this._count = count;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const count = this._count;
        if (count <= 0) {
            return;
        }
        else {
            const pending: T[] = [];
            for await (const element of this._source) {
                pending.push(element);
                if (pending.length > count) {
                    pending.shift();
                }
            }
            yield* pending;
        }
    }
}

/**
 * Creates an `AsyncIterable` containing the last elements up to the supplied
 * count.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param count The number of elements to take.
 * @category Subquery
 */
export function takeRightAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, count: number): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` containing the last elements up to the supplied
 * count.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param count The number of elements to take.
 * @category Subquery
 */
export function takeRightAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, count: number): AsyncIterable<T>;
export function takeRightAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, count: number): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isNumber(count)) throw new TypeError("Number expected: count");
    if (!isPositiveFiniteNumber(count)) throw new RangeError("Argument out of range: count");
    return flowHierarchy(new AsyncTakeRightIterable(source, count), source);
}

class AsyncTakeWhileIterable<T> implements AsyncIterable<T> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _predicate: (element: T) => PromiseLike<boolean> | boolean;
    private _invert: boolean;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean, invert: boolean) {
        this._source = source;
        this._predicate = predicate;
        this._invert = invert;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const predicate = this._predicate;
        const inverted = this._invert;
        for await (const element of this._source) {
            let result = predicate(element);
            if (!isPrimitive(result)) result = await result;
            if (inverted) result = !result;
            if (!result) {
                break;
            }
            yield element;
        }
    }
}

/**
 * Creates an `AsyncIterable` containing the first elements that match the supplied predicate.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function takeWhileAsync<TNode, T extends TNode, U extends T>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (element: T) => element is U): AsyncHierarchyIterable<TNode, U>;
/**
 * Creates an `AsyncIterable` containing the first elements that match the supplied predicate.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function takeWhileAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` containing the first elements that match the supplied predicate.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function takeWhileAsync<T, U extends T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => element is U): AsyncIterable<U>;
/**
 * Creates an `AsyncIterable` containing the first elements that match the supplied predicate.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function takeWhileAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncIterable<T>;
export function takeWhileAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return flowHierarchy(new AsyncTakeWhileIterable(source, predicate, /*invert*/ false), source);
}

/**
 * Creates an `AsyncIterable` containing the first elements that do not match the supplied predicate.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function takeUntilAsync<TNode, T extends TNode, U extends T>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (element: T) => element is U): AsyncHierarchyIterable<TNode, U>;
/**
 * Creates an `AsyncIterable` containing the first elements that do not match the supplied predicate.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function takeUntilAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` containing the first elements that do not match the supplied predicate.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function takeUntilAsync<T, U extends T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => element is U): AsyncIterable<U>;
/**
 * Creates an `AsyncIterable` containing the first elements that do not match the supplied predicate.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function takeUntilAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncIterable<T>;
export function takeUntilAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, predicate: (element: T) => PromiseLike<boolean> | boolean): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return flowHierarchy(new AsyncTakeWhileIterable(source, predicate, /*invert*/ true), source);
}

class AsyncIntersectByIterable<T, K> implements AsyncIterable<T> {
    private _left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _keySelector: (element: T) => K;
    private _keyEqualer?: Equaler<K>;

    constructor(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>) {
        this._left = left;
        this._right = right;
        this._keySelector = keySelector;
        this._keyEqualer = keyEqualer;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const keySelector = this._keySelector;
        const set = await toHashSetAsync(this._right, keySelector, this._keyEqualer);
        if (set.size <= 0) {
            return;
        }
        for await (const element of this._left) {
            if (set.delete(keySelector(element))) {
                yield element;
            }
        }
    }
}

/**
 * Creates an `AsyncIterable` for the set intersection of a `AsyncIterable` or `Iterable` object and another `AsyncIterable` or `Iterable` object, where set identity is determined by the selected key.
 *
 * @param left A `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function intersectByAsync<TNode, T extends TNode, K>(left: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the set intersection of two `AsyncIterable` or `Iterable` objects, where set identity is determined by the selected key.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right A `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function intersectByAsync<TNode, T extends TNode, K>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the set intersection of two `AsyncIterable` or `Iterable` objects, where set identity is determined by the selected key.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function intersectByAsync<T, K>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncIterable<T>;
export function intersectByAsync<T, K>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncIterable<T> {
    if (!isAsyncIterableObject(left) && !isIterableObject(left)) throw new TypeError("AsyncIterable expected: left");
    if (!isAsyncIterableObject(right) && !isIterableObject(right)) throw new TypeError("AsyncIterable expected: right");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isUndefined(keyEqualer) && !Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: keyEqualer");
    return flowHierarchy(new AsyncIntersectByIterable(left, right, keySelector, keyEqualer), left, right);
}

/**
 * Creates an `AsyncIterable` for the set intersection of a `AsyncIterable` or `Iterable` object and another `AsyncIterable` or `Iterable` object.
 *
 * @param left A `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function intersectAsync<TNode, T extends TNode>(left: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the set intersection of two `AsyncIterable` or `Iterable` objects.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right A `AsyncIterable` or `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function intersectAsync<TNode, T extends TNode>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, equaler?: Equaler<T>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the set intersection of two `AsyncIterable` or `Iterable` objects.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function intersectAsync<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncIterable<T>;
export function intersectAsync<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncIterable<T> {
    if (!isAsyncIterableObject(left) && !isIterableObject(left)) throw new TypeError("AsyncIterable expected: left");
    if (!isAsyncIterableObject(right) && !isIterableObject(right)) throw new TypeError("AsyncIterable expected: right");
    if (!isUndefined(equaler) && !Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return flowHierarchy(new AsyncIntersectByIterable(left, right, identity, equaler), left, right);
}

class AsyncUnionByIterable<T, K> implements AsyncIterable<T> {
    private _left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _keySelector: (element: T) => K;
    private _keyEqualer?: Equaler<K>;

    constructor(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>) {
        this._left = left;
        this._right = right;
        this._keySelector = keySelector;
        this._keyEqualer = keyEqualer;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const keySelector = this._keySelector;
        const set = new HashSet(this._keyEqualer);
        for await (const element of this._left) {
            if (set.tryAdd(keySelector(element))) {
                yield element;
            }
        }
        for await (const element of this._right) {
            if (set.tryAdd(keySelector(element))) {
                yield element;
            }
        }
    }
}

/**
 * Creates an `AsyncIterable` for the set union of two `AsyncIterable` or `Iterable` objects, where set identity is determined by the selected key.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function unionByAsync<TNode, T extends TNode, K>(left: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the set union of two `AsyncIterable` or `Iterable` objects, where set identity is determined by the selected key.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function unionByAsync<TNode, T extends TNode, K>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the set union of two `AsyncIterable` or `Iterable` objects, where set identity is determined by the selected key.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function unionByAsync<T, K>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncIterable<T>;
export function unionByAsync<T, K>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncIterable<T> {
    if (!isAsyncIterableObject(left) && !isIterableObject(left)) throw new TypeError("AsyncIterable expected: left");
    if (!isAsyncIterableObject(right) && !isIterableObject(right)) throw new TypeError("AsyncIterable expected: right");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isUndefined(keyEqualer) && !Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: keyEqualer");
    return flowHierarchy(new AsyncUnionByIterable(left, right, keySelector, keyEqualer), left, right);
}

/**
 * Creates an `AsyncIterable` for the set union of two `AsyncIterable` or `Iterable` objects.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function unionAsync<TNode, T extends TNode>(left: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the set union of two `AsyncIterable` or `Iterable` objects.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function unionAsync<TNode, T extends TNode>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, equaler?: Equaler<T>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the set union of two `AsyncIterable` or `Iterable` objects.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function unionAsync<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncIterable<T>;
export function unionAsync<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncIterable<T> {
    if (!isAsyncIterableObject(left) && !isIterableObject(left)) throw new TypeError("AsyncIterable expected: left");
    if (!isAsyncIterableObject(right) && !isIterableObject(right)) throw new TypeError("AsyncIterable expected: right");
    if (!isUndefined(equaler) && !Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return flowHierarchy(new AsyncUnionByIterable(left, right, identity, equaler), left, right);
}

class AsyncExceptByIterable<T, K> implements AsyncIterable<T> {
    private _left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _keySelector: (element: T) => K;
    private _keyEqualer?: Equaler<K>;

    constructor(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>) {
        this._left = left;
        this._right = right;
        this._keySelector = keySelector;
        this._keyEqualer = keyEqualer;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const keySelector = this._keySelector;
        const set = await toHashSetAsync(this._right, keySelector, this._keyEqualer!);
        for await (const element of this._left) {
            if (set.tryAdd(keySelector(element))) {
                yield element;
            }
        }
    }
}

/**
 * Creates an `AsyncIterable` for the set difference between two `AsyncIterable` or `Iterable` objects, where set identity is determined by the selected key.
 *
 * @param left A `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function exceptByAsync<TNode, T extends TNode, K>(left: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the set difference between two `AsyncIterable` or `Iterable` objects, where set identity is determined by the selected key.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function exceptByAsync<T, K>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncIterable<T>;
export function exceptByAsync<T, K>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncIterable<T> {
    if (!isAsyncIterableObject(left) && !isIterableObject(left)) throw new TypeError("AsyncIterable expected: left");
    if (!isAsyncIterableObject(right) && !isIterableObject(right)) throw new TypeError("AsyncIterable expected: right");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isUndefined(keyEqualer) && !Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: keyEqualer");
    return flowHierarchy(new AsyncExceptByIterable(left, right, keySelector, keyEqualer), left);
}


/**
 * Creates an `AsyncIterable` for the set difference between two `AsyncIterable` or `Iterable` objects.
 *
 * @param left A `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function exceptAsync<TNode, T extends TNode>(left: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the set difference between two `AsyncIterable` or `Iterable` objects.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function exceptAsync<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncIterable<T>;
export function exceptAsync<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncIterable<T> {
    if (!isAsyncIterableObject(left) && !isIterableObject(left)) throw new TypeError("AsyncIterable expected: left");
    if (!isAsyncIterableObject(right) && !isIterableObject(right)) throw new TypeError("AsyncIterable expected: right");
    if (!isUndefined(equaler) && !Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return flowHierarchy(new AsyncExceptByIterable(left, right, identity, equaler), left);
}


/**
 * Creates an `AsyncIterable` with every instance of the specified value removed.
 *
 * @param source A `AsyncIterable` or `Iterable` object.
 * @param values The values to exclude.
 * @category Subquery
 */
export function excludeAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, ...values: [PromiseLike<T> | T, ...(PromiseLike<T> | T)[]]): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` with every instance of the specified value removed.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param values The values to exclude.
 * @category Subquery
 */
export function excludeAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, ...values: [PromiseLike<T> | T, ...(PromiseLike<T> | T)[]]): AsyncIterable<T>;
export function excludeAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, ...values: [PromiseLike<T> | T, ...(PromiseLike<T> | T)[]]): AsyncIterable<T> {
    return exceptAsync(source, values);
}

class AsyncDistinctByIterable<T, K> implements AsyncIterable<T> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _keySelector: (value: T) => K;
    private _keyEqualer?: Equaler<K>;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (value: T) => K, keyEqualer?: Equaler<K>) {
        this._source = source;
        this._keySelector = keySelector;
        this._keyEqualer = keyEqualer;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const set = new HashSet<K>(this._keyEqualer);
        const selector = this._keySelector;
        for await (const element of this._source) {
            const key = selector(element);
            if (set.tryAdd(key)) {
                yield element;
            }
        }
    }
}

/**
 * Creates an `AsyncIterable` for the distinct elements of `source`.
 *
 * @param source A `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key to determine uniqueness.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function distinctByAsync<TNode, T extends TNode, K>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, keySelector: (value: T) => K, keyEqualer?: Equaler<K>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the distinct elements of `source`.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key to determine uniqueness.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function distinctByAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (value: T) => K, keyEqualer?: Equaler<K>): AsyncIterable<T>;
export function distinctByAsync<T, K>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (value: T) => K, keyEqualer?: Equaler<K>): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isUndefined(keyEqualer) && !Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: keyEqualer");
    return flowHierarchy(new AsyncDistinctByIterable(source, keySelector, keyEqualer), source);
}

/**
 * Creates an `AsyncIterable` for the distinct elements of `source`.
 *
 * @param source A `AsyncIterable` or `Iterable` object.
 * @param equaler An `Equaler` object used to compare element equality.
 * @category Subquery
 */
export function distinctAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, equaler?: Equaler<T>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the distinct elements of source.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param equaler An `Equaler` object used to compare element equality.
 * @category Subquery
 */
export function distinctAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncIterable<T>;
export function distinctAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isUndefined(equaler) && !Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return flowHierarchy(new AsyncDistinctByIterable(source, identity, equaler), source);
}


class AsyncDefaultIfEmptyIterable<T> implements AsyncIterable<T> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _defaultValue: PromiseLike<T> | T;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, defaultValue: PromiseLike<T> | T) {
        this._source = source;
        this._defaultValue = defaultValue;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const source = this._source;
        const defaultValue = this._defaultValue;
        let hasElements = false;
        for await (const value of source) {
            hasElements = true;
            yield value;
        }
        if (!hasElements) {
            yield defaultValue;
        }
    }
}

/**
 * Creates an `AsyncIterable` that contains the provided default value if `source`
 * contains no elements.
 *
 * @param source A `AsyncIterable` or `Iterable` object.
 * @param defaultValue The default value.
 * @category Subquery
 */
export function defaultIfEmptyAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, defaultValue: PromiseLike<T> | T): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` that contains the provided default value if `source`
 * contains no elements.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param defaultValue The default value.
 * @category Subquery
 */
export function defaultIfEmptyAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, defaultValue: PromiseLike<T> | T): AsyncIterable<T>;
export function defaultIfEmptyAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, defaultValue: PromiseLike<T> | T): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    return flowHierarchy(new AsyncDefaultIfEmptyIterable(source, defaultValue), source);
}

class AsyncPatchIterable<T> implements AsyncIterable<T> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _start: number;
    private _skipCount: number;
    private _range: AsyncIterable<T> | Iterable<PromiseLike<T> | T> | undefined;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, start: number, skipCount: number, range: AsyncIterable<T> | Iterable<PromiseLike<T> | T> | undefined) {
        this._source = source;
        this._start = start;
        this._skipCount = skipCount;
        this._range = range;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const start = this._start;
        const skipCount = this._skipCount;
        let offset = 0;
        let hasYieldedRange = false;
        for await (const value of this._source) {
            if (offset < start) {
                yield value;
                offset++;
            }
            else if (offset < start + skipCount) {
                offset++;
            }
            else {
                if (!hasYieldedRange && this._range) {
                    yield* this._range;
                    hasYieldedRange = true;
                }
                yield value;
            }
        }
        if (!hasYieldedRange && this._range) {
            yield* this._range;
        }
    }
}

/**
 * Creates an `AsyncIterable` for the elements of the source with the provided range
 * patched into the results.
 *
 * @param source A `AsyncIterable` or `Iterable` object to patch.
 * @param start The offset at which to patch the range.
 * @param skipCount The number of elements to skip from start.
 * @param range The range to patch into the result.
 * @category Subquery
 */
export function patchAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, start: number, skipCount?: number, range?: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the elements of the source with the provided range
 * patched into the results.
 *
 * @param source An `AsyncIterable` or `Iterable` object to patch.
 * @param start The offset at which to patch the range.
 * @param skipCount The number of elements to skip from start.
 * @param range The range to patch into the result.
 * @category Subquery
 */
export function patchAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, start: number, skipCount?: number, range?: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncIterable<T>;
export function patchAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, start: number, skipCount: number = 0, range?: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isNumber(start)) throw new TypeError("Number expected: start");
    if (!isNumber(skipCount)) throw new TypeError("Number expected: skipCount");
    if (!isUndefined(range) && !isAsyncIterableObject(range) && !isIterableObject(range)) throw new TypeError("AsyncIterable expected: range");
    if (!isPositiveFiniteNumber(start)) throw new RangeError("Argument out of range: start");
    if (!isPositiveFiniteNumber(skipCount)) throw new RangeError("Argument out of range: skipCount");
    return flowHierarchy(new AsyncPatchIterable(source, start, skipCount, range), source);
}

class AsyncScanIterable<T, U> implements AsyncIterable<T | U> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _accumulator: (current: T | U, element: T, offset: number) => PromiseLike<T | U> | T | U;
    private _isSeeded: boolean;
    private _seed: T | U | undefined;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, accumulator: (current: T | U, element: T, offset: number) => PromiseLike<T | U> | T | U, isSeeded: boolean, seed: T | U | undefined) {
        this._source = source;
        this._accumulator = accumulator;
        this._isSeeded = isSeeded;
        this._seed = seed;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T | U> {
        const accumulator = this._accumulator;
        let hasCurrent = this._isSeeded;
        let current = this._seed;
        let offset = 0;
        for await (const value of this._source) {
            if (!hasCurrent) {
                current = value;
                hasCurrent = true;
            }
            else {
                current = await accumulator(current!, value, offset);
                yield current;
            }
            offset++;
        }
    }
}
/**
 * Creates an `AsyncIterable` containing the cumulative results of applying the provided callback to each element.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param accumulator The callback used to compute each result.
 * @category Subquery
 */
export function scanAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, accumulator: (current: T, element: T, offset: number) => PromiseLike<T> | T): AsyncIterable<T>;
/**
 * Creates an `AsyncIterable` containing the cumulative results of applying the provided callback to each element.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param accumulator The callback used to compute each result.
 * @param seed An optional seed value.
 * @category Subquery
 */
export function scanAsync<T, U>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, accumulator: (current: U, element: T, offset: number) => PromiseLike<U> | U, seed: U): AsyncIterable<U>;
export function scanAsync<T, U>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, accumulator: (current: T | U, element: T, offset: number) => PromiseLike<T | U> | T | U, seed?: T | U): AsyncIterable<T | U> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(accumulator)) throw new TypeError("Function expected: accumulator");
    return new AsyncScanIterable<T, U>(source, accumulator, arguments.length > 2, seed!);
}

class AsyncScanRightIterable<T, U> implements AsyncIterable<T | U> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _accumulator: (current: T | U, element: T, offset: number) => PromiseLike<T | U> | T | U;
    private _isSeeded: boolean;
    private _seed: T | U | undefined;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, accumulator: (current: T | U, element: T, offset: number) => PromiseLike<T | U> | T | U, isSeeded: boolean, seed: T | U | undefined) {
        this._source = source;
        this._accumulator = accumulator;
        this._isSeeded = isSeeded;
        this._seed = seed;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T | U> {
        const source = await toArrayAsync(this._source);
        const accumulator = this._accumulator;
        let hasCurrent = this._isSeeded;
        let current = this._seed;
        for (let offset = source.length - 1; offset >= 0; offset--) {
            const value = source[offset];
            if (!hasCurrent) {
                current = value;
                hasCurrent = true;
                continue;
            }
            current = await accumulator(current!, value, offset);
            yield current;
        }
    }
}

/**
 * Creates an `AsyncIterable` containing the cumulative results of applying the provided callback to each element in reverse.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param accumulator The callback used to compute each result.
 * @category Subquery
 */
export function scanRightAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, accumulator: (current: T, element: T, offset: number) => PromiseLike<T> | T): AsyncIterable<T>;
/**
 * Creates an `AsyncIterable` containing the cumulative results of applying the provided callback to each element in reverse.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param accumulator The callback used to compute each result.
 * @param seed An optional seed value.
 * @category Subquery
 */
export function scanRightAsync<T, U>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, accumulator: (current: U, element: T, offset: number) => PromiseLike<U> | U, seed: U): AsyncIterable<U>;
export function scanRightAsync<T, U>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, accumulator: (current: T | U, element: T, offset: number) => PromiseLike<T | U> | T | U, seed?: T | U): AsyncIterable<T | U> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(accumulator)) throw new TypeError("Function expected: accumulator");
    return new AsyncScanRightIterable<T, U>(source, accumulator, arguments.length > 2, seed);
}

class AsyncSymmetricDifferenceByIterable<T, K> implements AsyncIterable<T> {
    private _left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _keySelector: (element: T) => K;
    private _keyEqualer?: Equaler<K>;

    constructor(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>) {
        this._left = left;
        this._right = right;
        this._keySelector = keySelector;
        this._keyEqualer = keyEqualer;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const keySelector = this._keySelector;
        const rightKeys = new HashSet<K>(this._keyEqualer);
        const right = new HashMap<K, T>(this._keyEqualer);
        for await (const element of this._right) {
            const key = keySelector(element);
            if (rightKeys.tryAdd(key)) {
                right.set(key, element);
            }
        }
        const set = new HashSet<K>(this._keyEqualer);
        for await (const element of this._left) {
            const key = keySelector(element);
            if (set.tryAdd(key) && !right.has(key)) {
                yield element;
            }
        }
        for (const [key, element] of right) {
            if (set.tryAdd(key)) {
                yield element;
            }
        }
    }
}

/**
 * Creates an `AsyncIterable` for the symmetric difference between two `AsyncIterable` or `Iterable` objects, where set identity is determined by the selected key.
 * The result is an `AsyncIterable` containings the elements that exist in only left or right, but not
 * in both.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function symmetricDifferenceByAsync<TNode, T extends TNode, K>(left: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the symmetric difference between two `AsyncIterable` or `Iterable` objects, where set identity is determined by the selected key.
 * The result is an `AsyncIterable` containings the elements that exist in only left or right, but not
 * in both.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function symmetricDifferenceByAsync<TNode, T extends TNode, K>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the symmetric difference between two `AsyncIterable` or `Iterable` objects, where set identity is determined by the selected key.
 * The result is an `AsyncIterable` containings the elements that exist in only left or right, but not
 * in both.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function symmetricDifferenceByAsync<T, K>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncIterable<T>;
export function symmetricDifferenceByAsync<T, K>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): AsyncIterable<T> {
    if (!isAsyncIterableObject(left) && !isIterableObject(left)) throw new TypeError("AsyncIterable expected: left");
    if (!isAsyncIterableObject(right) && !isIterableObject(right)) throw new TypeError("AsyncIterable expected: right");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isUndefined(keyEqualer) && !Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: keyEqualer");
    return flowHierarchy(new AsyncSymmetricDifferenceByIterable(left, right, keySelector, keyEqualer), left, right);
}

/**
 * Creates an `AsyncIterable` for the symmetric difference between two [[Queryable]] objects.
 * The result is an `AsyncIterable` containings the elements that exist in only left or right, but not
 * in both.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function symmetricDifferenceAsync<TNode, T extends TNode>(left: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the symmetric difference between two [[Queryable]] objects.
 * The result is an `AsyncIterable` containings the elements that exist in only left or right, but not
 * in both.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function symmetricDifferenceAsync<TNode, T extends TNode>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, equaler?: Equaler<T>): AsyncHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncIterable` for the symmetric difference between two [[Queryable]] objects.
 * The result is an `AsyncIterable` containings the elements that exist in only left or right, but not
 * in both.
 *
 * @param left An `AsyncIterable` or `Iterable` object.
 * @param right An `AsyncIterable` or `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function symmetricDifferenceAsync<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncIterable<T>;
export function symmetricDifferenceAsync<T>(left: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, right: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, equaler?: Equaler<T>): AsyncIterable<T> {
    if (!isAsyncIterableObject(left) && !isIterableObject(left)) throw new TypeError("AsyncIterable expected: left");
    if (!isAsyncIterableObject(right) && !isIterableObject(right)) throw new TypeError("AsyncIterable expected: right");
    if (!isUndefined(equaler) && !Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return flowHierarchy(new AsyncSymmetricDifferenceByIterable(left, right, identity, equaler), left, right);
}

class AsyncTapIterable<T> implements AsyncIterable<T> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _callback: (element: T, offset: number) => PromiseLike<void> | void;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, callback: (element: T, offset: number) => PromiseLike<void> | void) {
        this._source = source;
        this._callback = callback;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const source = this._source;
        const callback = this._callback;
        let offset = 0;
        for await (const element of source) {
            const result = callback(element, offset++);
            if (result !== undefined) await result;
            yield element;
        }
    }
}

/**
 * Lazily invokes a callback as each element of the iterable is iterated.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param callback The callback to invoke.
 * @category Subquery
 */
export function tapAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, callback: (element: T, offset: number) => PromiseLike<void> | void): AsyncHierarchyIterable<TNode, T>;
/**
 * Lazily invokes a callback as each element of the iterable is iterated.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param callback The callback to invoke.
 * @category Subquery
 */
export function tapAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, callback: (element: T, offset: number) => PromiseLike<void> | void): AsyncIterable<T>;
export function tapAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, callback: (element: T, offset: number) => PromiseLike<void> | void): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!isFunction(callback)) throw new TypeError("Function expected: callback");
    return flowHierarchy(new AsyncTapIterable(source, callback), source);
}

class AsyncMaterializeIterable<T> implements AsyncIterable<T> {
    private _source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>;
    private _sourceArray?: Promise<readonly T[]>;

    constructor(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>) {
        this._source = source;
    }

    async *[Symbol.asyncIterator]() {
        if (!this._sourceArray) {
            this._sourceArray = toArrayAsync(this._source);
        }
        const sourceArray = await this._sourceArray;
        yield* sourceArray;
    }
}

/**
 * Eagerly evaluate an `AsyncIterable` or `Iterable` object, returning an `AsyncIterable` for the
 * resolved elements of the original sequence.
 *
 * @param source A `AsyncIterable` or `Iterable` object.
 * @category Scalar
 */
export function materializeAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>): AsyncHierarchyIterable<TNode, T>;
/**
 * Eagerly evaluate an `AsyncIterable` or `Iterable` object, returning an `AsyncIterable` for the
 * resolved elements of the original sequence.
 *
 * @param source A `AsyncIterable` or `Iterable` object.
 * @category Scalar
 */
export function materializeAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncIterable<T>;
export function materializeAsync<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncIterable<T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    return flowHierarchy(new AsyncMaterializeIterable(source), source);
}
