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

import * as assert from "./internal/assert";
import { toHierarchy } from "./fn";
import { HierarchyIterable, HierarchyProvider, Hierarchical } from './hierarchy';
import { isHierarchyIterable } from './internal/guards';
import { from, HierarchyQuery, Query } from './query';

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
        assert.mustBePositiveInteger(page, "page");
        assert.mustBePositiveInteger(offset, "offset");
        assert.mustBeIterable(values, "values");
        this.page = page;
        this.offset = offset;
        this.values = values;
    }

    static from<TNode, T extends TNode>(page: number, offset: number, values: Iterable<T>, provider: HierarchyProvider<TNode>): HierarchyPage<TNode, T>;
    static from<TNode, T extends TNode>(page: number, offset: number, values: HierarchyIterable<TNode, T>): HierarchyPage<TNode, T>;
    static from<T>(page: number, offset: number, values: Iterable<T>): Page<T>;
    static from<T>(page: number, offset: number, values: Iterable<T>, provider?: HierarchyProvider<unknown>) {
        assert.mustBePositiveInteger(page, "page");
        assert.mustBePositiveInteger(offset, "offset");
        assert.mustBeIterable(values, "values");
        assert.mustBeHierarchyProviderOrUndefined(provider, "provider");
        if (provider) values = toHierarchy(values, provider);
        return isHierarchyIterable(values) ? new HierarchyPage(page, offset, values) :
            new Page(page, offset, values);
    }

    toQuery(): Query<T> {
        return from(this);
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
        assert.mustBePositiveInteger(page, "page");
        assert.mustBePositiveInteger(offset, "offset");
        assert.mustBeIterable(values, "values");
        if (provider) values = toHierarchy(values, provider);
        assert.mustBeHierarchyIterable(values, "values");
        super(page, offset, values);
        this._provider = values[Hierarchical.hierarchy]();
    }

    toQuery(): HierarchyQuery<TNode, T> {
        return super.toQuery() as HierarchyQuery<TNode, T>;
    }

    [Hierarchical.hierarchy]() {
        return this._provider;
    }
}
