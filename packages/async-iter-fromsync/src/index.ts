/*!
   Copyright 2020 Ron Buckton

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

import /*#__INLINE__*/ { isAsyncIterable, isIterable } from "@esfx/internal-guards";

class AsyncFromSyncIterable<T, TSource extends Iterable<PromiseLike<T> | T>> implements AsyncIterable<T> {
    protected _source: TSource;

    constructor(source: TSource) {
        if (!isIterable(source)) throw new TypeError("Iterable expected: source");
        this._source = source;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        yield* this._source;
    }
}

/**
 * Creates an `AsyncIterable` from a synchronous `Iterable`.
 */
export function toAsyncIterable<T>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): AsyncIterable<T> {
    return isAsyncIterable(source) ? source : new AsyncFromSyncIterable(source);
}
