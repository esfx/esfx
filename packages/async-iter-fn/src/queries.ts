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

class AsyncEmptyIterable<T> implements AsyncIterable<T> {
    async *[Symbol.asyncIterator](): AsyncIterator<T> {
    }
}

/**
 * Creates an `AsyncIterable` with no elements.
 * @category Query
 */
export function emptyAsync<T>(): AsyncIterable<T> {
    return new AsyncEmptyIterable<T>();
}

class AsyncConsumeIterable<T> implements AsyncIterable<T> {
    private _iterator: AsyncIterator<T> | undefined;
    private _cache?: T[];
    private _leaveOpen: boolean;
    
    constructor(iterator: AsyncIterator<T>, cacheElements: boolean, leaveOpen: boolean) {
        this._iterator = iterator;
        this._cache = cacheElements ? [] : undefined;
        this._leaveOpen = leaveOpen;
    }
    
    async *[Symbol.asyncIterator]() {
        let offset = 0;
        try {
            for (;;) {
                if (this._cache && offset < this._cache.length) {
                    yield this._cache[offset++];
                    continue;
                }
                else if (this._iterator) {
                    const { done, value } = await this._iterator.next();
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
                await this._iterator?.return?.();
            }
        }
    }
}

export interface ConsumeAsyncOptions {
    /** Indicates whether iterated elements should be cached for subsequent iterations. */
    cacheElements?: boolean;
    /** Indicates whether to leave the iterator open when the iterable returns. */
    leaveOpen?: boolean;
}

/**
 * Creates an [[AsyncIterable]] that, when iterated, consumes the provided [[AsyncIterator]].
 *
 * @param iterator An [[AsyncIterator]] object.
 * @category Query
 */
export function consumeAsync<T>(iterator: AsyncIterator<T>, { cacheElements = false, leaveOpen = false }: ConsumeAsyncOptions = {}): AsyncIterable<T> {
    assert.mustBeIterator(iterator, "iterator");
    assert.mustBeBoolean(cacheElements, "cacheElements");
    return new AsyncConsumeIterable(iterator, cacheElements, leaveOpen);
}

class AsyncContinuousIterable<T> implements AsyncIterable<T> {
    private _value: PromiseLike<T> | T;

    constructor(value: PromiseLike<T> | T) {
        this._value = value;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const value = await this._value;
        for (;;) {
            yield value;
        }
    }
}

/**
 * Creates an [[AsyncIterable]] that repeats the provided value forever.
 *
 * @param value The value for each element of the [[AsyncIterable]].
 * @category Query
 */
export function continuousAsync<T>(value: PromiseLike<T> | T): AsyncIterable<T> {
    return new AsyncContinuousIterable(value);
}

class AsyncGenerateIterable<T> implements AsyncIterable<T> {
    private _count: number;
    private _generator: (offset: number) => PromiseLike<T> | T;

    constructor(count: number, generator: (offset: number) => PromiseLike<T> | T) {
        this._count = count;
        this._generator = generator;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const count = this._count;
        const generator = this._generator;
        for (let i = 0; i < count; i++) {
            yield generator(i);
        }
    }
}

/**
 * Creates an [[AsyncIterable]] whose values are provided by a callback executed a provided number of
 * times.
 *
 * @param count The number of times to execute the callback.
 * @param generator The callback to execute.
 * @category Query
 */
export function generateAsync<T>(count: number, generator: (offset: number) => PromiseLike<T> | T): AsyncIterable<T> {
    assert.mustBePositiveFiniteNumber(count, "count");
    assert.mustBeFunction(generator, "generator");
    return new AsyncGenerateIterable(count, generator);
}

class AsyncOnceIterable<T> implements AsyncIterable<T> {
    private _value: PromiseLike<T> | T;

    constructor(value: PromiseLike<T> | T) {
        this._value = value;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        yield this._value;
    }
}

/**
 * Creates an [[AsyncIterable]] over a single element.
 *
 * @param value The only element for the [[AsyncIterable]].
 * @category Query
 */
export function onceAsync<T>(value: PromiseLike<T> | T): AsyncIterable<T> {
    return new AsyncOnceIterable(value);
}

class AsyncRepeatIterable<T> implements AsyncIterable<T> {
    private _value: PromiseLike<T> | T;
    private _count: number;
    
    constructor(value: PromiseLike<T> | T, count: number) {
        this._value = value;
        this._count = count;
    }
    
    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const value = await this._value;
        let count = this._count;
        while (count > 0) {
            yield value;
            count--;
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
export function repeatAsync<T>(value: PromiseLike<T> | T, count: number): AsyncIterable<T> {
    assert.mustBePositiveFiniteNumber(count, "count");
    return new AsyncRepeatIterable(value, count);
}
