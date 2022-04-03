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

import /*#__INLINE__*/ { isFunction, isInteger, isNumber } from "@esfx/internal-guards";
import { HashMap } from '@esfx/collections-hashmap';
import { HashSet } from '@esfx/collections-hashset';
import { Equaler } from '@esfx/equatable';
import { alwaysTrue } from '@esfx/fn';
import { Hierarchical, HierarchyIterable, HierarchyProvider, OrderedHierarchyIterable } from "@esfx/iter-hierarchy";
import { OrderedIterable } from '@esfx/iter-ordered';
import { Axis } from '@esfx/iter-hierarchy/axis';
import { toArray } from './scalars.js';

function isHierarchyElement<T>(provider: HierarchyProvider<T>, value: T) {
    return value !== undefined && (provider.owns === undefined || provider.owns(value));
}

function createHierarchyIterable(tag: string, axis: <TNode>(provider: HierarchyProvider<TNode>, element: TNode) => Iterable<TNode>) {
    return {
        [tag]: class <TNode> implements HierarchyIterable<TNode> {
            private _source: HierarchyIterable<TNode>;
            private _predicate: (element: TNode) => boolean;
            private _axis: (provider: HierarchyProvider<TNode>, element: TNode) => Iterable<TNode>;

            constructor(source: HierarchyIterable<TNode>, predicate: (element: TNode) => boolean) {
                this._source = source;
                this._predicate = predicate;
                this._axis = axis;
            }

            *[Symbol.iterator](): Iterator<TNode> {
                const source = this._source;
                const hierarchy = source[Hierarchical.hierarchy]();
                const predicate = this._predicate;
                const axis = this._axis;
                if (predicate === alwaysTrue) {
                    for (const element of source) {
                        if (isHierarchyElement(hierarchy, element)) {
                            for (const related of axis(hierarchy, element)) {
                                yield related;
                            }
                        }
                    }
                }
                else {
                    for (const element of source) {
                        if (isHierarchyElement(hierarchy, element)) {
                            for (const related of axis(hierarchy, element)) {
                                if (predicate(related)) {
                                    yield related;
                                }
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

const RootHierarchyIterable = createHierarchyIterable("RootHierarchyIterable", Axis.root);

/**
 * Selects the root element of each node in the iterable. This is equivalent to the `/` selector in XPath, or the `:root` selector in CSS.
 * @category Hierarchy
 */
export function root<TNode, U extends TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): HierarchyIterable<TNode, U>;
export function root<TNode>(source: HierarchyIterable<TNode>, predicate?: (element: TNode) => boolean): HierarchyIterable<TNode>;
export function root<TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => boolean = alwaysTrue): HierarchyIterable<TNode> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new RootHierarchyIterable(source, predicate);
}

const AncestorsHierarchyIterable = createHierarchyIterable("AncestorsHierarchyIterable", Axis.ancestors);

/**
 * Selects the ancestors of each node in the iterable. This is equivalent to the `ancestor::*` selector in XPath.
 * @category Hierarchy
 */
export function ancestors<TNode, U extends TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): HierarchyIterable<TNode, U>;
export function ancestors<TNode>(source: HierarchyIterable<TNode>, predicate?: (element: TNode) => boolean): HierarchyIterable<TNode>;
export function ancestors<TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => boolean = alwaysTrue): HierarchyIterable<TNode> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new AncestorsHierarchyIterable(source, predicate);
}

const AncestorsAndSelfHierarchyIterable = createHierarchyIterable("AncestorsAndSelfHierarchyIterable", Axis.ancestorsAndSelf);

/**
 * Selects the ancestors of each node in the iterable, along with the node itself. This is equivalent to the `ancestor-or-self::*` selector in XPath.
 * @category Hierarchy
 */
export function ancestorsAndSelf<TNode, U extends TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): HierarchyIterable<TNode, U>;
export function ancestorsAndSelf<TNode>(source: HierarchyIterable<TNode>, predicate?: (element: TNode) => boolean): HierarchyIterable<TNode>;
export function ancestorsAndSelf<TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => boolean = alwaysTrue): HierarchyIterable<TNode> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new AncestorsAndSelfHierarchyIterable(source, predicate);
}

const DescendantsHierarchyIterable = createHierarchyIterable("DescendantsHierarchyIterable", Axis.descendants);

/**
 * Selects the descendents of each node in the iterable. This is equivalent to the `descendant::*` selector in XPath, or the ` ` (space) combinator in CSS.
 * @category Hierarchy
 */
export function descendants<TNode, U extends TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): HierarchyIterable<TNode, U>;
export function descendants<TNode>(source: HierarchyIterable<TNode>, predicate?: (element: TNode) => boolean): HierarchyIterable<TNode>;
export function descendants<TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => boolean = alwaysTrue): HierarchyIterable<TNode> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new DescendantsHierarchyIterable(source, predicate);
}

const DescendantsAndSelfHierarchyIterable = createHierarchyIterable("DescendantsAndSelfHierarchyIterable", Axis.descendantsAndSelf);

/**
 * Selects the descendents of each node in the iterable, along with the node itself. This is equivalent to the `descendant-or-self::*` selector in XPath.
 * @category Hierarchy
 */
export function descendantsAndSelf<TNode, U extends TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): HierarchyIterable<TNode, U>;
export function descendantsAndSelf<TNode>(source: HierarchyIterable<TNode>, predicate?: (element: TNode) => boolean): HierarchyIterable<TNode>;
export function descendantsAndSelf<TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => boolean = alwaysTrue): HierarchyIterable<TNode> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new DescendantsAndSelfHierarchyIterable(source, predicate);
}

const ParentsHierarchyIterable = createHierarchyIterable("ParentsHierarchyIterable", Axis.parents);

/**
 * Selects the parent of each node in the iterable. This is equivalent to the `parent::*` or `..` selectors in XPath.
 * @category Hierarchy
 */
export function parents<TNode, U extends TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): HierarchyIterable<TNode, U>;
export function parents<TNode>(source: HierarchyIterable<TNode>, predicate?: (element: TNode) => boolean): HierarchyIterable<TNode>;
export function parents<TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => boolean = alwaysTrue): HierarchyIterable<TNode> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new ParentsHierarchyIterable(source, predicate);
}

const SelfHierarchyIterable = createHierarchyIterable("SelfHierarchyIterable", Axis.self);

/**
 * Selects each node in the iterable. This is equivalent to the `self::*` or `.` selectors in XPath.
 * @category Hierarchy
 */
export function self<TNode, T extends TNode, U extends T>(source: HierarchyIterable<TNode, T>, predicate: (element: T) => element is U): HierarchyIterable<TNode, U>;
export function self<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, predicate?: (element: T) => boolean): HierarchyIterable<TNode, T>;
export function self<TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => boolean = alwaysTrue): HierarchyIterable<TNode> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new SelfHierarchyIterable(source, predicate);
}

const SiblingsHierarchyIterable = createHierarchyIterable("SiblingsHierarchyIterable", Axis.siblings);

/**
 * Selects the siblings of each node in the iterable, excluding the node itself.
 * @category Hierarchy
 */
export function siblings<TNode, U extends TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): HierarchyIterable<TNode, U>;
export function siblings<TNode>(source: HierarchyIterable<TNode>, predicate?: (element: TNode) => boolean): HierarchyIterable<TNode>;
export function siblings<TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => boolean = alwaysTrue): HierarchyIterable<TNode> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new SiblingsHierarchyIterable(source, predicate);
}

const SiblingsAndSelfHierarchyIterable = createHierarchyIterable("SiblingsAndSelfHierarchyIterable", Axis.siblingsAndSelf);

/**
 * Selects the siblings of each node in the iterable, including the node itself. This equivalent to the `../*` selector in XPath.
 * @category Hierarchy
 */
export function siblingsAndSelf<TNode, U extends TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): HierarchyIterable<TNode, U>;
export function siblingsAndSelf<TNode>(source: HierarchyIterable<TNode>, predicate?: (element: TNode) => boolean): HierarchyIterable<TNode>;
export function siblingsAndSelf<TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => boolean = alwaysTrue): HierarchyIterable<TNode> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new SiblingsAndSelfHierarchyIterable(source, predicate);
}

const PrecedingSiblingsHierarchyIterable = createHierarchyIterable("PrecedingSiblingsHierarchyIterable", Axis.precedingSiblings);

/**
 * Selects the siblings that precede each node in the iterable. This is equivalent to the `preceding-sibling::**` selector in XPath.
 * @category Hierarchy
 */
export function precedingSiblings<TNode, U extends TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): HierarchyIterable<TNode, U>;
export function precedingSiblings<TNode>(source: HierarchyIterable<TNode>, predicate?: (element: TNode) => boolean): HierarchyIterable<TNode>;
export function precedingSiblings<TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => boolean = alwaysTrue): HierarchyIterable<TNode> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new PrecedingSiblingsHierarchyIterable(source, predicate);
}

export { precedingSiblings as siblingsBeforeSelf };
export { followingSiblings as siblingsAfterSelf };

const FollowingSiblingsHierarchyIterable = createHierarchyIterable("FollowingSiblingsHierarchyIterable", Axis.followingSiblings);

/**
 * Selects the siblings that follow each node in the iterable. This is equivalent to the `following-sibling::*` selector in XPath or the `~` combinator in CSS.
 * @category Hierarchy
 */
export function followingSiblings<TNode, U extends TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): HierarchyIterable<TNode, U>;
export function followingSiblings<TNode>(source: HierarchyIterable<TNode>, predicate?: (element: TNode) => boolean): HierarchyIterable<TNode>;
export function followingSiblings<TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => boolean = alwaysTrue): HierarchyIterable<TNode> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new FollowingSiblingsHierarchyIterable(source, predicate);
}


const PrecedingHierarchyIterable = createHierarchyIterable("PrecedingHierarchyIterable", Axis.preceding);

/**
 * Selects the nodes that precede each node in the iterable. This is equivalent to the `preceding::**` selector in XPath.
 * @category Hierarchy
 */
export function preceding<TNode, U extends TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): HierarchyIterable<TNode, U>;
export function preceding<TNode>(source: HierarchyIterable<TNode>, predicate?: (element: TNode) => boolean): HierarchyIterable<TNode>;
export function preceding<TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => boolean = alwaysTrue): HierarchyIterable<TNode> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new PrecedingHierarchyIterable(source, predicate);
}

const FollowingHierarchyIterable = createHierarchyIterable("FollowingHierarchyIterable", Axis.following);

/**
 * Selects the nodes that follow each node in the iterable. This is equivalent to the `following-sibling::*` selector in XPath or the `~` combinator in CSS.
 * @category Hierarchy
 */
export function following<TNode, U extends TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): HierarchyIterable<TNode, U>;
export function following<TNode>(source: HierarchyIterable<TNode>, predicate?: (element: TNode) => boolean): HierarchyIterable<TNode>;
export function following<TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => boolean = alwaysTrue): HierarchyIterable<TNode> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new FollowingHierarchyIterable(source, predicate);
}

const ChildrenHierarchyIterable = createHierarchyIterable("ChildrenHierarchyIterable", Axis.children);

/**
 * Selects the children of each node in the iterable. This is equivalent to the `child::*` selector in XPath, or the `>` combinator in CSS.
 * @category Hierarchy
 */
export function children<TNode, U extends TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): HierarchyIterable<TNode, U>;
export function children<TNode>(source: HierarchyIterable<TNode>, predicate?: (element: TNode) => boolean): HierarchyIterable<TNode>;
export function children<TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => boolean = alwaysTrue): HierarchyIterable<TNode> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new ChildrenHierarchyIterable(source, predicate);
}

const FirstChildHierarchyIterable = createHierarchyIterable("FirstChildHierarchyIterable", Axis.firstChild);

/**
 * Selects the first child of each node in the iterable. This is equivalent to the `child::*[first()]` selector in XPath, or the `:first-child` pseudo class in CSS.
 * @category Hierarchy
 */
export function firstChild<TNode, U extends TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): HierarchyIterable<TNode, U>;
export function firstChild<TNode>(source: HierarchyIterable<TNode>, predicate?: (element: TNode) => boolean): HierarchyIterable<TNode>;
export function firstChild<TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => boolean = alwaysTrue): HierarchyIterable<TNode> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new FirstChildHierarchyIterable(source, predicate);
}

const LastChildHierarchyIterable = createHierarchyIterable("LastChildHierarchyIterable", Axis.lastChild);

/**
 * Selects the last child of each node in the iterable. This is equivalent to the `child::*[last()]` selector in XPath, or the `:last-child` pseudo class in CSS.
 * @category Hierarchy
 */
export function lastChild<TNode, U extends TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => element is U): HierarchyIterable<TNode, U>;
export function lastChild<TNode>(source: HierarchyIterable<TNode>, predicate?: (element: TNode) => boolean): HierarchyIterable<TNode>;
export function lastChild<TNode>(source: HierarchyIterable<TNode>, predicate: (element: TNode) => boolean = alwaysTrue): HierarchyIterable<TNode> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    return new LastChildHierarchyIterable(source, predicate);
}

class NthChildHierarchyIterable<TNode> implements Iterable<TNode> {
    private _source: HierarchyIterable<TNode>;
    private _predicate: (element: TNode) => boolean;
    private _offset: number;

    constructor(source: HierarchyIterable<TNode>, offset: number, predicate: (element: TNode) => boolean) {
        this._source = source;
        this._offset = offset;
        this._predicate = predicate;
    }

    *[Symbol.iterator](): Iterator<TNode> {
        const source = this._source;
        const provider = source[Hierarchical.hierarchy]();
        const offset = this._offset;
        const predicate = this._predicate;
        if (predicate === alwaysTrue) {
            for (const element of source) {
                if (isHierarchyElement(provider, element)) {
                    for (const child of Axis.nthChild(provider, element, offset)) {
                        yield child;
                    }
                }
            }
        }
        else {
            for (const element of source) {
                if (isHierarchyElement(provider, element)) {
                    for (const child of Axis.nthChild(provider, element, offset)) {
                        if (predicate(child)) {
                            yield child;
                        }
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
 * Creates a `HierarchyIterable` for the child of each element at the specified offset. A negative offset
 * starts from the last child. This is equivalent to the `:nth-child()` pseudo-class in CSS.
 *
 * @param source A `HierarchyIterable` object.
 * @param offset The offset for the child.
 * @param predicate An optional callback used to filter the results.
 * @category Hierarchy
 */
export function nthChild<TNode, U extends TNode>(source: HierarchyIterable<TNode>, offset: number, predicate: (element: TNode) => element is U): HierarchyIterable<TNode, U>;
export function nthChild<TNode>(source: HierarchyIterable<TNode>, offset: number, predicate?: (element: TNode) => boolean): HierarchyIterable<TNode>;
export function nthChild<TNode>(source: HierarchyIterable<TNode>, offset: number, predicate: (element: TNode) => boolean = alwaysTrue): HierarchyIterable<TNode> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isNumber(offset)) throw new TypeError("Numebr expected: offset");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    if (!isInteger(offset)) throw new RangeError("Argument out of range: offset");
    return new NthChildHierarchyIterable(source, offset, alwaysTrue);
}

class TopMostIterable<TNode, T extends TNode> implements HierarchyIterable<TNode, T> {
    private _source: HierarchyIterable<TNode, T>;
    private _predicate: (value: T) => boolean;
    private _equaler: Equaler<TNode> | undefined;

    constructor(source: HierarchyIterable<TNode, T>, predicate: (value: T) => boolean, equaler: Equaler<TNode> | undefined) {
        this._source = source;
        this._predicate = predicate;
        this._equaler = equaler;
    }

    *[Symbol.iterator](): Iterator<T> {
        const source = this._source;
        const predicate = this._predicate;
        const equaler = this._equaler;
        const hierarchy = source[Hierarchical.hierarchy]();
        const topMostNodes = toArray(source);
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
            for (const node of topMostNodes) {
                yield node;
            }
        }
        else {
            for (const node of topMostNodes) {
                if (predicate(node)) yield node;
            }
        }
    }

    [Hierarchical.hierarchy]() {
        return this._source[Hierarchical.hierarchy]();
    }
}

/**
 * Filters a `HierarchyIterable` to the top-most elements. Elements that are a descendant of any other
 * element in the iterable are removed.
 *
 * @param source A `HierarchyIterable` object.
 * @param predicate An optional callback used to filter the results.
 * @param equaler An optional `Equaler` used to compare equality between nodes.
 * @category Hierarchy
 */
export function topMost<TNode, T extends TNode, U extends T>(source: HierarchyIterable<TNode, T>, predicate: (value: T) => value is U, equaler?: Equaler<TNode>): HierarchyIterable<TNode, U>;
/**
 * Creates a `HierarchyIterable` for the top-most elements. Elements that are a descendant of any other
 * element are removed.
 *
 * @param source A `HierarchyIterable` object.
 * @param predicate An optional callback used to filter the results.
 * @param equaler An optional `Equaler` used to compare equality between nodes.
 * @category Hierarchy
 */
export function topMost<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, predicate?: (value: T) => boolean, equaler?: Equaler<TNode>): HierarchyIterable<TNode, T>;
export function topMost<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, predicate: (value: T) => boolean = alwaysTrue, equaler: Equaler<TNode> = Equaler.defaultEqualer): HierarchyIterable<TNode, T> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    if (!Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return new TopMostIterable<TNode, T>(source, predicate, equaler);
}

class BottomMostIterable<TNode, T extends TNode> implements HierarchyIterable<TNode, T> {
    private _source: HierarchyIterable<TNode, T>;
    private _predicate: (value: T) => boolean;
    private _equaler: Equaler<TNode> | undefined;

    constructor(source: HierarchyIterable<TNode, T>, predicate: (value: T) => boolean, equaler: Equaler<TNode> | undefined) {
        this._source = source;
        this._predicate = predicate;
        this._equaler = equaler;
    }

    *[Symbol.iterator](): Iterator<T> {
        const source = this._source;
        const predicate = this._predicate;
        const equaler = this._equaler;
        const hierarchy = source[Hierarchical.hierarchy]();
        const bottomMostNodes = toArray(source);
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
            for (const node of bottomMostNodes) {
                yield node;
            }
        }
        else {
            for (const node of bottomMostNodes) {
                if (predicate(node)) yield node;
            }
        }
    }

    [Hierarchical.hierarchy]() {
        return this._source[Hierarchical.hierarchy]();
    }
}

/**
 * Creates a `HierarchyIterable` for the bottom-most elements of a `HierarchyIterable`.
 * Elements of `source` that are an ancestor of any other element of `source` are removed.
 *
 * @param source A `HierarchyIterable` object.
 * @param predicate An optional callback used to filter the results.
 * @category Hierarchy
 */
export function bottomMost<TNode, T extends TNode, U extends T>(source: HierarchyIterable<TNode, T>, predicate: (value: T) => value is U, equaler?: Equaler<TNode>): HierarchyIterable<TNode, U>;
/**
 * Creates a `HierarchyIterable` for the bottom-most elements of a `HierarchyIterable`.
 * Elements of `source` that are an ancestor of any other element of `source` are removed.
 *
 * @param source A `HierarchyIterable` object.
 * @param predicate An optional callback used to filter the results.
 * @param equaler An optional `Equaler` used to compare equality between nodes.
 * @category Hierarchy
 */
export function bottomMost<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, predicate?: (value: T) => boolean, equaler?: Equaler<TNode>): HierarchyIterable<TNode, T>;
export function bottomMost<TNode, T extends TNode>(source: HierarchyIterable<TNode, T>, predicate: (value: T) => boolean = alwaysTrue, equaler: Equaler<TNode> = Equaler.defaultEqualer): HierarchyIterable<TNode, T> {
    if (!HierarchyIterable.hasInstance(source)) throw new TypeError("HierarchyIterable expected: source");
    if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
    if (!Equaler.hasInstance(equaler)) throw new TypeError("Equaler expected: equaler");
    return new BottomMostIterable<TNode, T>(source, predicate, equaler);
}

/**
 * Creates a `HierarchyIterable` using the provided `HierarchyProvider`.
 *
 * @param source An `Iterable` object.
 * @param hierarchy A `HierarchyProvider`.
 * @param equaler An optional `Equaler` used to compare equality between nodes.
 * @category Hierarchy
 */
export function toHierarchy<TNode, T extends TNode = TNode>(iterable: OrderedIterable<T>, provider: HierarchyProvider<TNode>): OrderedHierarchyIterable<TNode, T>;
export function toHierarchy<TNode, T extends TNode = TNode>(iterable: Iterable<T>, provider: HierarchyProvider<TNode>): HierarchyIterable<TNode, T>;
export function toHierarchy<TNode, T extends TNode = TNode>(iterable: Iterable<T> | OrderedIterable<T>, provider: HierarchyProvider<TNode>) {
    return HierarchyIterable.create(iterable, provider);
}