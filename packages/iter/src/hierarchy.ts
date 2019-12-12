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
import { OrderedIterable } from './ordered';

/**
 * Describes an object that defines the relationships between parents and children of an element.
 */
export interface HierarchyProvider<TNode> {
    /**
     * Gets the parent element for the supplied element.
     */
    parent(element: TNode): TNode | undefined;

    /**
     * Gets the children elements for the supplied element.
     */
    children(element: TNode): Iterable<TNode> | undefined;

    /**
     * (Optional) If this provider is composed from multiple providers, finds the underlying provider for an element.
     */
    provider?(element: TNode): HierarchyProvider<TNode> | undefined;

    /**
     * (Optional) If this provider is composed from multiple providers, returns an iterable of each underlying provider.
     */
    providers?(): IterableIterator<HierarchyProvider<TNode>>;

    /**
     * (Optional) Indicates whether the supplied element is contained within a hierarchy.
     */
    owns?(element: TNode): boolean;

    /**
     * (Optional) Gets the root node for an element.
     *
     * NOTE: A HierarchyProvider should implement this to improve the performance of the `root` query operator on hierarchies.
     */
    root?(element: TNode): TNode;

    /**
     * (Optional) Gets the first child of an element.
     *
     * NOTE: A HierarchyProvider should implement this to improve the performance of the `following` query operator on hierarchies.
     */
    firstChild?(element: TNode): TNode | undefined;

    /**
     * (Optional) Gets the last child of an element.
     *
     * NOTE: A HierarchyProvider should implement this to improve the performance of the `preceding` query operator on hierarchies.
     */
    lastChild?(element: TNode): TNode | undefined;

    /**
     * (Optional) Gets the previous sibling of an element.
     *
     * NOTE: A HierarchyProvider should implement this to improve the performance of the `preceding` and `precedingSiblings` query operators on hierarchies.
     */
    previousSibling?(element: TNode): TNode;

    /**
     * (Optional) Gets the next sibling of an element.
     *
     * NOTE: A HierarchyProvider should implement this to improve the performance of the `following` and `followingSiblings` query operators on hierarchies.
     */
    nextSibling?(element: TNode): TNode;
}

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
    export const hierarchy = Symbol.for("@esfx/iter:Hierarchical.hierarchy");
}

/**
 * Represents an `Iterable` with a navigable hierarchy.
 */
export interface HierarchyIterable<TNode, T extends TNode = TNode> extends Iterable<T>, Hierarchical<TNode> {
}

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
