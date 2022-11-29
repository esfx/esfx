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
import { AsyncHierarchyIterable } from '@esfx/async-iter-hierarchy';
import { Hierarchical, HierarchyProvider, HierarchyIterable } from '@esfx/iter-hierarchy';

/** @internal */
export async function createGroupingsAsync<T, K, V>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, keySelector: (element: T) => K, keyEqualer: Equaler<K>, elementSelector: (element: T) => PromiseLike<V> | V): Promise<HashMap<K, V[]>> {
    const map = new HashMap<K, V[]>(keyEqualer);
    for await (const item of source) {
        const key = keySelector(item);
        const element = await elementSelector(item);
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
export function flowHierarchy<TNode, T extends TNode, TIter extends AsyncIterable<T> | Iterable<T>>(to: TIter, fromLeft: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, fromRight?: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): TIter & Hierarchical<TNode>;
/** @internal */
export function flowHierarchy<TNode, T extends TNode, TIter extends AsyncIterable<T> | Iterable<T>>(to: TIter, fromLeft: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, fromRight: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>): TIter & Hierarchical<TNode>;
/** @internal */
export function flowHierarchy<T, TIter extends AsyncIterable<T> | Iterable<T>>(to: TIter, fromLeft: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, fromRight?: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): TIter;
export function flowHierarchy<T, TIter extends AsyncIterable<T> | Iterable<T>>(to: TIter, fromLeft: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, fromRight?: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): TIter {
    if (to === fromLeft && (!fromRight || to === fromRight)) {
        return to;
    }

    const leftProvider = AsyncHierarchyIterable.hasInstance(fromLeft) ? fromLeft[Hierarchical.hierarchy]() : undefined;
    const rightProvider = AsyncHierarchyIterable.hasInstance(fromRight) ? fromRight[Hierarchical.hierarchy]() : undefined;
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
