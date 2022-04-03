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

import /*#__INLINE__*/ { isIterable, isIterableObject, isObject } from '@esfx/internal-guards';
import { Comparer, Comparison } from '@esfx/equatable';
import { OrderedIterable } from '@esfx/iter-ordered';
import { OrderedHierarchyIterable } from './ordered.js';
import { HierarchyProvider } from './provider.js';

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
        return isObject(x)
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

    const HierarchyIterable = class <TNode, T extends TNode> implements HierarchyIterable<TNode, T> {
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
    };

    const OrderedHierarchyIterable = class <TNode, T extends TNode> implements OrderedHierarchyIterable<TNode, T> {
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
            return new OrderedHierarchyIterable<TNode, T>(this._source[OrderedIterable.thenBy](keySelector, comparer, descending), this._provider);
        }

        [Hierarchical.hierarchy]() {
            return this._provider;
        }
    };

    /**
     * Creates a `HierarchyIterable` using the provided `HierarchyProvider`.
     *
     * @param iterable An `Iterable` object.
     * @param provider A `HierarchyProvider`.
     * @category Hierarchy
     */
    export function create<TNode, T extends TNode = TNode>(iterable: OrderedIterable<T>, provider: HierarchyProvider<TNode>): OrderedHierarchyIterable<TNode, T>;
    export function create<TNode, T extends TNode = TNode>(iterable: Iterable<T>, provider: HierarchyProvider<TNode>): HierarchyIterable<TNode, T>;
    export function create<TNode, T extends TNode = TNode>(iterable: Iterable<T> | OrderedIterable<T>, provider: HierarchyProvider<TNode>) {
        if (!isIterableObject(iterable)) throw new TypeError("Iterable expected: iterable");
        if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        return hasInstance(iterable) && iterable[Hierarchical.hierarchy]() === provider ? iterable :
            OrderedIterable.hasInstance(iterable) ? new OrderedHierarchyIterable(iterable, provider) :
            new HierarchyIterable(iterable, provider);
    }
}