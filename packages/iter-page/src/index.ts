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

import /*#__INLINE__*/ { isIterableObject, isNumber, isPositiveInteger, isUndefined } from "@esfx/internal-guards";
import { HierarchyIterable, HierarchyProvider, Hierarchical } from '@esfx/iter-hierarchy';

export class Page<T> implements Iterable<T> {
    /**
     * The page offset from the start of the source iterable.
     */
    readonly page: number;

    /**
     * The element offset from the start of the source iterable.
     */
    readonly offset: number;

    /**
     * The values associated with this page.
     */
    readonly values: Iterable<T>;

    constructor(page: number, offset: number, values: Iterable<T>) {
        if (!isNumber(page)) throw new TypeError("Number expected: page");
        if (!isNumber(offset)) throw new TypeError("Number expected: offset");
        if (!isIterableObject(values)) throw new TypeError("Iterable expected: values");
        if (!isPositiveInteger(page)) throw new RangeError("Argument out of range: page");
        if (!isPositiveInteger(offset)) throw new RangeError("Argument out of range: offset");
        this.page = page;
        this.offset = offset;
        this.values = values;
    }

    static from<TNode, T extends TNode>(page: number, offset: number, values: Iterable<T>, provider: HierarchyProvider<TNode>): HierarchyPage<TNode, T>;
    static from<TNode, T extends TNode>(page: number, offset: number, values: HierarchyIterable<TNode, T>): HierarchyPage<TNode, T>;
    static from<T>(page: number, offset: number, values: Iterable<T>): Page<T>;
    static from<T>(page: number, offset: number, values: Iterable<T>, provider?: HierarchyProvider<unknown>) {
        if (!isNumber(page)) throw new TypeError("Number expected: page");
        if (!isNumber(offset)) throw new TypeError("Number expected: offset");
        if (!isIterableObject(values)) throw new TypeError("Iterable expected: values");
        if (!isUndefined(provider) && !HierarchyProvider.hasInstance(provider)) throw new TypeError("HiearchyProvider expected: provider");
        if (!isPositiveInteger(page)) throw new RangeError("Argument out of range: page");
        if (!isPositiveInteger(offset)) throw new RangeError("Argument out of range: offset");
        if (provider) values = HierarchyIterable.create(values, provider);
        return HierarchyIterable.hasInstance(values) ?
            new HierarchyPage(page, offset, values) :
            new Page(page, offset, values);
    }

    [Symbol.iterator]() {
        return this.values[Symbol.iterator]();
    }
}

export class HierarchyPage<TNode, T extends TNode> extends Page<T> implements HierarchyIterable<TNode, T> {
    private _provider: HierarchyProvider<TNode>;

    declare readonly values: HierarchyIterable<TNode, T>;

    constructor(page: number, offset: number, values: Iterable<T>, provider: HierarchyProvider<TNode>);
    constructor(page: number, offset: number, values: HierarchyIterable<TNode, T>);
    constructor(page: number, offset: number, values: Iterable<T> | HierarchyIterable<TNode, T>, provider?: HierarchyProvider<TNode>) {
        if (!isNumber(page)) throw new TypeError("Number expected: page");
        if (!isNumber(offset)) throw new TypeError("Number expected: offset");
        if (!isIterableObject(values)) throw new TypeError("Iterable expected: values");
        if (!isUndefined(provider) && !HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        if (provider) values = HierarchyIterable.create(values, provider);
        if (!HierarchyIterable.hasInstance(values)) throw new TypeError("HierarchyIterable expected: values");
        if (!isPositiveInteger(page)) throw new RangeError("Argument out of range: page");
        if (!isPositiveInteger(offset)) throw new RangeError("Argument out of range: offset");
        super(page, offset, values);
        this._provider = values[Hierarchical.hierarchy]();
    }

    [Hierarchical.hierarchy]() {
        return this._provider;
    }
}
