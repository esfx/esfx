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

import * as assert from "@esfx/internal-assert";
import { OrderedIterable } from "@esfx/iter-ordered";
import { AsyncOrderedIterable } from "@esfx/async-iter-ordered";
import { Comparison } from '@esfx/equatable';

class AsyncFromSyncOrderedIterable<T, TSource extends OrderedIterable<T>> implements AsyncOrderedIterable<T> {
    private _source: TSource;

    constructor(source: TSource) {
        assert.mustBeType(OrderedIterable.hasInstance, "source");
        this._source = source;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        yield* this._source;
    }

    [AsyncOrderedIterable.thenByAsync]<K>(keySelector: (element: T) => K, comparison: (x: K, y: K) => number, descending: boolean): AsyncOrderedIterable<T> {
        const thenBy = this._source[OrderedIterable.thenBy];
        if (typeof thenBy === "function") {
            return new AsyncFromSyncOrderedIterable(thenBy.call(this._source, keySelector, comparison as Comparison<unknown>, descending));
        }
        throw new TypeError();
    }
}

export function toAsyncOrderedIterable<T>(iterable: AsyncOrderedIterable<T> | OrderedIterable<T>): AsyncOrderedIterable<T> {
    return AsyncOrderedIterable.hasInstance(iterable) ? iterable : new AsyncFromSyncOrderedIterable(iterable);
}
