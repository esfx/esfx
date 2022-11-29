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

import { HashMap } from '@esfx/collections-hashmap';
import { Equaler } from '@esfx/equatable';
import { Hierarchical, HierarchyProvider, HierarchyIterable } from '@esfx/iter-hierarchy';

/** @internal */
export function createGroupings<T, K, V>(source: Iterable<T>, keySelector: (element: T) => K, keyEqualer: Equaler<K>, elementSelector: (element: T) => V): HashMap<K, V[]> {
    const map = new HashMap<K, V[]>(keyEqualer);
    for (const item of source) {
        const key = keySelector(item);
        const element = elementSelector(item);
        const grouping = map.get(key);
        if (grouping === undefined) {
            map.set(key, [element]);
        }
        else {
            grouping.push(element);
        }
    }
    return map;
}

/** @internal */
export function flowHierarchy<TNode, T extends TNode, TIter extends Iterable<T>>(to: TIter, fromLeft: HierarchyIterable<TNode, T>, fromRight?: Iterable<T>): TIter & Hierarchical<TNode>;
/** @internal */
export function flowHierarchy<TNode, T extends TNode, TIter extends Iterable<T>>(to: TIter, fromLeft: Iterable<T>, fromRight: HierarchyIterable<TNode, T>): TIter & Hierarchical<TNode>;
/** @internal */
export function flowHierarchy<T, TIter extends Iterable<T>>(to: TIter, fromLeft: Iterable<T>, fromRight?: Iterable<T>): TIter;
export function flowHierarchy<T, TIter extends Iterable<T>>(to: TIter, fromLeft: Iterable<T>, fromRight?: Iterable<T>): TIter {
    const leftProvider = HierarchyIterable.hasInstance(fromLeft) ? fromLeft[Hierarchical.hierarchy]() : undefined;
    const rightProvider = HierarchyIterable.hasInstance(fromRight) ? fromRight[Hierarchical.hierarchy]() : undefined;
    const provider = HierarchyProvider.combine(leftProvider, rightProvider);
    if (provider) {
        Object.defineProperty(to, Hierarchical.hierarchy, {
            enumerable: false,
            configurable: true,
            writable: true,
            value: () => provider
        });
    }
    return to;
}
