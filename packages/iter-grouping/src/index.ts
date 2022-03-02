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

import { Hierarchical, HierarchyIterable, HierarchyProvider } from '@esfx/iter-hierarchy';
import /*#__INLINE__*/ { isIterableObject, isUndefined } from "@esfx/internal-guards";

/**
 * Represents a group of values associated with the same key.
 */
export class Grouping<K, V> implements Iterable<V> {
    /**
     * The key associated with this group.
     */
    readonly key: K;

    /**
     * The values in the group.
     */
    readonly values: Iterable<V>;

    constructor(key: K, values: Iterable<V>) {
        if (!isIterableObject(values)) throw new TypeError("Iterable expected: values");
        this.key = key;
        this.values = values;
    }

    static from<K, VNode, V extends VNode>(key: K, values: Iterable<V>, provider: HierarchyProvider<VNode>): HierarchyGrouping<K, VNode, V>;
    static from<K, VNode, V extends VNode>(key: K, values: HierarchyIterable<VNode, V>): HierarchyGrouping<K, VNode, V>;
    static from<K, V>(key: K, values: Iterable<V>): Grouping<K, V>;
    static from<K, V>(key: K, values: Iterable<V>, provider?: HierarchyProvider<unknown>) {
        if (!isIterableObject(values)) throw new TypeError("Iterable expected: values");
        if (!isUndefined(provider) && !HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        if (provider) values = HierarchyIterable.create(values, provider);
        return HierarchyIterable.hasInstance(values) ? new HierarchyGrouping(key, values) : new Grouping(key, values);
    }

    [Symbol.iterator]() {
        return this.values[Symbol.iterator]();
    }
}

export class HierarchyGrouping<K, VNode, V extends VNode> extends Grouping<K, V> implements HierarchyIterable<VNode, V> {
    private _provider: HierarchyProvider<VNode>;

    declare readonly values: HierarchyIterable<VNode, V>;

    constructor(key: K, values: Iterable<V>, provider: HierarchyProvider<VNode>);
    constructor(key: K, values: HierarchyIterable<VNode, V>);
    constructor(key: K, values: Iterable<V> | HierarchyIterable<VNode, V>, provider?: HierarchyProvider<VNode>) {
        if (!isIterableObject(values)) throw new TypeError("Iterable expected: values");
        if (!isUndefined(provider) && !HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        if (provider) values = HierarchyIterable.create(values, provider);
        if (!HierarchyIterable.hasInstance(values)) throw new TypeError("HierarhcyIterable expected: values");
        super(key, values);
        this._provider = values[Hierarchical.hierarchy]();
    }

    [Hierarchical.hierarchy]() {
        return this._provider;
    }
}
