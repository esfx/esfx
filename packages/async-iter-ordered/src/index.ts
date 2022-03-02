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

import { Comparison, Comparer } from "@esfx/equatable";
import /*#__INLINE__*/ { isAsyncIterable } from "@esfx/internal-guards";

/**
 * Represents an `AsyncIterable` that is inherently ordered.
 */
export interface AsyncOrderedIterable<T> extends AsyncIterable<T> {
    /**
     * Creates a subsequent `AsyncOrderedIterable` whose elements are also ordered by the provided key.
     * @param keySelector A callback used to select the key for an element.
     * @param comparer A callback used to compare two keys.
     * @param descending A value indicating whether to sort in descending (`true`) or ascending (`false`) order.
     */
    [AsyncOrderedIterable.thenByAsync]<K>(keySelector: (element: T) => K, comparer: Comparison<K> | Comparer<K>, descending: boolean): AsyncOrderedIterable<T>;
}

export namespace AsyncOrderedIterable {
    export const thenByAsync = Symbol.for("@esfx/async-iter-ordered:AsyncOrderedIterable.thenByAsync");

    export function hasInstance(x: unknown): x is AsyncOrderedIterable<unknown> {
        return isAsyncIterable(x)
            && AsyncOrderedIterable.thenByAsync in x;
    }
}
