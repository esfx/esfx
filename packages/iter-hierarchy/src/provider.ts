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

import { isFunction, isFunctionOrUndefined } from '@esfx/internal-guards';
import { isObject } from 'util';

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

export namespace HierarchyProvider {
    export function hasInstance(value: unknown): value is HierarchyProvider<unknown> {
        return isObject(value)
            && isFunction((value as HierarchyProvider<unknown>).parent)
            && isFunction((value as HierarchyProvider<unknown>).children)
            && isFunctionOrUndefined((value as HierarchyProvider<unknown>).provider)
            && isFunctionOrUndefined((value as HierarchyProvider<unknown>).providers)
            && isFunctionOrUndefined((value as HierarchyProvider<unknown>).owns)
            && isFunctionOrUndefined((value as HierarchyProvider<unknown>).root)
            && isFunctionOrUndefined((value as HierarchyProvider<unknown>).firstChild)
            && isFunctionOrUndefined((value as HierarchyProvider<unknown>).lastChild)
            && isFunctionOrUndefined((value as HierarchyProvider<unknown>).previousSibling)
            && isFunctionOrUndefined((value as HierarchyProvider<unknown>).nextSibling);
    }
}