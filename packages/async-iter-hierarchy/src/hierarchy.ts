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
import /*#__INLINE__*/ { isAsyncIterable } from '@esfx/internal-guards';
import { AsyncOrderedIterable } from '@esfx/async-iter-ordered';
import { Hierarchical, HierarchyProvider } from '@esfx/iter-hierarchy';
import { Comparison, Comparer } from '@esfx/equatable';
import { OrderedIterable } from '@esfx/iter-ordered';
import { toAsyncOrderedIterable } from '@esfx/async-iter-ordered-fromsync';
import { toAsyncIterable } from '@esfx/async-iter-fromsync';
import { AsyncOrderedHierarchyIterable } from './ordered';

/**
 * Represents an `Iterable` with a navigable hierarchy.
 */
export interface AsyncHierarchyIterable<TNode, T extends TNode = TNode> extends AsyncIterable<T>, Hierarchical<TNode> {
}

export namespace AsyncHierarchyIterable {
    export function hasInstance(x: unknown): x is AsyncHierarchyIterable<unknown> {
        return isAsyncIterable(x)
            && Hierarchical.hasInstance(x);
    }

    const { AsyncHierarchyIterable: AsyncHierarchyIterableImpl } = {
        AsyncHierarchyIterable: class <TNode, T extends TNode> implements AsyncHierarchyIterable<TNode, T> {
            private _source: AsyncIterable<T>;
            private _provider: HierarchyProvider<TNode>;

            constructor(source: AsyncIterable<T>, provider: HierarchyProvider<TNode>) {
                this._source = source;
                this._provider = provider;
            }

            [Symbol.asyncIterator]() {
                return this._source[Symbol.asyncIterator]();
            }

            [Hierarchical.hierarchy]() {
                return this._provider;
            }
        }
    };

    const { AsyncOrderedHierarchyIterable: AsyncOrderedHierarchyIterableImpl } = {
        AsyncOrderedHierarchyIterable: class <TNode, T extends TNode> implements AsyncOrderedHierarchyIterable<TNode, T> {
            private _source: AsyncOrderedIterable<T>;
            private _provider: HierarchyProvider<TNode>;

            constructor(source: AsyncOrderedIterable<T>, provider: HierarchyProvider<TNode>) {
                this._source = source;
                this._provider = provider;
            }

            [Symbol.asyncIterator]() {
                return this._source[Symbol.asyncIterator]();
            }

            [AsyncOrderedIterable.thenByAsync]<K>(keySelector: (element: T) => K, comparer: Comparison<K> | Comparer<K>, descending: boolean): AsyncOrderedHierarchyIterable<TNode, T> {
                return new AsyncOrderedHierarchyIterableImpl<TNode, T>(this._source[AsyncOrderedIterable.thenByAsync](keySelector, comparer, descending), this._provider);
            }

            [Hierarchical.hierarchy]() {
                return this._provider;
            }
        }
    };

    /**
     * Creates an `AsyncHierarchyIterable` using the provided `HierarchyProvider`.
     *
     * @param source An `AsyncIterable` or `Iterable` object.
     * @param hierarchy A `HierarchyProvider`.
     * @category Hierarchy
     */
    export function create<TNode, T extends TNode = TNode>(iterable: AsyncOrderedIterable<T> | OrderedIterable<T>, provider: HierarchyProvider<TNode>): AsyncOrderedHierarchyIterable<TNode, T>;
    export function create<TNode, T extends TNode = TNode>(iterable: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, provider: HierarchyProvider<TNode>): AsyncHierarchyIterable<TNode, T>;
    export function create<TNode, T extends TNode = TNode>(iterable: AsyncHierarchyIterable<T> | AsyncIterable<T> | Iterable<PromiseLike<T> | T> | AsyncOrderedIterable<T> | OrderedIterable<T>, provider: HierarchyProvider<TNode>) {
        assert.mustBeAsyncOrSyncIterableObject(iterable, "iterable");
        assert.mustBeType(HierarchyProvider.hasInstance, provider, "provider");
        return AsyncHierarchyIterable.hasInstance(iterable) && iterable[Hierarchical.hierarchy]() === provider ? iterable :
            AsyncOrderedIterable.hasInstance(iterable) ? new AsyncOrderedHierarchyIterableImpl(iterable, provider) :
            OrderedIterable.hasInstance(iterable) ? new AsyncOrderedHierarchyIterableImpl(toAsyncOrderedIterable(iterable), provider) :
            isAsyncIterable(iterable) ? new AsyncHierarchyIterableImpl(iterable, provider) :
            new AsyncHierarchyIterableImpl(toAsyncIterable(iterable), provider);
    }
}