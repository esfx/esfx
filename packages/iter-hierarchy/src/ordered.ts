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

import { Comparer, Comparison } from '@esfx/equatable';
import { OrderedIterable } from '@esfx/iter-ordered';
import { HierarchyIterable } from './hierarchy';

/**
 * Represents an `Iterable` with a navigable hierarchy that is inherently ordered.
 */
export interface OrderedHierarchyIterable<TNode, T extends TNode = TNode> extends OrderedIterable<T>, HierarchyIterable<TNode, T> {
    /**
     * Creates a subsequent `OrderedHierarchyIterable` whose elements are also ordered by the provided key.
     * @param keySelector A callback used to select the key for an element.
     * @param comparer A callback used to compare two keys.
     * @param descending A value indicating whether to sort in descending (`true`) or ascending (`false`) order.
     */
    [OrderedIterable.thenBy]<K>(keySelector: (element: T) => K, comparer: Comparison<K> | Comparer<K>, descending: boolean): OrderedHierarchyIterable<TNode, T>;
}

export namespace OrderedHierarchyIterable {
    export function hasInstance(value: unknown): value is OrderedHierarchyIterable<unknown> {
        return OrderedIterable.hasInstance(value)
            && HierarchyIterable.hasInstance(value);
    }
}