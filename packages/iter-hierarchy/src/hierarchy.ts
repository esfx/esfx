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
import { isIterable } from '@esfx/internal-guards';
import { OrderedIterable } from '@esfx/iter-ordered';
import { HierarchyProvider } from './provider';
import { Comparison, Comparer } from '@esfx/equatable';
import { OrderedHierarchyIterable } from './ordered';

/**
 * Describes an object that has a navigable hierarchy.
 */
export interface Hierarchical<TNode> {
    /**
     * Gets an object that provides hierarchical relationships.
     */
    [Hierarchical.hierarchy](): HierarchyProvider<TNode>;
}

export namespace Hierarchical {
    export const hierarchy = Symbol.for("@esfx/iter-hierarchy:Hierarchical.hierarchy");

    export function hasInstance(x: unknown): x is Hierarchical<unknown> {
        return typeof x === "object" && x !== null
            && hierarchy in x;
    }
}

/**
 * Represents an `Iterable` with a navigable hierarchy.
 */
export interface HierarchyIterable<TNode, T extends TNode = TNode> extends Iterable<T>, Hierarchical<TNode> {
}

export namespace HierarchyIterable {
    export function hasInstance(x: unknown): x is HierarchyIterable<unknown> {
        return isIterable(x)
            && Hierarchical.hasInstance(x);
    }

    const { HierarchyIterable: HierarchyIterableImpl } = {
        HierarchyIterable: class <TNode, T extends TNode> implements HierarchyIterable<TNode, T> {
            private _source: Iterable<T>;
            private _provider: HierarchyProvider<TNode>;

            constructor(source: Iterable<T>, provider: HierarchyProvider<TNode>) {
                this._source = source;
                this._provider = provider;
            }

            [Symbol.iterator]() {
                return this._source[Symbol.iterator]();
            }

            [Hierarchical.hierarchy]() {
                return this._provider;
            }
        }
    };

    const { OrderedHierarchyIterable: OrderedHierarchyIterableImpl } = {
        OrderedHierarchyIterable: class <TNode, T extends TNode> implements OrderedHierarchyIterable<TNode, T> {
            private _source: OrderedIterable<T>;
            private _provider: HierarchyProvider<TNode>;

            constructor(source: OrderedIterable<T>, provider: HierarchyProvider<TNode>) {
                this._source = source;
                this._provider = provider;
            }

            [Symbol.iterator]() {
                return this._source[Symbol.iterator]();
            }

            [OrderedIterable.thenBy]<K>(keySelector: (element: T) => K, comparer: Comparison<K> | Comparer<K>, descending: boolean): OrderedHierarchyIterable<TNode, T> {
                return new OrderedHierarchyIterableImpl<TNode, T>(this._source[OrderedIterable.thenBy](keySelector, comparer, descending), this._provider);
            }

            [Hierarchical.hierarchy]() {
                return this._provider;
            }
        }
    };

    /**
     * Creates a `HierarchyIterable` using the provided `HierarchyProvider`.
     *
     * @param source An `Iterable` object.
     * @param hierarchy A `HierarchyProvider`.
     * @category Hierarchy
     */
    export function create<TNode, T extends TNode = TNode>(iterable: OrderedIterable<T>, provider: HierarchyProvider<TNode>): OrderedHierarchyIterable<TNode, T>;
    export function create<TNode, T extends TNode = TNode>(iterable: Iterable<T>, provider: HierarchyProvider<TNode>): HierarchyIterable<TNode, T>;
    export function create<TNode, T extends TNode = TNode>(iterable: Iterable<T> | OrderedIterable<T>, provider: HierarchyProvider<TNode>) {
        assert.mustBeIterableObject(iterable, "iterable");
        assert.mustBeType(HierarchyProvider.hasInstance, provider, "provider");
        return HierarchyIterable.hasInstance(iterable) && iterable[Hierarchical.hierarchy]() === provider ? iterable :
            OrderedIterable.hasInstance(iterable) ? new OrderedHierarchyIterableImpl(iterable, provider) :
            new HierarchyIterableImpl(iterable, provider);
    }
}