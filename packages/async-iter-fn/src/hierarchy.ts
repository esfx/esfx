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

import /*#__INLINE__*/ { isAsyncIterableObject, isFunction, isInteger, isIterableObject, isNumber, isPrimitive, isUndefined } from '@esfx/internal-guards';
import { AsyncHierarchyIterable, AsyncOrderedHierarchyIterable } from '@esfx/async-iter-hierarchy';
import { AsyncOrderedIterable } from '@esfx/async-iter-ordered';
import { HashMap } from '@esfx/collections-hashmap';
import { HashSet } from '@esfx/collections-hashset';
import { Equaler } from '@esfx/equatable';
import { alwaysTrue } from '@esfx/fn';
import { Index } from '@esfx/interval';
import { Axis, Hierarchical, HierarchyIterable, HierarchyProvider } from "@esfx/iter-hierarchy";
import { OrderedIterable } from '@esfx/iter-ordered';
import { toArrayAsync } from './scalars';

function isHierarchyElement<T>(provider: HierarchyProvider<T>, value: T) {
    return value !== undefined && (provider.owns === undefined || provider.owns(value));
}

function createAsyncHierarchyIterable(tag: string, axis: <TNode>(provider: HierarchyProvider<TNode>, element: TNode) => Iterable<TNode>) {
    return {
        [tag]: class <TNode> implements AsyncHierarchyIterable<TNode> {
            private _source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>;
            private _predicate: (element: TNode) => PromiseLike<boolean> | boolean;
            private _axis: (provider: HierarchyProvider<TNode>, element: TNode) => Iterable<TNode>;

            constructor(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => PromiseLike<boolean> | boolean) {
                this._source = source;
                this._predicate = predicate;
                this._axis = axis;
            }

            async *[Symbol.asyncIterator](): AsyncIterator<TNode> {
                const source = this._source;
                const hierarchy = source[Hierarchical.hierarchy]();
                const predicate = this._predicate;
                const axis = this._axis;
                for await (const element of source) {
                    if (isHierarchyElement(hierarchy, element)) {
                        for (const related of axis(hierarchy, element)) {
                            let result = predicate(related);
                            if (!isPrimitive(result)) result = await result;
                            if (result) {
                                yield related;
                            }
                        }
                    }
                }
            }

            [Hierarchical.hierarchy]() {
                return this._source[Hierarchical.hierarchy]();
            }
        }
    }[tag];
}

const AsyncRootHierarchyIterable = createAsyncHierarchyIterable("AsyncRootHierarchyIterable", Axis.root);

/**
 * Selects the root element of each node in the iterable. This is equivalent to the `/` selector in XPath, or the `:root` selector in CSS.
 * @category Hierarchy
 */
export function rootAsync<TNode, U extends TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): AsyncHierarchyIterable<TNode, U>;
export function rootAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode>;
export function rootAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => PromiseLike<boolean> | boolean = alwaysTrue): AsyncHierarchyIterable<TNode> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isUndefined(predicate) && !isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new AsyncRootHierarchyIterable(source, predicate);
}

const AsyncAncestorsHierarchyIterable = createAsyncHierarchyIterable("AsyncAncestorsHierarchyIterable", Axis.ancestors);

/**
 * Selects the ancestors of each node in the iterable. This is equivalent to the `ancestor::*` selector in XPath.
 * @category Hierarchy
 */
export function ancestorsAsync<TNode, U extends TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): AsyncHierarchyIterable<TNode, U>;
export function ancestorsAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode>;
export function ancestorsAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => PromiseLike<boolean> | boolean = alwaysTrue): AsyncHierarchyIterable<TNode> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isUndefined(predicate) && !isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new AsyncAncestorsHierarchyIterable(source, predicate);
}

const AsyncAncestorsAndSelfHierarchyIterable = createAsyncHierarchyIterable("AsyncAncestorsAndSelfHierarchyIterable", Axis.ancestorsAndSelf);

/**
 * Selects the ancestors of each node in the iterable, along with the node itself. This is equivalent to the `ancestor-or-self::*` selector in XPath.
 * @category Hierarchy
 */
export function ancestorsAndSelfAsync<TNode, U extends TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): AsyncHierarchyIterable<TNode, U>;
export function ancestorsAndSelfAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode>;
export function ancestorsAndSelfAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => PromiseLike<boolean> | boolean = alwaysTrue): AsyncHierarchyIterable<TNode> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isUndefined(predicate) && !isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new AsyncAncestorsAndSelfHierarchyIterable(source, predicate);
}

const AsyncDescendantsHierarchyIterable = createAsyncHierarchyIterable("AsyncDescendantsHierarchyIterable", Axis.descendants);

/**
 * Selects the descendents of each node in the iterable. This is equivalent to the `descendant::*` selector in XPath, or the ` ` (space) combinator in CSS.
 * @category Hierarchy
 */
export function descendantsAsync<TNode, U extends TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): AsyncHierarchyIterable<TNode, U>;
export function descendantsAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode>;
export function descendantsAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => PromiseLike<boolean> | boolean = alwaysTrue): AsyncHierarchyIterable<TNode> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isUndefined(predicate) && !isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new AsyncDescendantsHierarchyIterable(source, predicate);
}

const AsyncDescendantsAndSelfHierarchyIterable = createAsyncHierarchyIterable("AsyncDescendantsAndSelfHierarchyIterable", Axis.descendantsAndSelf);

/**
 * Selects the descendents of each node in the iterable, along with the node itself. This is equivalent to the `descendant-or-self::*` selector in XPath.
 * @category Hierarchy
 */
export function descendantsAndSelfAsync<TNode, U extends TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): AsyncHierarchyIterable<TNode, U>;
export function descendantsAndSelfAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode>;
export function descendantsAndSelfAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => PromiseLike<boolean> | boolean = alwaysTrue): AsyncHierarchyIterable<TNode> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isUndefined(predicate) && !isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new AsyncDescendantsAndSelfHierarchyIterable(source, predicate);
}

const AsyncParentsHierarchyIterable = createAsyncHierarchyIterable("AsyncParentsHierarchyIterable", Axis.parents);

/**
 * Selects the parent of each node in the iterable. This is equivalent to the `parent::*` or `..` selectors in XPath.
 * @category Hierarchy
 */
export function parentsAsync<TNode, U extends TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): AsyncHierarchyIterable<TNode, U>;
export function parentsAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode>;
export function parentsAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => PromiseLike<boolean> | boolean = alwaysTrue): AsyncHierarchyIterable<TNode> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isUndefined(predicate) && !isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new AsyncParentsHierarchyIterable(source, predicate);
}

const AsyncSelfHierarchyIterable = createAsyncHierarchyIterable("AsyncSelfHierarchyIterable", Axis.self);

/**
 * Selects each node in the iterable. This is equivalent to the `self::*` or `.` selectors in XPath.
 * @category Hierarchy
 */
export function selfAsync<TNode, T extends TNode, U extends T>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (element: T) => element is U): AsyncHierarchyIterable<TNode, U>;
export function selfAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate?: (element: T) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode, T>;
export function selfAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => PromiseLike<boolean> | boolean = alwaysTrue): AsyncHierarchyIterable<TNode> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isUndefined(predicate) && !isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new AsyncSelfHierarchyIterable(source, predicate);
}

const AsyncSiblingsHierarchyIterable = createAsyncHierarchyIterable("AsyncSiblingsHierarchyIterable", Axis.siblings);

/**
 * Selects the siblings of each node in the iterable, excluding the node itself.
 * @category Hierarchy
 */
export function siblingsAsync<TNode, U extends TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): AsyncHierarchyIterable<TNode, U>;
export function siblingsAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode>;
export function siblingsAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => PromiseLike<boolean> | boolean = alwaysTrue): AsyncHierarchyIterable<TNode> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isUndefined(predicate) && !isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new AsyncSiblingsHierarchyIterable(source, predicate);
}

const AsyncSiblingsAndSelfHierarchyIterable = createAsyncHierarchyIterable("AsyncSiblingsAndSelfHierarchyIterable", Axis.siblingsAndSelf);

/**
 * Selects the siblings of each node in the iterable, including the node itself. This equivalent to the `../*` selector in XPath.
 * @category Hierarchy
 */
export function siblingsAndSelfAsync<TNode, U extends TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): AsyncHierarchyIterable<TNode, U>;
export function siblingsAndSelfAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode>;
export function siblingsAndSelfAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => PromiseLike<boolean> | boolean = alwaysTrue): AsyncHierarchyIterable<TNode> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isUndefined(predicate) && !isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new AsyncSiblingsAndSelfHierarchyIterable(source, predicate);
}

const AsyncPrecedingSiblingsHierarchyIterable = createAsyncHierarchyIterable("AsyncPrecedingSiblingsHierarchyIterable", Axis.precedingSiblings);

/**
 * Selects the siblings that precede each node in the iterable. This is equivalent to the `preceding-sibling::**` selector in XPath.
 * @category Hierarchy
 */
export function precedingSiblingsAsync<TNode, U extends TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): AsyncHierarchyIterable<TNode, U>;
export function precedingSiblingsAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode>;
export function precedingSiblingsAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => PromiseLike<boolean> | boolean = alwaysTrue): AsyncHierarchyIterable<TNode> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isUndefined(predicate) && !isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new AsyncPrecedingSiblingsHierarchyIterable(source, predicate);
}

export { precedingSiblingsAsync as siblingsBeforeSelfAsync };
export { followingSiblingsAsync as siblingsAfterSelfAsync };

const AsyncFollowingSiblingsHierarchyIterable = createAsyncHierarchyIterable("AsyncFollowingSiblingsHierarchyIterable", Axis.followingSiblings);

/**
 * Selects the siblings that follow each node in the iterable. This is equivalent to the `following-sibling::*` selector in XPath or the `~` combinator in CSS.
 * @category Hierarchy
 */
export function followingSiblingsAsync<TNode, U extends TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): AsyncHierarchyIterable<TNode, U>;
export function followingSiblingsAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode>;
export function followingSiblingsAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => PromiseLike<boolean> | boolean = alwaysTrue): AsyncHierarchyIterable<TNode> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isUndefined(predicate) && !isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new AsyncFollowingSiblingsHierarchyIterable(source, predicate);
}


const AsyncPrecedingHierarchyIterable = createAsyncHierarchyIterable("AsyncPrecedingHierarchyIterable", Axis.preceding);

/**
 * Selects the nodes that precede each node in the iterable. This is equivalent to the `preceding::**` selector in XPath.
 * @category Hierarchy
 */
export function precedingAsync<TNode, U extends TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): AsyncHierarchyIterable<TNode, U>;
export function precedingAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode>;
export function precedingAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => PromiseLike<boolean> | boolean = alwaysTrue): AsyncHierarchyIterable<TNode> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isUndefined(predicate) && !isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new AsyncPrecedingHierarchyIterable(source, predicate);
}

const AsyncFollowingHierarchyIterable = createAsyncHierarchyIterable("AsyncFollowingHierarchyIterable", Axis.following);

/**
 * Selects the nodes that follow each node in the iterable. This is equivalent to the `following-sibling::*` selector in XPath or the `~` combinator in CSS.
 * @category Hierarchy
 */
export function followingAsync<TNode, U extends TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): AsyncHierarchyIterable<TNode, U>;
export function followingAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode>;
export function followingAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => PromiseLike<boolean> | boolean = alwaysTrue): AsyncHierarchyIterable<TNode> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isUndefined(predicate) && !isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new AsyncFollowingHierarchyIterable(source, predicate);
}

const AsyncChildrenHierarchyIterable = createAsyncHierarchyIterable("AsyncChildrenHierarchyIterable", Axis.children);

/**
 * Selects the children of each node in the iterable. This is equivalent to the `child::*` selector in XPath, or the `>` combinator in CSS.
 * @category Hierarchy
 */
export function childrenAsync<TNode, U extends TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): AsyncHierarchyIterable<TNode, U>;
export function childrenAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode>;
export function childrenAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => PromiseLike<boolean> | boolean = alwaysTrue): AsyncHierarchyIterable<TNode> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isUndefined(predicate) && !isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new AsyncChildrenHierarchyIterable(source, predicate);
}

const AsyncFirstChildHierarchyIterable = createAsyncHierarchyIterable("AsyncFirstChildHierarchyIterable", Axis.firstChild);

/**
 * Selects the first child of each node in the iterable. This is equivalent to the `child::*[first()]` selector in XPath, or the `:first-child` pseudo class in CSS.
 * @category Hierarchy
 */
export function firstChildAsync<TNode, U extends TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): AsyncHierarchyIterable<TNode, U>;
export function firstChildAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode>;
export function firstChildAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => PromiseLike<boolean> | boolean = alwaysTrue): AsyncHierarchyIterable<TNode> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new AsyncFirstChildHierarchyIterable(source, predicate);
}

const AsyncLastChildHierarchyIterable = createAsyncHierarchyIterable("AsyncLastChildHierarchyIterable", Axis.lastChild);

/**
 * Selects the last child of each node in the iterable. This is equivalent to the `child::*[last()]` selector in XPath, or the `:last-child` pseudo class in CSS.
 * @category Hierarchy
 */
export function lastChildAsync<TNode, U extends TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): AsyncHierarchyIterable<TNode, U>;
export function lastChildAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode>;
export function lastChildAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, predicate: (element: TNode) => PromiseLike<boolean> | boolean = alwaysTrue): AsyncHierarchyIterable<TNode> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new AsyncLastChildHierarchyIterable(source, predicate);
}

class AsyncNthChildIterable<TNode, T extends TNode> implements AsyncIterable<TNode> {
    private _source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>;
    private _predicate: (element: TNode) => PromiseLike<boolean> | boolean;
    private _offset: number | Index;

    constructor(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, offset: number | Index, predicate: (element: TNode) => PromiseLike<boolean> | boolean) {
        this._source = source;
        this._offset = offset;
        this._predicate = predicate;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<TNode> {
        const source = this._source;
        const provider = source[Hierarchical.hierarchy]();
        const offset = this._offset;
        const predicate = this._predicate;
        for await (const element of source) {
            if (isHierarchyElement(provider, element)) {
                for (const child of Axis.nthChild(provider, element, offset)) {
                    let result = predicate(child);
                    if (!isPrimitive(result)) result = await result;
                    if (result) {
                        yield child;
                    }
                }
            }
        }
    }

    [Hierarchical.hierarchy]() {
        return this._source[Hierarchical.hierarchy]();
    }
}

/**
 * Creates an `AsyncHierarchyIterable` for the child of each element at the specified offset. A negative offset
 * starts from the last child.
 *
 * @param source An `AsyncHierarchyIterable` or `HierarchyIterable` object.
 * @param offset The offset for the child.
 * @param predicate An optional callback used to filter the results.
 * @category Hierarchy
 */
export function nthChildAsync<TNode, U extends TNode>(source: AsyncHierarchyIterable<TNode, U> | HierarchyIterable<TNode, U>, offset: number | Index, predicate: (element: TNode) => element is U): AsyncHierarchyIterable<TNode, U>;
/**
 * Creates an `AsyncHierarchyIterable` for the child of each element at the specified offset. A negative offset
 * starts from the last child.
 *
 * @param source An `AsyncHierarchyIterable` or `HierarchyIterable` object.
 * @param offset The offset for the child.
 * @param predicate An optional callback used to filter the results.
 * @category Hierarchy
 */
export function nthChildAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, offset: number | Index, predicate?: (element: TNode) => PromiseLike<boolean> | boolean): AsyncHierarchyIterable<TNode>;
export function nthChildAsync<TNode>(source: AsyncHierarchyIterable<TNode> | HierarchyIterable<TNode>, offset: number | Index, predicate: (element: TNode) => PromiseLike<boolean> | boolean = alwaysTrue): AsyncHierarchyIterable<TNode> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isNumber(offset)) throw new TypeError("Number expected: offset");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    if (!isInteger(offset)) throw new RangeError("Argument out of range: offset");
    return new AsyncNthChildIterable(source, offset, predicate);
}

class AsyncTopMostIterable<TNode, T extends TNode> implements AsyncHierarchyIterable<TNode, T> {
    private _source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>;
    private _predicate: (value: T) => PromiseLike<boolean> | boolean;
    private _equaler: Equaler<TNode> | undefined;

    constructor(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (value: T) => PromiseLike<boolean> | boolean, equaler: Equaler<TNode> | undefined) {
        this._source = source;
        this._predicate = predicate;
        this._equaler = equaler;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const source = this._source;
        const predicate = this._predicate;
        const equaler = this._equaler;
        const hierarchy = source[Hierarchical.hierarchy]();
        const topMostNodes = await toArrayAsync(source);
        const ancestors = new HashMap<TNode, HashSet<TNode>>(equaler);
        for (let i = topMostNodes.length - 1; i >= 1; i--) {
            const node = topMostNodes[i];
            for (let j = i - 1; j >= 0; j--) {
                const other = topMostNodes[j];
                let ancestorsOfNode = ancestors.get(node);
                if (!ancestorsOfNode) {
                    ancestorsOfNode = new HashSet(Axis.ancestors(hierarchy, node), equaler);
                    ancestors.set(node, ancestorsOfNode);
                }

                if (ancestorsOfNode.has(other)) {
                    topMostNodes.splice(i, 1);
                    break;
                }

                let ancestorsOfOther = ancestors.get(other);
                if (!ancestorsOfOther) {
                    ancestorsOfOther = new HashSet(Axis.ancestors(hierarchy, other), equaler);
                    ancestors.set(other, ancestorsOfOther);
                }

                if (ancestorsOfOther.has(node)) {
                    topMostNodes.splice(j, 1);
                    i--;
                }
            }
        }

        if (predicate === alwaysTrue) {
            yield* topMostNodes;
        }
        else {
            for (const node of topMostNodes) {
                if (await predicate(node)) yield node;
            }
        }
    }

    [Hierarchical.hierarchy]() {
        return this._source[Hierarchical.hierarchy]();
    }
}

/**
 * Creates an `AsyncHierarchyIterable` for the top-most elements. Elements of `source` that are a descendant of any other
 * element of `source` are removed.
 *
 * @param source An `AsyncHierarchyIterable` or `HierarchyIterable` object.
 * @param predicate An optional callback used to filter the results.
 * @param equaler An optional `Equaler` used to compare equality between nodes.
 * @category Hierarchy
 */
export function topMostAsync<TNode, T extends TNode, U extends T>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (element: T) => element is U, equaler?: Equaler<TNode>): AsyncHierarchyIterable<TNode, U>;
/**
 * Creates an `AsyncHierarchyIterable` for the top-most elements. Elements of `source` that are a descendant of any other
 * element of `source` are removed.
 *
 * @param source An `AsyncHierarchyIterable` or `HierarchyIterable` object.
 * @param predicate An optional callback used to filter the results.
 * @param equaler An optional `Equaler` used to compare equality between nodes.
 * @category Hierarchy
 */
export function topMostAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate?: (element: T) => PromiseLike<boolean> | boolean, equaler?: Equaler<TNode>): AsyncHierarchyIterable<TNode, T>;
export function topMostAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (element: T) => PromiseLike<boolean> | boolean = alwaysTrue, equaler: Equaler<TNode> = Equaler.defaultEqualer): AsyncHierarchyIterable<TNode, T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    if (!Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return new AsyncTopMostIterable<TNode, T>(source, predicate, equaler);
}

class AsyncBottomMostIterable<TNode, T extends TNode> implements AsyncHierarchyIterable<TNode, T> {
    private _source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>;
    private _predicate: (value: T) => PromiseLike<boolean> | boolean;
    private _equaler: Equaler<TNode> | undefined;

    constructor(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (value: T) => PromiseLike<boolean> | boolean, equaler: Equaler<TNode> | undefined) {
        this._source = source;
        this._predicate = predicate;
        this._equaler = equaler;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const source = this._source;
        const predicate = this._predicate;
        const equaler = this._equaler;
        const hierarchy = source[Hierarchical.hierarchy]();
        const bottomMostNodes = await toArrayAsync(source);
        const ancestors = new HashMap<TNode, HashSet<TNode>>(equaler);
        for (let i = bottomMostNodes.length - 1; i >= 1; i--) {
            const node = bottomMostNodes[i];
            for (let j = i - 1; j >= 0; j--) {
                const other = bottomMostNodes[j];
                let ancestorsOfOther = ancestors.get(other);
                if (!ancestorsOfOther) {
                    ancestorsOfOther = new HashSet(Axis.ancestors(hierarchy, other), equaler);
                    ancestors.set(other, ancestorsOfOther);
                }

                if (ancestorsOfOther.has(node)) {
                    bottomMostNodes.splice(i, 1);
                    break;
                }

                let ancestorsOfNode = ancestors.get(node);
                if (!ancestorsOfNode) {
                    ancestorsOfNode = new HashSet(Axis.ancestors(hierarchy, node), equaler);
                    ancestors.set(node, ancestorsOfNode);
                }

                if (ancestorsOfNode.has(other)) {
                    bottomMostNodes.splice(j, 1);
                    i--;
                }
            }
        }

        if (predicate === alwaysTrue) {
            yield* bottomMostNodes;
            return;
        }

        for (const node of bottomMostNodes) {
            if (await predicate(node)) yield node;
        }
    }

    [Hierarchical.hierarchy]() {
        return this._source[Hierarchical.hierarchy]();
    }
}

/**
 * Creates an `AsyncHierarchyIterable` for the bottom-most elements. Elements of `source` that are an ancestor of any other
 * element of `source` are removed.
 *
 * @param source An `AsyncHierarchyIterable` or `HierarchyIterable` object.
 * @param predicate An optional callback used to filter the results.
 * @param equaler An optional `Equaler` used to compare equality between nodes.
 * @category Hierarchy
 */
export function bottomMostAsync<TNode, T extends TNode, U extends T>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (element: T) => element is U, equaler?: Equaler<TNode>): AsyncHierarchyIterable<TNode, U>;
/**
 * Creates an `AsyncHierarchyIterable` for the bottom-most elements. Elements of `source` that are an ancestor of any other
 * element of `source` are removed.
 *
 * @param source An `AsyncHierarchyIterable` or `HierarchyIterable` object.
 * @param predicate An optional callback used to filter the results.
 * @param equaler An optional `Equaler` used to compare equality between nodes.
 * @category Hierarchy
 */
export function bottomMostAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate?: (element: T) => PromiseLike<boolean> | boolean, equaler?: Equaler<TNode>): AsyncHierarchyIterable<TNode, T>;
export function bottomMostAsync<TNode, T extends TNode>(source: AsyncHierarchyIterable<TNode, T> | HierarchyIterable<TNode, T>, predicate: (element: T) => PromiseLike<boolean> | boolean = alwaysTrue, equaler: Equaler<TNode> = Equaler.defaultEqualer): AsyncHierarchyIterable<TNode, T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source) || !Hierarchical.hasInstance(source)) throw new TypeError("AsyncHierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    if (!Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return new AsyncBottomMostIterable<TNode, T>(source, predicate, equaler);
}

/**
 * Creates an `AsyncHierarchyIterable` using the provided `HierarchyProvider`.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param hierarchy A `HierarchyProvider`.
 * @category Hierarchy
 */
export function toHierarchyAsync<TNode, T extends TNode = TNode>(source: AsyncOrderedIterable<T> | OrderedIterable<T>, hierarchy: HierarchyProvider<TNode>): AsyncOrderedHierarchyIterable<TNode, T>;
/**
 * Creates an `AsyncHierarchyIterable` using the provided `HierarchyProvider`.
 *
 * @param source An `AsyncIterable` or `Iterable` object.
 * @param hierarchy A `HierarchyProvider`.
 * @category Hierarchy
 */
export function toHierarchyAsync<TNode, T extends TNode = TNode>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, hierarchy: HierarchyProvider<TNode>): AsyncHierarchyIterable<TNode, T>;
export function toHierarchyAsync<TNode, T extends TNode = TNode>(source: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, hierarchy: HierarchyProvider<TNode>): AsyncHierarchyIterable<TNode, T> {
    if (!isAsyncIterableObject(source) && !isIterableObject(source)) throw new TypeError("AsyncIterable expected: source");
    if (!HierarchyProvider.hasInstance(hierarchy)) throw new TypeError("HierarchyProvider expected: hierarchy");
    return AsyncHierarchyIterable.create(source, hierarchy);
}
