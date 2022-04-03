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

import /*#__INLINE__*/ { isFunction, isFunctionOrUndefined, isIterableObject, isNumber, isPositiveFiniteNumber, isUndefined } from "@esfx/internal-guards";
import { Equaler } from "@esfx/equatable";
import { HashSet } from "@esfx/collections-hashset";
import { HashMap } from "@esfx/collections-hashmap";
import { HierarchyIterable } from '@esfx/iter-hierarchy';
import { identity, isDefined } from '@esfx/fn';
import { flowHierarchy } from './internal/utils.js';
import { toHashSet, toArray } from './scalars.js';

class AppendIterable<T> implements Iterable<T> {
    private _source: Iterable<T>;
    private _value: T;

    constructor(source: Iterable<T>, value: T) {
        this._source = source;
        this._value = value;
    }

    *[Symbol.iterator](): Iterator<T> {
        yield* this._source;
        yield this._value;
    }
}

/**
 * Creates an `Iterable` for the elements of `source` with the provided `value` appended to the
 * end.
 *
 * @param source The `Iterable` to append to.
 * @param value The value to append.
 * @category Subquery
 */
export function append<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, value: T): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` for the elements of `source` with the provided `value` appended to the
 * end.
 *
 * @param source The `Iterable` to append to.
 * @param value The value to append.
 * @category Subquery
 */
export function append<T>(source: Iterable<T>, value: T): Iterable<T>;
export function append<T>(source: Iterable<T>, value: T): Iterable<T> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    return flowHierarchy(new AppendIterable(source, value), source);
}

class PrependIterable<T> implements Iterable<T> {
    private _source: Iterable<T>;
    private _value: T;

    constructor(value: T, source: Iterable<T>) {
        this._value = value;
        this._source = source;
    }

    *[Symbol.iterator](): Iterator<T> {
        yield this._value;
        yield* this._source;
    }
}

/**
 * Creates a subquery for the elements of the source with the provided value prepended to the beginning.
 *
 * @param value The value to prepend.
 * @category Subquery
 */
export function prepend<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, value: T): HierarchyIterable<TNode, T>;
/**
 * Creates a subquery for the elements of the source with the provided value prepended to the beginning.
 *
 * @param value The value to prepend.
 * @category Subquery
 */
export function prepend<T>(source: Iterable<T>, value: T): Iterable<T>;
export function prepend<T>(source: Iterable<T>, value: T): Iterable<T> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    return flowHierarchy(new PrependIterable(value, source), source);
}

class ConcatIterable<T> implements Iterable<T> {
    private _left: Iterable<T>;
    private _right: Iterable<T>;

    constructor(left: Iterable<T>, right: Iterable<T>) {
        this._left = left;
        this._right = right;
    }

    *[Symbol.iterator](): Iterator<T> {
        yield* this._left;
        yield* this._right;
    }
}

/**
 * Creates an `Iterable` that concatenates two `Iterable` objects.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @category Subquery
 */
export function concat<TNode, T extends TNode>(left: HierarchyIterable<TNode, T>, right: Iterable<T>): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` that concatenates two `Iterable` objects.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @category Subquery
 */
export function concat<TNode, T extends TNode>(left: Iterable<T>, right: HierarchyIterable<TNode, T>): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` that concatenates two `Iterable` objects.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @category Subquery
 */
export function concat<T>(left: Iterable<T>, right: Iterable<T>): Iterable<T>;
export function concat<T>(left: Iterable<T>, right: Iterable<T>): Iterable<T> {
    if (!isIterableObject(left)) throw new TypeError("Iterable expected: left");
    if (!isIterableObject(right)) throw new TypeError("Iterable expected: right");
    return flowHierarchy(new ConcatIterable(left, right), left, right);
}

class FilterByIterable<T, K> implements Iterable<T> {
    private _source: Iterable<T>;
    private _keySelector: (element: T) => K;
    private _predicate: (key: K, offset: number) => boolean;
    private _invert: boolean;

    constructor(source: Iterable<T>, keySelector: (element: T) => K, predicate: (key: K, offset: number) => boolean, invert: boolean) {
        this._source = source;
        this._keySelector = keySelector;
        this._predicate = predicate;
        this._invert = invert;
    }

    *[Symbol.iterator](): Iterator<T> {
        const keySelector = this._keySelector;
        const predicate = this._predicate;
        const inverted = this._invert;
        let offset = 0;
        for (const element of this._source) {
            let result = predicate(keySelector(element), offset++);
            if (inverted) result = !result;
            if (result) {
                yield element;
            }
        }
    }
}

/**
 * Creates an `Iterable` where the selected key for each element matches the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param predicate A callback used to match each key.
 * @category Subquery
 */
export function filterBy<TNode, T extends TNode, K>(source: HierarchyIterable<TNode, T>, keySelector: (element: T) => K, predicate: (key: K, offset: number) => boolean): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` where the selected key for each element matches the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param predicate A callback used to match each key.
 * @category Subquery
 */
export function filterBy<T, K>(source: Iterable<T>, keySelector: (element: T) => K, predicate: (key: K, offset: number) => boolean): Iterable<T>;
export function filterBy<T, K>(source: Iterable<T>, keySelector: (element: T) => K, predicate: (key: K, offset: number) => boolean): Iterable<T> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return flowHierarchy(new FilterByIterable(source, keySelector, predicate, /*invert*/ false), source);
}

export { filterBy as whereBy };

/**
 * Creates an `Iterable` whose elements match the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function filter<TNode, T extends TNode, U extends T>(source: HierarchyIterable<TNode, T>, predicate: (element: T, offset: number) => element is U): HierarchyIterable<TNode, U>;
/**
 * Creates an `Iterable` whose elements match the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function filter<T, U extends T>(source: Iterable<T>, predicate: (element: T, offset: number) => element is U): Iterable<U>;
/**
 * Creates an `Iterable` whose elements match the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function filter<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, predicate: (element: T, offset: number) => boolean): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` whose elements match the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function filter<T>(source: Iterable<T>, predicate: (element: T, offset: number) => boolean): Iterable<T>;
export function filter<T>(source: Iterable<T>, predicate: (element: T, offset: number) => boolean): Iterable<T> {
    return filterBy(source, identity, predicate);
}

export { filter as where };

/**
 * Creates an `Iterable` whose elements are neither `null` nor `undefined`.
 *
 * @param source An `Iterable` object.
 * @category Subquery
 */
export function filterDefined<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>): HierarchyIterable<TNode, NonNullable<T>>;
/**
 * Creates an `Iterable` whose elements are neither `null` nor `undefined`.
 *
 * @param source An `Iterable` object.
 * @category Subquery
 */
export function filterDefined<T>(source: Iterable<T>): Iterable<NonNullable<T>>;
export function filterDefined<T>(source: Iterable<T>): Iterable<NonNullable<T>> {
    return filterBy(source, identity, isDefined) as Iterable<NonNullable<T>>;
}

export { filterDefined as whereDefined };

/**
 * Creates an `Iterable` where the selected key for each element is neither `null` nor `undefined`.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @category Subquery
 */
export function filterDefinedBy<TNode, T extends TNode, K>(source: HierarchyIterable<TNode, T>, keySelector: (value: T) => K): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` where the selected key for each element is neither `null` nor `undefined`.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @category Subquery
 */
export function filterDefinedBy<T, K>(source: Iterable<T>, keySelector: (value: T) => K): Iterable<T>;
export function filterDefinedBy<T, K>(source: Iterable<T>, keySelector: (value: T) => K): Iterable<T> {
    return filterBy(source, keySelector, isDefined);
}

export { filterDefinedBy as whereDefinedBy };

/**
 * Creates an `Iterable` where the selected key for each element does not match the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param predicate A callback used to match each key.
 * @category Subquery
 */
export function filterNotBy<TNode, T extends TNode, K>(source: HierarchyIterable<TNode, T>, keySelector: (element: T) => K, predicate: (key: K, offset: number) => boolean): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` where the selected key for each element does not match the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param predicate A callback used to match each key.
 * @category Subquery
 */
export function filterNotBy<T, K>(source: Iterable<T>, keySelector: (element: T) => K, predicate: (key: K, offset: number) => boolean): Iterable<T>;
export function filterNotBy<T, K>(source: Iterable<T>, keySelector: (element: T) => K, predicate: (key: K, offset: number) => boolean): Iterable<T> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return flowHierarchy(new FilterByIterable(source, keySelector, predicate, /*invert*/ true), source);
}

export { filterNotBy as whereNotBy };

/**
 * Creates an `Iterable` whose elements do not match the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function filterNot<TNode, T extends TNode, U extends T>(source: HierarchyIterable<TNode, T>, predicate: (element: T, offset: number) => element is U): HierarchyIterable<TNode, U>;
/**
 * Creates an `Iterable` whose elements do not match the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function filterNot<T, U extends T>(source: Iterable<T>, predicate: (element: T, offset: number) => element is U): Iterable<U>;
/**
 * Creates an `Iterable` whose elements do not match the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function filterNot<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, predicate: (element: T, offset: number) => boolean): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` whose elements do not match the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function filterNot<T>(source: Iterable<T>, predicate: (element: T, offset: number) => boolean): Iterable<T>;
export function filterNot<T>(source: Iterable<T>, predicate: (element: T, offset: number) => boolean): Iterable<T> {
    return filterNotBy(source, identity, predicate);
}

export { filterNot as whereNot };

/**
 * Creates an `Iterable` where the selected key for each element is either `null` or `undefined`.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @category Subquery
 */
export function filterNotDefinedBy<TNode, T extends TNode, K>(source: HierarchyIterable<TNode, T>, keySelector: (value: T) => K): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` where the selected key for each element is either `null` or `undefined`.
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @category Subquery
 */
export function filterNotDefinedBy<T, K>(source: Iterable<T>, keySelector: (value: T) => K): Iterable<T>;
export function filterNotDefinedBy<T, K>(source: Iterable<T>, keySelector: (value: T) => K): Iterable<T> {
    return filterNotBy(source, keySelector, isDefined);
}

export { filterNotDefinedBy as whereNotDefinedBy };

class MapIterable<T, U> implements Iterable<U> {
    private _source: Iterable<T>;
    private _selector: (element: T, offset: number) => U;

    constructor(source: Iterable<T>, selector: (element: T, offset: number) => U) {
        this._source = source;
        this._selector = selector;
    }

    *[Symbol.iterator](): Iterator<U> {
        const selector = this._selector;
        let offset = 0;
        for (const element of this._source) {
            yield selector(element, offset++);
        }
    }
}

/**
 * Creates an `Iterable` by applying a callback to each element of a `Iterable`.
 *
 * @param source An `Iterable` object.
 * @param selector A callback used to map each element.
 * @category Subquery
 */
export function map<T, U>(source: Iterable<T>, selector: (element: T, offset: number) => U): Iterable<U> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(selector)) throw new TypeError("Function expected: selector");
    return new MapIterable(source, selector);
}

export { map as select };

class FlatMapIterable<T, U, R> implements Iterable<U | R> {
    private _source: Iterable<T>;
    private _projection: (element: T) => Iterable<U>;
    private _resultSelector?: (element: T, innerElement: U) => R;

    constructor(source: Iterable<T>, projection: (element: T) => Iterable<U>, resultSelector?: (element: T, innerElement: U) => R) {
        this._source = source;
        this._projection = projection;
        this._resultSelector = resultSelector;
    }

    *[Symbol.iterator](): Iterator<U | R> {
        const projection = this._projection;
        const resultSelector = this._resultSelector;
        for (const element of this._source) {
            const inner = projection(element);
            if (resultSelector) {
                for (const innerElement of inner) {
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
 * Creates an `Iterable` that iterates the results of applying a callback to each element of `source`.
 *
 * @param source An `Iterable` object.
 * @param projection A callback used to map each element into an iterable.
 * @category Subquery
 */
export function flatMap<T, U>(source: Iterable<T>, projection: (element: T) => Iterable<U>): Iterable<U>;
/**
 * Creates an `Iterable` that iterates the results of applying a callback to each element of `source`.
 *
 * @param source An `Iterable` object.
 * @param projection A callback used to map each element into an iterable.
 * @param resultSelector A callback used to map an element and one of its projected values into a result.
 * @category Subquery
 */
export function flatMap<T, U, R>(source: Iterable<T>, projection: (element: T) => Iterable<U>, resultSelector: (element: T, innerElement: U) => R): Iterable<R>;
export function flatMap<T, U, R>(source: Iterable<T>, projection: (element: T) => Iterable<U>, resultSelector?: (element: T, innerElement: U) => R): Iterable<U | R> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(projection)) throw new TypeError("Function expected: projection");
    if (!isFunctionOrUndefined(resultSelector)) throw new TypeError("Function expected: resultSelector");
    return new FlatMapIterable(source, projection, resultSelector);
}

export { flatMap as selectMany };

class DropIterable<T> implements Iterable<T> {
    private _source: Iterable<T>;
    private _count: number;

    constructor(source: Iterable<T>, count: number) {
        this._source = source;
        this._count = count;
    }

    *[Symbol.iterator](): Iterator<T> {
        let remaining = this._count;
        if (remaining <= 0) {
            yield* this._source;
        }
        else {
            for (const element of this._source) {
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
 * Creates a subquery containing all elements except the first elements up to the supplied
 * count.
 *
 * @param source An `Iterable` object.
 * @param count The number of elements to skip.
 * @category Subquery
 */
export function drop<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, count: number): HierarchyIterable<TNode, T>;
/**
 * Creates a subquery containing all elements except the first elements up to the supplied
 * count.
 *
 * @param source An `Iterable` object.
 * @param count The number of elements to skip.
 * @category Subquery
 */
export function drop<T>(source: Iterable<T>, count: number): Iterable<T>;
export function drop<T>(source: Iterable<T>, count: number): Iterable<T> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isNumber(count)) throw new TypeError("Number expected: count");
    if (!isPositiveFiniteNumber(count)) throw new RangeError("Argument out of range: count");
    return flowHierarchy(new DropIterable(source, count), source);
}

export { drop as skip };

class DropRightIterable<T> implements Iterable<T> {
    private _source: Iterable<T>;
    private _count: number;

    constructor(source: Iterable<T>, count: number) {
        this._source = source;
        this._count = count;
    }

    *[Symbol.iterator](): Iterator<T> {
        const pending: T[] = [];
        const count = this._count;
        if (count <= 0) {
            yield* this._source;
        }
        else {
            for (const element of this._source) {
                pending.push(element);
                if (pending.length > count) {
                    yield pending.shift()!;
                }
            }
        }
    }
}

/**
 * Creates a subquery containing all elements except the last elements up to the supplied
 * count.
 *
 * @param source An `Iterable` object.
 * @param count The number of elements to skip.
 * @category Subquery
 */
export function dropRight<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, count: number): HierarchyIterable<TNode, T>;
/**
 * Creates a subquery containing all elements except the last elements up to the supplied
 * count.
 *
 * @param source An `Iterable` object.
 * @param count The number of elements to skip.
 * @category Subquery
 */
export function dropRight<T>(source: Iterable<T>, count: number): Iterable<T>;
export function dropRight<T>(source: Iterable<T>, count: number): Iterable<T> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isNumber(count)) throw new TypeError("Number expected: count");
    if (!isPositiveFiniteNumber(count)) throw new RangeError("Argument out of range: count");
    return flowHierarchy(new DropRightIterable(source, count), source);
}

export { dropRight as skipRight };

class DropWhileIterable<T> implements Iterable<T> {
    private _source: Iterable<T>;
    private _predicate: (element: T) => boolean;
    private _invert: boolean;

    constructor(source: Iterable<T>, predicate: (element: T) => boolean, invert: boolean) {
        this._source = source;
        this._predicate = predicate;
        this._invert = invert;
    }

    *[Symbol.iterator](): Iterator<T> {
        const predicate = this._predicate;
        const inverted = this._invert;
        let skipping = true;
        for (const element of this._source) {
            if (skipping) {
                let result = predicate(element);
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
 * Creates a subquery containing all elements except the first elements that match
 * the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function dropWhile<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, predicate: (element: T) => boolean): HierarchyIterable<TNode, T>;
/**
 * Creates a subquery containing all elements except the first elements that match
 * the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function dropWhile<T>(source: Iterable<T>, predicate: (element: T) => boolean): Iterable<T>;
export function dropWhile<T>(source: Iterable<T>, predicate: (element: T) => boolean): Iterable<T> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return flowHierarchy(new DropWhileIterable(source, predicate, /*invert*/ false), source);
}

export { dropWhile as skipWhile };

/**
 * Creates a subquery containing all elements except the first elements that do not match
 * the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function dropUntil<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, predicate: (element: T) => boolean): HierarchyIterable<TNode, T>;
/**
 * Creates a subquery containing all elements except the first elements that do not match
 * the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function dropUntil<T>(source: Iterable<T>, predicate: (element: T) => boolean): Iterable<T>;
export function dropUntil<T>(source: Iterable<T>, predicate: (element: T) => boolean): Iterable<T> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return flowHierarchy(new DropWhileIterable(source, predicate, /*invert*/ true), source);
}

export { dropUntil as skipUntil };

class TakeIterable<T> implements Iterable<T> {
    private _source: Iterable<T>;
    private _count: number;

    constructor(source: Iterable<T>, count: number) {
        this._source = source;
        this._count = count;
    }

    *[Symbol.iterator](): Iterator<T> {
        let remaining = this._count;
        if (remaining > 0) {
            for (const element of this._source) {
                yield element;
                if (--remaining <= 0) {
                    break;
                }
            }
        }
    }
}

/**
 * Creates a subquery containing the first elements up to the supplied
 * count.
 *
 * @param source An `Iterable` object.
 * @param count The number of elements to take.
 * @category Subquery
 */
export function take<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, count: number): HierarchyIterable<TNode, T>;
/**
 * Creates a subquery containing the first elements up to the supplied
 * count.
 *
 * @param source An `Iterable` object.
 * @param count The number of elements to take.
 * @category Subquery
 */
export function take<T>(source: Iterable<T>, count: number): Iterable<T>;
export function take<T>(source: Iterable<T>, count: number): Iterable<T> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isNumber(count)) throw new TypeError("Number expected: count");
    if (!isPositiveFiniteNumber(count)) throw new RangeError("Argument out of range: count");
    return flowHierarchy(new TakeIterable(source, count), source);
}

class TakeRightIterable<T> implements Iterable<T> {
    private _source: Iterable<T>;
    private _count: number;

    constructor(source: Iterable<T>, count: number) {
        this._source = source;
        this._count = count;
    }

    *[Symbol.iterator](): Iterator<T> {
        const count = this._count;
        if (count <= 0) {
            return;
        }
        else {
            const pending: T[] = [];
            for (const element of this._source) {
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
 * Creates a subquery containing the last elements up to the supplied
 * count.
 *
 * @param source An `Iterable` object.
 * @param count The number of elements to take.
 * @category Subquery
 */
export function takeRight<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, count: number): HierarchyIterable<TNode, T>;
/**
 * Creates a subquery containing the last elements up to the supplied
 * count.
 *
 * @param source An `Iterable` object.
 * @param count The number of elements to take.
 * @category Subquery
 */
export function takeRight<T>(source: Iterable<T>, count: number): Iterable<T>;
export function takeRight<T>(source: Iterable<T>, count: number): Iterable<T> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isNumber(count)) throw new TypeError("Number expected: count");
    if (!isPositiveFiniteNumber(count)) throw new RangeError("Argument out of range: count");
    return flowHierarchy(new TakeRightIterable(source, count), source);
}

class TakeWhileIterable<T> implements Iterable<T> {
    private _source: Iterable<T>;
    private _predicate: (element: T) => boolean;
    private _invert: boolean;

    constructor(source: Iterable<T>, predicate: (element: T) => boolean, invert: boolean) {
        this._source = source;
        this._predicate = predicate;
        this._invert = invert;
    }

    *[Symbol.iterator](): Iterator<T> {
        const predicate = this._predicate;
        const inverted = this._invert;
        for (const element of this._source) {
            let result = predicate(element);
            if (inverted) result = !result;
            if (!result) {
                break;
            }
            yield element;
        }
    }
}

/**
 * Creates a subquery containing the first elements that match the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function takeWhile<TNode, T extends TNode, U extends T>(source: HierarchyIterable<TNode, T>, predicate: (element: T) => element is U): HierarchyIterable<TNode, U>;
/**
 * Creates a subquery containing the first elements that match the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function takeWhile<T, U extends T>(source: Iterable<T>, predicate: (element: T) => element is U): Iterable<U>;
/**
 * Creates a subquery containing the first elements that match the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function takeWhile<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, predicate: (element: T) => boolean): HierarchyIterable<TNode, T>;
/**
 * Creates a subquery containing the first elements that match the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function takeWhile<T>(source: Iterable<T>, predicate: (element: T) => boolean): Iterable<T>;
export function takeWhile<T>(source: Iterable<T>, predicate: (element: T) => boolean): Iterable<T> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return flowHierarchy(new TakeWhileIterable(source, predicate, /*invert*/ false), source);
}

/**
 * Creates a subquery containing the first elements that do not match the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function takeUntil<TNode, T extends TNode, U extends T>(source: HierarchyIterable<TNode, T>, predicate: (element: T) => element is U): HierarchyIterable<TNode, U>;
/**
 * Creates a subquery containing the first elements that do not match the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function takeUntil<T, U extends T>(source: Iterable<T>, predicate: (element: T) => element is U): Iterable<U>;
/**
 * Creates a subquery containing the first elements that do not match the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function takeUntil<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, predicate: (element: T) => boolean): HierarchyIterable<TNode, T>;
/**
 * Creates a subquery containing the first elements that do not match the supplied predicate.
 *
 * @param source An `Iterable` object.
 * @param predicate A callback used to match each element.
 * @category Subquery
 */
export function takeUntil<T>(source: Iterable<T>, predicate: (element: T) => boolean): Iterable<T>;
export function takeUntil<T>(source: Iterable<T>, predicate: (element: T) => boolean): Iterable<T> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return flowHierarchy(new TakeWhileIterable(source, predicate, /*invert*/ true), source);
}

class IntersectByIterable<T, K> implements Iterable<T> {
    private _left: Iterable<T>;
    private _right: Iterable<T>;
    private _keySelector: (element: T) => K;
    private _keyEqualer?: Equaler<K>;

    constructor(left: Iterable<T>, right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>) {
        this._left = left;
        this._right = right;
        this._keySelector = keySelector;
        this._keyEqualer = keyEqualer;
    }

    *[Symbol.iterator](): Iterator<T> {
        const keySelector = this._keySelector;
        const set = toHashSet(this._right, keySelector, this._keyEqualer);
        if (set.size <= 0) {
            return;
        }
        for (const element of this._left) {
            if (set.delete(keySelector(element))) {
                yield element;
            }
        }
    }
}

/**
 * Creates an `Iterable` for the set intersection of two `Iterable` objects, where set identity is determined by the selected key.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function intersectBy<TNode, T extends TNode, K>(left: HierarchyIterable<TNode, T>, right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` for the set intersection of two `Iterable` objects, where set identity is determined by the selected key.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function intersectBy<TNode, T extends TNode, K>(left: Iterable<T>, right: HierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` for the set intersection of two `Iterable` objects, where set identity is determined by the selected key.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function intersectBy<T, K>(left: Iterable<T>, right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Iterable<T>;
export function intersectBy<T, K>(left: Iterable<T>, right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Iterable<T> {
    if (!isIterableObject(left)) throw new TypeError("Iterable expected: left");
    if (!isIterableObject(right)) throw new TypeError("Iterable expected: right");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isUndefined(keyEqualer) && !Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: keyEqualer");
    return flowHierarchy(new IntersectByIterable(left, right, keySelector, keyEqualer), left, right);
}

/**
 * Creates an `Iterable` for the set intersection of two `Iterable` objects.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function intersect<TNode, T extends TNode>(left: HierarchyIterable<TNode, T>, right: Iterable<T>, equaler?: Equaler<T>): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` for the set intersection of two `Iterable` objects.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function intersect<TNode, T extends TNode>(left: Iterable<T>, right: HierarchyIterable<TNode, T>, equaler?: Equaler<T>): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` for the set intersection of two `Iterable` objects.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function intersect<T>(left: Iterable<T>, right: Iterable<T>, equaler?: Equaler<T>): Iterable<T>;
export function intersect<T>(left: Iterable<T>, right: Iterable<T>, equaler?: Equaler<T>): Iterable<T> {
    if (!isIterableObject(left)) throw new TypeError("Iterable expected: left");
    if (!isIterableObject(right)) throw new TypeError("Iterable expected: right");
    if (!isUndefined(equaler) && !Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return flowHierarchy(new IntersectByIterable(left, right, identity, equaler), left, right);
}

class UnionByIterable<T, K> implements Iterable<T> {
    private _left: Iterable<T>;
    private _right: Iterable<T>;
    private _keySelector: (element: T) => K;
    private _keyEqualer?: Equaler<K>;

    constructor(left: Iterable<T>, right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>) {
        this._left = left;
        this._right = right;
        this._keySelector = keySelector;
        this._keyEqualer = keyEqualer;
    }

    *[Symbol.iterator](): Iterator<T> {
        const keySelector = this._keySelector;
        const set = new HashSet<K>(this._keyEqualer);
        for (const element of this._left) {
            if (set.tryAdd(keySelector(element))) {
                yield element;
            }
        }
        for (const element of this._right) {
            if (set.tryAdd(keySelector(element))) {
                yield element;
            }
        }
    }
}

/**
 * Creates a subquery for the set union of two `Iterable` objects, where set identity is determined by the selected key.
 *
 * @param left A `Iterable` value.
 * @param right A `Iterable` value.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function unionBy<TNode, T extends TNode, K>(left: HierarchyIterable<TNode, T>, right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): HierarchyIterable<TNode, T>;
/**
 * Creates a subquery for the set union of two `Iterable` objects, where set identity is determined by the selected key.
 *
 * @param left A `Iterable` value.
 * @param right A `Iterable` value.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function unionBy<TNode, T extends TNode, K>(left: Iterable<T>, right: HierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): HierarchyIterable<TNode, T>;
/**
 * Creates a subquery for the set union of two `Iterable` objects, where set identity is determined by the selected key.
 *
 * @param left A `Iterable` value.
 * @param right A `Iterable` value.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function unionBy<T, K>(left: Iterable<T>, right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Iterable<T>;
export function unionBy<T, K>(left: Iterable<T>, right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Iterable<T> {
    if (!isIterableObject(left)) throw new TypeError("Iterable expected: left");
    if (!isIterableObject(right)) throw new TypeError("Iterable expected: right");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isUndefined(keyEqualer) && !Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: keyEqualer");
    return flowHierarchy(new UnionByIterable(left, right, keySelector, keyEqualer), left, right);
}

/**
 * Creates a subquery for the set union of two `Iterable` objects.
 *
 * @param left A `Iterable` value.
 * @param right A `Iterable` value.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function union<TNode, T extends TNode>(left: HierarchyIterable<TNode, T>, right: Iterable<T>, equaler?: Equaler<T>): HierarchyIterable<TNode, T>;
/**
 * Creates a subquery for the set union of two `Iterable` objects.
 *
 * @param left A `Iterable` value.
 * @param right A `Iterable` value.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function union<TNode, T extends TNode>(left: Iterable<T>, right: HierarchyIterable<TNode, T>, equaler?: Equaler<T>): HierarchyIterable<TNode, T>;
/**
 * Creates a subquery for the set union of two `Iterable` objects.
 *
 * @param left A `Iterable` value.
 * @param right A `Iterable` value.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function union<T>(left: Iterable<T>, right: Iterable<T>, equaler?: Equaler<T>): Iterable<T>;
export function union<T>(left: Iterable<T>, right: Iterable<T>, equaler?: Equaler<T>): Iterable<T> {
    if (!isIterableObject(left)) throw new TypeError("Iterable expected: left");
    if (!isIterableObject(right)) throw new TypeError("Iterable expected: right");
    if (!isUndefined(equaler) && !Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return flowHierarchy(new UnionByIterable(left, right, identity, equaler), left, right);
}

class ExceptByIterable<T, K> implements Iterable<T> {
    private _left: Iterable<T>;
    private _right: Iterable<T>;
    private _keySelector: (element: T) => K;
    private _keyEqualer?: Equaler<K>;

    constructor(left: Iterable<T>, right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>) {
        this._left = left;
        this._right = right;
        this._keySelector = keySelector;
        this._keyEqualer = keyEqualer;
    }

    *[Symbol.iterator](): Iterator<T> {
        const keySelector = this._keySelector;
        const set = toHashSet(this._right, keySelector, this._keyEqualer!);
        for (const element of this._left) {
            if (set.tryAdd(keySelector(element))) {
                yield element;
            }
        }
    }
}

/**
 * Creates an `Iterable` for the set difference between two `Iterable` objects, where set identity is determined by the selected key.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function exceptBy<TNode, T extends TNode, K>(left: HierarchyIterable<TNode, T>, right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` for the set difference between two `Iterable` objects, where set identity is determined by the selected key.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function exceptBy<T, K>(left: Iterable<T>, right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Iterable<T>;
export function exceptBy<T, K>(left: Iterable<T>, right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Iterable<T> {
    if (!isIterableObject(left)) throw new TypeError("Iterable expected: left");
    if (!isIterableObject(right)) throw new TypeError("Iterable expected: right");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isUndefined(keyEqualer) && !Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: keyEqualer");
    return flowHierarchy(new ExceptByIterable(left, right, keySelector, keyEqualer), left);
}

export { exceptBy as relativeComplementBy };

/**
 * Creates an `Iterable` for the set difference between two `Iterable` objects.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function except<TNode, T extends TNode>(left: HierarchyIterable<TNode, T>, right: Iterable<T>, equaler?: Equaler<T>): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` for the set difference between two `Iterable` objects.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function except<T>(left: Iterable<T>, right: Iterable<T>, equaler?: Equaler<T>): Iterable<T>;
export function except<T>(left: Iterable<T>, right: Iterable<T>, equaler?: Equaler<T>): Iterable<T> {
    if (!isIterableObject(left)) throw new TypeError("Iterable expected: left");
    if (!isIterableObject(right)) throw new TypeError("Iterable expected: right");
    if (!isUndefined(equaler) && !Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return flowHierarchy(new ExceptByIterable(left, right, identity, equaler), left);
}

export { except as relativeComplement };

/**
 * Creates an `Iterable` with every instance of the specified value removed.
 *
 * @param source An `Iterable` object.
 * @param values The values to exclude.
 * @category Subquery
 */
export function exclude<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, ...values: T[]): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` with every instance of the specified value removed.
 *
 * @param source An `Iterable` object.
 * @param values The values to exclude.
 * @category Subquery
 */
export function exclude<T>(source: Iterable<T>, ...values: T[]): Iterable<T>;
export function exclude<T>(source: Iterable<T>, ...values: T[]): Iterable<T> {
    return exceptBy(source, values, identity);
}

class DistinctByIterable<T, K> implements Iterable<T> {
    private _source: Iterable<T>;
    private _keySelector: (value: T) => K;
    private _keyEqualer?: Equaler<K>;

    constructor(source: Iterable<T>, keySelector: (value: T) => K, keyEqualer?: Equaler<K>) {
        this._source = source;
        this._keySelector = keySelector;
        this._keyEqualer = keyEqualer;
    }

    *[Symbol.iterator](): Iterator<T> {
        const set = this._keyEqualer ? new HashSet<K>(this._keyEqualer) : new Set<K>();
        const keySelector = this._keySelector;
        for (const element of this._source) {
            const key = keySelector(element);
            if (!set.has(key)) {
                set.add(key);
                yield element;
            }
        }
    }
}

/**
 * Creates an `Iterable` for the distinct elements of `source`.
 * @category Subquery
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key to determine uniqueness.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 */
export function distinctBy<TNode, T extends TNode, K>(source: HierarchyIterable<TNode, T>, keySelector: (value: T) => K, keyEqualer?: Equaler<K>): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` for the distinct elements of `source`.
 * @category Subquery
 *
 * @param source An `Iterable` object.
 * @param keySelector A callback used to select the key to determine uniqueness.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 */
export function distinctBy<T, K>(source: Iterable<T>, keySelector: (value: T) => K, keyEqualer?: Equaler<K>): Iterable<T>;
export function distinctBy<T, K>(source: Iterable<T>, keySelector: (value: T) => K, keyEqualer?: Equaler<K>): Iterable<T> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isUndefined(keyEqualer) && !Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: keyEqualer");
    return flowHierarchy(new DistinctByIterable(source, keySelector, keyEqualer), source);
}

/**
 * Creates an `Iterable` for the distinct elements of `source`.
 * @category Subquery
 *
 * @param source An `Iterable` object.
 * @param equaler An `Equaler` object used to compare element equality.
 */
export function distinct<TNode, T extends TNode, K>(source: HierarchyIterable<TNode, T>, keyEqualer?: Equaler<K>): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` for the distinct elements of `source`.
 * @category Subquery
 *
 * @param source An `Iterable` object.
 * @param equaler An `Equaler` object used to compare element equality.
 */
export function distinct<T>(source: Iterable<T>, equaler?: Equaler<T>): Iterable<T>;
export function distinct<T>(source: Iterable<T>, equaler?: Equaler<T>): Iterable<T> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isUndefined(equaler) && !Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return flowHierarchy(new DistinctByIterable(source, identity, equaler), source);
}

class DefaultIfEmptyIterable<T> implements Iterable<T> {
    private _source: Iterable<T>;
    private _defaultValue: T;

    constructor(source: Iterable<T>, defaultValue: T) {
        this._source = source;
        this._defaultValue = defaultValue;
    }

    *[Symbol.iterator](): Iterator<T> {
        const source = this._source;
        const defaultValue = this._defaultValue;
        let hasElements = false;
        for (const value of source) {
            hasElements = true;
            yield value;
        }
        if (!hasElements) {
            yield defaultValue;
        }
    }
}

/**
 * Creates an `Iterable` that contains the provided default value if `source`
 * contains no elements.
 *
 * @param source An `Iterable` object.
 * @param defaultValue The default value.
 * @category Subquery
 */
export function defaultIfEmpty<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, defaultValue: T): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` that contains the provided default value if `source`
 * contains no elements.
 *
 * @param source An `Iterable` object.
 * @param defaultValue The default value.
 * @category Subquery
 */
export function defaultIfEmpty<T>(source: Iterable<T>, defaultValue: T): Iterable<T>;
export function defaultIfEmpty<T>(source: Iterable<T>, defaultValue: T): Iterable<T> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    return flowHierarchy(new DefaultIfEmptyIterable(source, defaultValue), source);
}

class PatchIterable<T> implements Iterable<T> {
    private _source: Iterable<T>;
    private _start: number;
    private _skipCount: number;
    private _range: Iterable<T> | undefined;

    constructor(source: Iterable<T>, start: number, skipCount: number, range: Iterable<T> | undefined) {
        this._source = source;
        this._start = start;
        this._skipCount = skipCount;
        this._range = range;
    }

    *[Symbol.iterator](): Iterator<T> {
        const start = this._start;
        const skipCount = this._skipCount;
        let offset = 0;
        let hasYieldedRange = false;
        for (const value of this._source) {
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
 * Creates an `Iterable` for the elements of `source` with the provided range
 * patched into the results.
 *
 * @param source The `Iterable` to patch.
 * @param start The offset at which to patch the range.
 * @param skipCount The number of elements to skip from start.
 * @param range The range to patch into the result.
 * @category Subquery
 */
export function patch<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, start: number, skipCount?: number, range?: Iterable<T>): HierarchyIterable<TNode, T>;
/**
 * Creates an `Iterable` for the elements of `source` with the provided range
 * patched into the results.
 *
 * @param source The `Iterable` to patch.
 * @param start The offset at which to patch the range.
 * @param skipCount The number of elements to skip from start.
 * @param range The range to patch into the result.
 * @category Subquery
 */
export function patch<T>(source: Iterable<T>, start: number, skipCount?: number, range?: Iterable<T>): Iterable<T>;
export function patch<T>(source: Iterable<T>, start: number, skipCount: number = 0, range?: Iterable<T>): Iterable<T> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isNumber(start)) throw new TypeError("Number expected: start");
    if (!isNumber(skipCount)) throw new TypeError("Number expected: skipCount");
    if (!isUndefined(range) && !isIterableObject(range)) throw new TypeError("Iterable expected: range");
    if (!isPositiveFiniteNumber(start)) throw new RangeError("Argument out of range: start");
    if (!isPositiveFiniteNumber(skipCount)) throw new RangeError("Argument out of range: skipCount");
    return flowHierarchy(new PatchIterable(source, start, skipCount, range), source);
}

class ScanIterable<T, U> implements Iterable<T | U> {
    private _source: Iterable<T>;
    private _accumulator: (current: T | U, element: T, offset: number) => T | U;
    private _isSeeded: boolean;
    private _seed: T | U | undefined;

    constructor(source: Iterable<T>, accumulator: (current: T | U, element: T, offset: number) => T | U, isSeeded: boolean, seed: T | U | undefined) {
        this._source = source;
        this._accumulator = accumulator;
        this._isSeeded = isSeeded;
        this._seed = seed;
    }

    *[Symbol.iterator](): Iterator<T | U> {
        const accumulator = this._accumulator;
        let hasCurrent = this._isSeeded;
        let current = this._seed;
        let offset = 0;
        for (const value of this._source) {
            if (!hasCurrent) {
                current = value;
                hasCurrent = true;
            }
            else {
                current = accumulator(current!, value, offset);
                yield current;
            }
            offset++;
        }
    }
}

/**
 * Creates a subquery containing the cumulative results of applying the provided callback to each element.
 *
 * @param source An `Iterable` object.
 * @param accumulator The callback used to compute each result.
 * @category Subquery
 */
export function scan<T>(source: Iterable<T>, accumulator: (current: T, element: T, offset: number) => T): Iterable<T>;
/**
 * Creates a subquery containing the cumulative results of applying the provided callback to each element.
 *
 * @param source An `Iterable` object.
 * @param accumulator The callback used to compute each result.
 * @param seed An optional seed value.
 * @category Subquery
 */
export function scan<T, U>(source: Iterable<T>, accumulator: (current: U, element: T, offset: number) => U, seed: U): Iterable<U>;
export function scan<T, U>(source: Iterable<T>, accumulator: (current: T | U, element: T, offset: number) => T | U, seed?: T | U): Iterable<T | U> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(accumulator)) throw new TypeError("Function expected: accumulator");
    return new ScanIterable<T, U>(source, accumulator, arguments.length > 2, seed!);
}

class ScanRightIterable<T, U> implements Iterable<T | U> {
    private _source: Iterable<T>;
    private _accumulator: (current: T | U, element: T, offset: number) => T | U;
    private _isSeeded: boolean;
    private _seed: T | U | undefined;

    constructor(source: Iterable<T>, accumulator: (current: T | U, element: T, offset: number) => T | U, isSeeded: boolean, seed: T | U | undefined) {
        this._source = source;
        this._accumulator = accumulator;
        this._isSeeded = isSeeded;
        this._seed = seed;
    }

    *[Symbol.iterator](): Iterator<T | U> {
        const source = toArray(this._source);
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
            current = accumulator(current!, value, offset);
            yield current;
        }
    }
}

/**
 * Creates a subquery containing the cumulative results of applying the provided callback to each element in reverse.
 *
 * @param source An `Iterable` object.
 * @param accumulator The callback used to compute each result.
 * @category Subquery
 */
export function scanRight<T>(source: Iterable<T>, accumulator: (current: T, element: T, offset: number) => T): Iterable<T>;
/**
 * Creates a subquery containing the cumulative results of applying the provided callback to each element in reverse.
 *
 * @param source An `Iterable` object.
 * @param accumulator The callback used to compute each result.
 * @param seed An optional seed value.
 * @category Subquery
 */
export function scanRight<T, U>(source: Iterable<T>, accumulator: (current: U, element: T, offset: number) => U, seed: U): Iterable<U>;
export function scanRight<T, U>(source: Iterable<T>, accumulator: (current: T | U, element: T, offset: number) => T | U, seed?: T | U): Iterable<T | U> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(accumulator)) throw new TypeError("Function expected: accumulator");
    return new ScanRightIterable<T, U>(source, accumulator, arguments.length > 2, seed);
}

class SymmetricDifferenceByIterable<T, K> implements Iterable<T> {
    private _left: Iterable<T>;
    private _right: Iterable<T>;
    private _keySelector: (element: T) => K;
    private _keyEqualer?: Equaler<K>;

    constructor(left: Iterable<T>, right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>) {
        this._left = left;
        this._right = right;
        this._keySelector = keySelector;
        this._keyEqualer = keyEqualer;
    }

    *[Symbol.iterator](): Iterator<T> {
        const keySelector = this._keySelector;
        const rightKeys = new HashSet<K>(this._keyEqualer);
        const right = new HashMap<K, T>(this._keyEqualer);
        for (const element of this._right) {
            const key = keySelector(element);
            if (rightKeys.tryAdd(key)) {
                right.set(key, element);
            }
        }
        const set = new HashSet<K>(this._keyEqualer);
        for (const element of this._left) {
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
 * Creates a subquery for the symmetric difference between two `Iterable` objects, where set identity is determined by the selected key.
 * The result is an `Iterable` containings the elements that exist in only left or right, but not
 * in both.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function symmetricDifferenceBy<TNode, T extends TNode, K>(left: HierarchyIterable<TNode, T>, right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): HierarchyIterable<TNode, T>;
/**
 * Creates a subquery for the symmetric difference between two `Iterable` objects, where set identity is determined by the selected key.
 * The result is an `Iterable` containings the elements that exist in only left or right, but not
 * in both.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function symmetricDifferenceBy<TNode, T extends TNode, K>(left: Iterable<T>, right: HierarchyIterable<TNode, T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): HierarchyIterable<TNode, T>;
/**
 * Creates a subquery for the symmetric difference between two `Iterable` objects, where set identity is determined by the selected key.
 * The result is an `Iterable` containings the elements that exist in only left or right, but not
 * in both.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param keySelector A callback used to select the key for each element.
 * @param keyEqualer An `Equaler` object used to compare key equality.
 * @category Subquery
 */
export function symmetricDifferenceBy<T, K>(left: Iterable<T>, right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Iterable<T>;
export function symmetricDifferenceBy<T, K>(left: Iterable<T>, right: Iterable<T>, keySelector: (element: T) => K, keyEqualer?: Equaler<K>): Iterable<T> {
    if (!isIterableObject(left)) throw new TypeError("Iterable expected: left");
    if (!isIterableObject(right)) throw new TypeError("Iterable expected: right");
    if (!isFunction(keySelector)) throw new TypeError("Function expected: keySelector");
    if (!isUndefined(keyEqualer) && !Equaler.hasInstance(keyEqualer)) throw new TypeError("Equaler expected: keyEqualer");
    return flowHierarchy(new SymmetricDifferenceByIterable(left, right, keySelector, keyEqualer), left, right);
}

/**
 * Creates a subquery for the symmetric difference between two `Iterable` objects.
 * The result is an `Iterable` containings the elements that exist in only left or right, but not
 * in both.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function symmetricDifference<TNode, T extends TNode>(left: HierarchyIterable<TNode, T>, right: Iterable<T>, equaler?: Equaler<T>): HierarchyIterable<TNode, T>;
/**
 * Creates a subquery for the symmetric difference between two `Iterable` objects.
 * The result is an `Iterable` containings the elements that exist in only left or right, but not
 * in both.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function symmetricDifference<TNode, T extends TNode>(left: Iterable<T>, right: HierarchyIterable<TNode, T>, equaler?: Equaler<T>): HierarchyIterable<TNode, T>;
/**
 * Creates a subquery for the symmetric difference between two `Iterable` objects.
 * The result is an `Iterable` containings the elements that exist in only left or right, but not
 * in both.
 *
 * @param left An `Iterable` object.
 * @param right An `Iterable` object.
 * @param equaler An `Equaler` object used to compare equality.
 * @category Subquery
 */
export function symmetricDifference<T>(left: Iterable<T>, right: Iterable<T>, equaler?: Equaler<T>): Iterable<T>;
export function symmetricDifference<T>(left: Iterable<T>, right: Iterable<T>, equaler?: Equaler<T>): Iterable<T> {
    if (!isIterableObject(left)) throw new TypeError("Iterable expected: left");
    if (!isIterableObject(right)) throw new TypeError("Iterable expected: right");
    if (!isUndefined(equaler) && !Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return flowHierarchy(new SymmetricDifferenceByIterable(left, right, identity, equaler), left, right);
}

class TapIterable<T> implements Iterable<T> {
    private _source: Iterable<T>;
    private _callback: (element: T, offset: number) => void;

    constructor(source: Iterable<T>, callback: (element: T, offset: number) => void) {
        this._source = source;
        this._callback = callback;
    }

    *[Symbol.iterator](): Iterator<T> {
        const source = this._source;
        const callback = this._callback;
        let offset = 0;
        for (const element of source) {
            callback(element, offset++);
            yield element;
        }
    }
}

/**
 * Lazily invokes a callback as each element of the iterable is iterated.
 *
 * @param source A `Iterable` object.
 * @param callback The callback to invoke.
 * @category Subquery
 */
export function tap<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, callback: (element: T, offset: number) => void): HierarchyIterable<TNode, T>;
/**
 * Lazily invokes a callback as each element of the iterable is iterated.
 *
 * @param source A `Iterable` object.
 * @param callback The callback to invoke.
 * @category Subquery
 */
export function tap<T>(source: Iterable<T>, callback: (element: T, offset: number) => void): Iterable<T>;
export function tap<T>(source: Iterable<T>, callback: (element: T, offset: number) => void): Iterable<T> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    if (!isFunction(callback)) throw new TypeError("Iterable expected: callback");
    return flowHierarchy(new TapIterable(source, callback), source);
}

class MaterializeIterable<T> implements Iterable<T> {
    private _source: readonly T[];

    constructor(source: Iterable<T>) {
        this._source = [...source];
    }

    [Symbol.iterator]() {
        return this._source[Symbol.iterator]();
    }
}

/**
 * Eagerly evaluate the `Iterable`, returning a new `Iterable`.
 * @category Subquery
 */
export function materialize<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>): HierarchyIterable<TNode, T>;
export function materialize<T>(source: Iterable<T>): Iterable<T>;
export function materialize<T>(source: Iterable<T>): Iterable<T> {
    if (!isIterableObject(source)) throw new TypeError("Iterable expected: source");
    return flowHierarchy(new MaterializeIterable(source), source);
}
