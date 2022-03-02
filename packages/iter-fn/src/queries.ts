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

import /*#__INLINE__*/ { isBoolean, isFunction, isIterator, isNumber, isPositiveFiniteNumber, isPositiveNonZeroFiniteNumber } from "@esfx/internal-guards";

class EmptyIterable<T> implements Iterable<T> {
    *[Symbol.iterator](): Iterator<T> {
    }
}

/**
 * Creates an `Iterable` with no elements.
 * @category Query
 */
export function empty<T>(): Iterable<T> {
    return new EmptyIterable<T>();
}

export interface ConsumeOptions {
    /** Indicates whether iterated elements should be cached for subsequent iterations. */
    cacheElements?: boolean;

    /** Indicates whether to leave the iterator open when the iterable returns. */
    leaveOpen?: boolean;
}

class ConsumeIterable<T> implements Iterable<T> {
    private _iterator: Iterator<T> | undefined;
    private _cache?: T[];
    private _leaveOpen: boolean;

    constructor(iterator: Iterator<T>, cacheElements: boolean, leaveOpen: boolean) {
        this._iterator = iterator;
        this._cache = cacheElements ? [] : undefined;
        this._leaveOpen = leaveOpen;
    }

    *[Symbol.iterator]() {
        let offset = 0;
        try {
            for (;;) {
                if (this._cache && offset < this._cache.length) {
                    yield this._cache[offset++];
                    continue;
                }
                else if (this._iterator) {
                    const { done, value } = this._iterator.next();
                    if (!done) {
                        if (this._cache) this._cache.push(value);
                        yield value;
                        offset++;
                        continue;
                    }
                    this._iterator = undefined;
                }
                return;
            }
        }
        finally {
            if (!this._leaveOpen) {
                this._iterator?.return?.();
            }
        }
    }
}

/**
 * Creates an `Iterable` that, when iterated, consumes the provided `Iterator`.
 *
 * @param iterator An `Iterator` object.
 * @category Query
 */
export function consume<T>(iterator: Iterator<T>, options?: ConsumeOptions): Iterable<T> {
    const cacheElements = options?.cacheElements ?? false;
    const leaveOpen = options?.leaveOpen ?? false;
    if (!isIterator(iterator)) throw new TypeError("Iterator expected: iterator");
    if (!isBoolean(cacheElements)) throw new TypeError("Boolean expected: options.cacheElements");
    if (!isBoolean(leaveOpen)) throw new TypeError("Boolean expected: options.leaveOpen");
    return new ConsumeIterable(iterator, cacheElements, leaveOpen);
}

class ContinuousIterable<T> implements Iterable<T> {
    private _value: T;

    constructor(value: T) {
        this._value = value;
    }

    *[Symbol.iterator](): Iterator<T> {
        const value = this._value;
        for (;;) {
            yield value;
        }
    }
}

/**
 * Creates an `Iterable` that repeats the provided value forever.
 *
 * @param value The value for each element of the `Iterable`.
 * @category Query
 */
export function continuous<T>(value: T): Iterable<T> {
    return new ContinuousIterable(value);
}

class GenerateIterable<T> implements Iterable<T> {
    private _count: number;
    private _generator: (offset: number) => T;

    constructor(count: number, generator: (offset: number) => T) {
        this._count = count;
        this._generator = generator;
    }

    *[Symbol.iterator](): Iterator<T> {
        const count = this._count;
        const generator = this._generator;
        for (let i = 0; i < count; i++) {
            yield generator(i);
        }
    }
}

/**
 * Creates an `Iterable` whose values are provided by a callback executed a provided number of
 * times.
 *
 * @param count The number of times to execute the callback.
 * @param generator The callback to execute.
 * @category Query
 */
export function generate<T>(count: number, generator: (offset: number) => T): Iterable<T> {
    if (!isNumber(count)) throw new TypeError("Number expected: count");
    if (!isFunction(generator)) throw new TypeError("Function expected: generator");
    if (!isPositiveFiniteNumber(count)) throw new RangeError("Argument out of range: count");
    return new GenerateIterable(count, generator);
}

class OnceIterable<T> implements Iterable<T> {
    private _value: T;

    constructor(value: T) {
        this._value = value;
    }

    *[Symbol.iterator](): Iterator<T> {
        yield this._value;
    }
}

/**
 * Creates an `Iterable` over a single element.
 *
 * @param value The only element for the `Iterable`.
 * @category Query
 */
export function once<T>(value: T): Iterable<T> {
    return new OnceIterable(value);
}

class RepeatIterable<T> implements Iterable<T> {
    private _value: T;
    private _count: number;

    constructor(value: T, count: number) {
        this._value = value;
        this._count = count;
    }

    *[Symbol.iterator](): Iterator<T> {
        const value = this._value;
        for (let count = this._count; count > 0; --count) {
            yield value;
        }
    }
}
/**
 * Creates an Iterable for a value repeated a provided number of times.
 *
 * @param value The value for each element of the Iterable.
 * @param count The number of times to repeat the value.
 * @category Query
 */
export function repeat<T>(value: T, count: number): Iterable<T> {
    if (!isNumber(count)) throw new TypeError("Number expected: count");
    if (!isPositiveFiniteNumber(count)) throw new RangeError("Argument out of range: count");
    return new RepeatIterable(value, count);
}

class RangeIterable implements Iterable<number> {
    private _start: number;
    private _end: number;
    private _increment: number;

    constructor(start: number, end: number, increment: number) {
        this._start = start;
        this._end = end;
        this._increment = increment;
    }

    *[Symbol.iterator](): Iterator<number> {
        const start = this._start;
        const end = this._end;
        const increment = this._increment;
        if (start <= end) {
            for (let i = start; i <= end; i += increment) {
                yield i;
            }
        }
        else {
            for (let i = start; i >= end; i -= increment) {
                yield i;
            }
        }
    }
}

/**
 * Creates an `Iterable` over a range of numbers.
 *
 * @param start The starting number of the range.
 * @param end The ending number of the range.
 * @param increment The amount by which to change between each itereated value.
 * @category Query
 */
export function range(start: number, end: number, increment: number = 1): Iterable<number> {
    if (!isNumber(start)) throw new TypeError("Number expected: start");
    if (!isNumber(end)) throw new TypeError("Number expected: end");
    if (!isNumber(increment)) throw new TypeError("Number expected: increment");
    if (!isFinite(start)) throw new RangeError("Argument out of range: start");
    if (!isFinite(end)) throw new RangeError("Argument out of range: end");
    if (!isPositiveNonZeroFiniteNumber(increment)) throw new RangeError("Argument out of range: increment");
    return new RangeIterable(start, end, increment);
}
