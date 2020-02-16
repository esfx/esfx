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
import { startsWith } from '../scalars';
import { empty } from '../queries';

/** @internal */
export function createGroupings<T, K, V>(source: Iterable<T>, keySelector: (element: T) => K, elementSelector: (element: T) => V, keyEqualer?: Equaler<K>): HashMap<K, V[]> {
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

function combineProviders<T>(left: HierarchyProvider<T> | undefined, right: HierarchyProvider<T> | undefined) {
    if (right === undefined || left === right) return left;
    if (left === undefined) return right;

    const leftProviders = flattenProvider(left);
    const rightProviders = flattenProvider(right);
    const providers = [...new Set([...leftProviders, ...rightProviders])];
    
    if (providers.length === 1) return providers[0];
    if (providers.length === leftProviders.length) return left;
    if (providers.length > leftProviders.length && providers.length === rightProviders.length && startsWith(providers, leftProviders)) {
        return right;
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
            return findOwner(providers, value)?.children(value) ?? empty<T>();
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

/** @internal */
export function flowHierarchy<TNode, T extends TNode, TIter extends Iterable<T>>(to: TIter, fromLeft: HierarchyIterable<TNode, T>, fromRight?: Iterable<T>): TIter & Hierarchical<TNode>;
/** @internal */
export function flowHierarchy<TNode, T extends TNode, TIter extends Iterable<T>>(to: TIter, fromLeft: Iterable<T>, fromRight: HierarchyIterable<TNode, T>): TIter & Hierarchical<TNode>;
/** @internal */
export function flowHierarchy<T, TIter extends Iterable<T>>(to: TIter, fromLeft: Iterable<T>, fromRight?: Iterable<T>): TIter;
export function flowHierarchy<T, TIter extends Iterable<T>>(to: TIter, fromLeft: Iterable<T>, fromRight?: Iterable<T>): TIter {
    const leftProvider = HierarchyIterable.hasInstance(fromLeft) ? fromLeft[Hierarchical.hierarchy]() : undefined;
    const rightProvider = HierarchyIterable.hasInstance(fromRight) ? fromRight[Hierarchical.hierarchy]() : undefined;
    const provider = combineProviders(leftProvider, rightProvider);
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
