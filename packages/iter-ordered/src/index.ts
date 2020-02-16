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
import { isIterable } from "@esfx/internal-guards";

/**
 * Represents an `Iterable` that is inherently ordered.
 */
export interface OrderedIterable<T> extends Iterable<T> {
    /**
     * Creates a subsequent `OrderedIterable` whose elements are also ordered by the provided key.
     * @param keySelector A callback used to select the key for an element.
     * @param comparer A callback used to compare two keys.
     * @param descending A value indicating whether to sort in descending (`true`) or ascending (`false`) order.
     */
    [OrderedIterable.thenBy]<K>(keySelector: (element: T) => K, comparer: Comparison<K> | Comparer<K>, descending: boolean): OrderedIterable<T>;
}

export namespace OrderedIterable {
    export const thenBy = Symbol.for("@esfx/iter-ordered:OrderedIterable.thenBy");

    export function hasInstance(x: unknown): x is OrderedIterable<unknown> {
        return isIterable(x)
            && OrderedIterable.thenBy in x;
    }
}
