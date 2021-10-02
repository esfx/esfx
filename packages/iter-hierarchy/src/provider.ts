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

import { isObject, isFunction, isFunctionOrUndefined } from '@esfx/internal-guards';

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
    function flattenProviderWorker<T>(provider: HierarchyProvider<T>, providersSeen: Set<HierarchyProvider<T>>, providersOut: HierarchyProvider<T>[]) {
        if (providersSeen.has(provider)) {
            return;
        }
        providersSeen.add(provider);
        if (provider.providers) {
            for (const child of provider.providers()) {
                flattenProviderWorker(child, providersSeen, providersOut);
            }
        }
        else {
            providersOut.push(provider);
        }
    }

    function flattenProvider<T>(provider: HierarchyProvider<T>) {
        const providersOut: HierarchyProvider<T>[] = [];
        flattenProviderWorker(provider, new Set(), providersOut);
        return providersOut;
    }

    function findOwner<T>(hierarchies: readonly HierarchyProvider<T>[], value: T) {
        let bestMatch: HierarchyProvider<T> | undefined;
        for (const hierarchy of hierarchies) {
            if (hierarchy.owns) {
                if (hierarchy.owns(value)) return hierarchy;
            }
            else if (!bestMatch) {
                bestMatch = hierarchy;
            }
        }
        return bestMatch;
    }

    const providerMembers = ["root", "firstChild", "lastChild", "previousSibling", "nextSibling"] as const;

    /**
     * Combines two hierarchy providers.
     */
    export function combine<T>(left: HierarchyProvider<T> | undefined, right: HierarchyProvider<T> | undefined): HierarchyProvider<T> | undefined {
        if (right === undefined || left === right) return left;
        if (left === undefined) return right;

        const leftProviders = flattenProvider(left);
        const rightProviders = flattenProvider(right);
        const providers = [...new Set([...leftProviders, ...rightProviders])];

        if (providers.length === 1) return providers[0];
        if (providers.length === leftProviders.length) return left;
        if (providers.length > leftProviders.length && providers.length === rightProviders.length) {
            let startsWithLeftProviders = true;
            for (let i = 0; i < leftProviders.length; i++) {
                if (providers[i] !== leftProviders[i]) {
                    startsWithLeftProviders = false;
                    break;
                }
            }
            if (startsWithLeftProviders) {
                return right;
            }
        }

        const composite: HierarchyProvider<T> = {
            providers() {
                return providers[Symbol.iterator]();
            },
            provider(value) {
                return value !== undefined ? findOwner(providers, value) : undefined;
            },
            owns(value) {
                return findOwner(providers, value) !== undefined;
            },
            parent(value) {
                return findOwner(providers, value)?.parent(value);
            },
            children(value) {
                return findOwner(providers, value)?.children(value) ?? { *[Symbol.iterator]() { }};
            }
        };

        // Add optional helpers if every provider implements them...
        const membersSet = new Set(providerMembers);
        for (const provider of providers) {
            for (const member of membersSet) {
                if (provider[member] === undefined) {
                    membersSet.delete(member);
                }
            }
        }

        for (const member of membersSet) {
            composite[member] = (value: T) => {
                const hierarchy = findOwner(providers, value);
                return hierarchy?.[member]!(value)!;
            };
        }

        return composite;
    }

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