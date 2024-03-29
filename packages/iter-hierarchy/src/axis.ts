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

import /*#__INLINE__*/ { isNumber } from '@esfx/internal-guards';
import { Index } from "@esfx/interval";
import { HierarchyProvider } from "./provider.js";

type HasPreviousSibling<T> = Pick<Required<HierarchyProvider<T>>, "previousSibling">;
type HasNextSibling<T> = Pick<Required<HierarchyProvider<T>>, "nextSibling">;
type HasFirstChild<T> = Pick<Required<HierarchyProvider<T>>, "firstChild">;
type HasLastChild<T> = Pick<Required<HierarchyProvider<T>>, "lastChild">;

function hasPreviousSibling<T>(provider: HierarchyProvider<T>): provider is HierarchyProvider<T> & HasPreviousSibling<T> {
    return provider.previousSibling !== undefined;
}

function hasNextSibling<T>(provider: HierarchyProvider<T>): provider is HierarchyProvider<T> & HasNextSibling<T> {
    return provider.nextSibling !== undefined;
}

function hasFirstChild<T>(provider: HierarchyProvider<T>): provider is HierarchyProvider<T> & HasFirstChild<T> {
    return provider.firstChild !== undefined;
}

function hasLastChild<T>(provider: HierarchyProvider<T>): provider is HierarchyProvider<T> & HasLastChild<T> {
    return provider.lastChild !== undefined;
}

/**
 * Axis traversal helpers.
 */
export namespace Axis {
    function * selfGen<T>(_provider: HierarchyProvider<T>, element: T) {
        yield element;
    }

    export function self<T>(provider: HierarchyProvider<T>, element: T) {
        if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        return selfGen(provider, element);
    }

    function * parentsGen<T>(provider: HierarchyProvider<T>, element: T) {
        const parent = provider.parent(element);
        if (parent !== undefined) {
            yield parent;
        }
    }

    export function parents<T>(provider: HierarchyProvider<T>, element: T) {
        if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        return parentsGen(provider, element);
    }

    function * reverseChildrenUsingPreviousSiblingAndLastChild<T>(provider: HierarchyProvider<T> & HasPreviousSibling<T> & HasLastChild<T>, element: T) {
        for (let child = provider.lastChild(element); child !== undefined; child = provider.previousSibling(child)) {
            yield child;
        }
    }

    function * reverseChildrenFallback<T>(provider: HierarchyProvider<T>, element: T) {
        const childrenArray = [...children(provider, element)];
        for (let i = childrenArray.length - 1; i >= 0; i--) {
            yield childrenArray[i];
        }
    }

    function * childrenGen<T>(provider: HierarchyProvider<T>, element: T) {
        const children = provider.children(element);
        if (children === undefined) {
            return;
        }
        for (const child of children) {
            if (child !== undefined) {
                yield child;
            }
        }
    }

    export function children<T>(provider: HierarchyProvider<T>, element: T) {
        if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        return childrenGen(provider, element);
    }

    function * firstChildUsingFirstChild<T>(provider: HierarchyProvider<T> & HasFirstChild<T>, element: T) {
        const child = provider.firstChild(element);
        if (child !== undefined) {
            yield child;
        }
    }

    function * firstChildFallback<T>(provider: HierarchyProvider<T>, element: T) {
        for (const child of children(provider, element)) {
            yield child;
            break;
        }
    }

    function * firstChildGen<T>(provider: HierarchyProvider<T>, element: T) {
        yield* hasFirstChild(provider)
            ? firstChildUsingFirstChild(provider, element)
            : firstChildFallback(provider, element);
    }

    export function firstChild<T>(provider: HierarchyProvider<T>, element: T) {
        if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        return firstChildGen(provider, element);
    }

    function * lastChildUsingLastChild<T>(provider: HierarchyProvider<T> & HasLastChild<T>, element: T) {
        const child = provider.lastChild(element);
        if (child !== undefined) {
            yield child;
        }
    }

    function * lastChildFallback<T>(provider: HierarchyProvider<T>, element: T) {
        let last!: T;
        let hasChild = false;
        for (const child of children(provider, element)) {
            last = child;
            hasChild = true;
        }
        if (hasChild) {
            yield last;
        }
    }

    function * lastChildGen<T>(provider: HierarchyProvider<T>, element: T) {
        yield* hasLastChild(provider)
            ? lastChildUsingLastChild(provider, element)
            : lastChildFallback(provider, element);
    }

    export function lastChild<T>(provider: HierarchyProvider<T>, element: T) {
        if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        return lastChildGen(provider, element);
    }

    function nth<T>(source: Iterable<T>, offset: number | Index): T | undefined {
        let isFromEnd = false;
        if (typeof offset === "number") {
            isFromEnd = offset < 0;
            if (isFromEnd) offset = -offset;
        }
        else {
            isFromEnd = offset.isFromEnd;
            offset = offset.value;
        }
        if (isFromEnd) {
            if (offset === 0) {
                return undefined;
            }
            if (offset === 1) {
                let last: T | undefined;
                for (const element of source) {
                    last = element;
                }
                return last;
            }
            const array: T[] = [];
            for (const element of source) {
                if (array.length >= offset) {
                    array.shift();
                }
                array.push(element);
            }
            return array.length === offset ? array[0] : undefined;
        }
        for (const element of source) {
            if (offset === 0) {
                return element;
            }
            offset--;
        }
        return undefined;
    }

    function * nthChildGen<T>(provider: HierarchyProvider<T>, element: T, offset: number | Index) {
        if (typeof offset !== "number" && !offset.isFromEnd) {
            offset = offset.value;
        }
        if (offset === 0) {
            yield* firstChild(provider, element);
        }
        else {
            const child = nth(children(provider, element), offset);
            if (child !== undefined) {
                yield child;
            }
        }
    }

    export function nthChild<T>(provider: HierarchyProvider<T>, element: T, offset: number | Index) {
        if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        if (!isNumber(offset) && !(offset instanceof Index)) throw new TypeError("Number of Index expected: offset");
        return nthChildGen(provider, element, offset);
    }

    function * rootGen<T>(provider: HierarchyProvider<T>, element: T) {
        if (provider.root !== undefined) {
            yield provider.root(element);
        }
        else {
            let hasRoot = false;
            let root!: T;
            for (const ancestor of ancestorsAndSelf(provider, element)) {
                hasRoot = true;
                root = ancestor;
            }
            if (hasRoot) {
                yield root;
            }
        }
    }

    export function root<T>(provider: HierarchyProvider<T>, element: T) {
        if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        return rootGen(provider, element);
    }

    function * ancestorsGen<T>(provider: HierarchyProvider<T>, element: T, self: boolean) {
        let ancestor = self ? element : provider.parent(element);
        while (ancestor !== undefined) {
            yield ancestor;
            ancestor = provider.parent(ancestor);
        }
    }

    export function ancestors<T>(provider: HierarchyProvider<T>, element: T) {
        if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        return ancestorsGen(provider, element, /*self*/ false);
    }

    export function ancestorsAndSelf<T>(provider: HierarchyProvider<T>, element: T) {
        if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        return ancestorsGen(provider, element, /*self*/ true);
    }

    function * descendantsUsingNextSiblingAndFirstChild<T>(provider: HierarchyProvider<T> & HasNextSibling<T> & HasFirstChild<T>, element: T, self: boolean, after: boolean): IterableIterator<T> {
        if (self && !after) {
            yield element;
        }
        for (let child = provider.firstChild(element); child !== undefined; child = provider.nextSibling(child)) {
            yield* descendantsUsingNextSiblingAndFirstChild(provider, child, /*self*/ true, after);
        }
        if (self && after) {
            yield element;
        }
    }

    function * descendantsFallback<T>(provider: HierarchyProvider<T>, element: T, self: boolean, after: boolean): IterableIterator<T> {
        if (self && !after) {
            yield element;
        }
        for (const child of children(provider, element)) {
            yield* descendantsFallback(provider, child, /*self*/ true, after);
        }
        if (self && after) {
            yield element;
        }
    }

    function * reverseDescendantsUsingPreviousSiblingAndLastChild<T>(provider: HierarchyProvider<T> & HasPreviousSibling<T> & HasLastChild<T>, element: T, self: boolean): IterableIterator<T> {
        for (const child of reverseChildrenUsingPreviousSiblingAndLastChild(provider, element)) {
            yield* reverseDescendantsUsingPreviousSiblingAndLastChild(provider, child, /*self*/ true);
        }
        if (self) {
            yield element;
        }
    }

    function * reverseDescendantsFallback<T>(provider: HierarchyProvider<T>, element: T, self: boolean): IterableIterator<T> {
        for (const child of reverseChildrenFallback(provider, element)) {
            yield* reverseDescendantsFallback(provider, child, /*self*/ true);
        }
        if (self) {
            yield element;
        }
    }

    function * descendantsGen<T>(provider: HierarchyProvider<T>, element: T) {
        yield* hasNextSibling(provider) && hasFirstChild(provider)
            ? descendantsUsingNextSiblingAndFirstChild(provider, element, /*self*/ false, /*after*/ false)
            : descendantsFallback(provider, element, /*self*/ false, /*after*/ false);
    }

    export function descendants<T>(provider: HierarchyProvider<T>, element: T) {
        if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        return descendantsGen(provider, element);
    }

    function * descendantsAndSelfGen<T>(provider: HierarchyProvider<T>, element: T) {
        yield* hasNextSibling(provider) && hasFirstChild(provider)
            ? descendantsUsingNextSiblingAndFirstChild(provider, element, /*self*/ true, /*after*/ false)
            : descendantsFallback(provider, element, /*self*/ true, /*after*/ false);
    }

    export function descendantsAndSelf<T>(provider: HierarchyProvider<T>, element: T) {
        if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        return descendantsAndSelfGen(provider, element);
    }

    function * siblingsUsingPreviousAndNextSibling<T>(provider: HierarchyProvider<T> & HasPreviousSibling<T> & HasNextSibling<T>, element: T, self: boolean) {
        const precedingSiblings = [...precedingSiblingUsingPreviousSibling(provider, element)];
        for (let i = precedingSiblings.length - 1; i >= 0; i--) {
            yield precedingSiblings[i];
        }
        if (self) {
            yield element;
        }
        yield* followingSiblingsUsingNextSibling(provider, element);
    }

    function * siblingsFallback<T>(provider: HierarchyProvider<T>, element: T, self: boolean) {
        const parent = provider.parent(element);
        if (parent !== undefined) {
            for (const child of children(provider, parent)) {
                if (self || child !== element) {
                    yield child;
                }
            }
        }
    }

    function * siblingsGen<T>(provider: HierarchyProvider<T>, element: T) {
        yield* hasPreviousSibling(provider) && hasNextSibling(provider)
            ? siblingsUsingPreviousAndNextSibling(provider, element, /*self*/ false)
            : siblingsFallback(provider, element, /*self*/ false);
    }
    
    export function siblings<T>(provider: HierarchyProvider<T>, element: T) {
        if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        return siblingsGen(provider, element);
    }

    function * siblingsAndSelfGen<T>(provider: HierarchyProvider<T>, element: T) {
        yield* hasPreviousSibling(provider) && hasNextSibling(provider)
            ? siblingsUsingPreviousAndNextSibling(provider, element, /*self*/ true)
            : siblingsFallback(provider, element, /*self*/ true);
    }

    export function siblingsAndSelf<T>(provider: HierarchyProvider<T>, element: T) {
        if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        return siblingsAndSelfGen(provider, element);
    }

    function * precedingSiblingUsingPreviousSibling<T>(provider: HierarchyProvider<T> & HasPreviousSibling<T>, element: T) {
        for (let node = provider.previousSibling(element); node !== undefined; node = provider.previousSibling(node)) {
            yield node;
        }
    }

    function * precedingSiblingsFallback<T>(provider: HierarchyProvider<T>, element: T) {
        let precedingSiblings: T[] | undefined;
        for (const sibling of siblingsFallback(provider, element, /*self*/ true)) {
            if (sibling === element) {
                break;
            }
            if (precedingSiblings === undefined) {
                precedingSiblings = [sibling];
            }
            else {
                precedingSiblings.push(sibling);
            }
        }
        if (precedingSiblings) {
            for (let i = precedingSiblings.length - 1; i >= 0; i--) {
                yield precedingSiblings[i];
            }
        }
    }

    function * precedingSiblingsGen<T>(provider: HierarchyProvider<T>, element: T) {
        yield* hasPreviousSibling(provider)
            ? precedingSiblingUsingPreviousSibling(provider, element)
            : precedingSiblingsFallback(provider, element);
    }
    
    export function precedingSiblings<T>(provider: HierarchyProvider<T>, element: T) {
        if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        return precedingSiblingsGen(provider, element);
    }

    function * followingSiblingsUsingNextSibling<T>(provider: HierarchyProvider<T> & HasNextSibling<T>, element: T) {
        for (let node = provider.nextSibling(element); node !== undefined; node = provider.nextSibling(node)) {
            yield node;
        }
    }

    function * followingSiblingsFallback<T>(provider: HierarchyProvider<T>, element: T) {
        let hasSeenSelf = false;
        for (const sibling of siblingsFallback(provider, element, /*self*/ true)) {
            if (hasSeenSelf) {
                yield sibling;
            }
            else if (sibling === element) {
                hasSeenSelf = true;
            }
        }
    }

    function * followingSiblingsGen<T>(provider: HierarchyProvider<T>, element: T) {
        yield* hasNextSibling(provider)
            ? followingSiblingsUsingNextSibling(provider, element)
            : followingSiblingsFallback(provider, element);
    }
    
    export function followingSiblings<T>(provider: HierarchyProvider<T>, element: T) {
        if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        return followingSiblingsGen(provider, element);
    }

    function * precedingUsingPreviousSiblingAndLastChild<T>(provider: HierarchyProvider<T> & HasPreviousSibling<T> & HasLastChild<T>, element: T) {
        for (const ancestor of ancestorsGen(provider, element, /*self*/ true)) {
            for (const sibling of precedingSiblingUsingPreviousSibling(provider, ancestor)) {
                yield* reverseDescendantsUsingPreviousSiblingAndLastChild(provider, sibling, /*self*/ true);
            }
        }
    }

    function * precedingFallback<T>(provider: HierarchyProvider<T>, element: T) {
        for (const ancestor of ancestorsGen(provider, element, /*self*/ true)) {
            for (const sibling of precedingSiblingsFallback(provider, ancestor)) {
                yield* reverseDescendantsFallback(provider, sibling, /*self*/ true);
            }
        }
    }

    function * precedingGen<T>(provider: HierarchyProvider<T>, element: T) {
        yield* hasPreviousSibling(provider) && hasLastChild(provider)
            ? precedingUsingPreviousSiblingAndLastChild(provider, element)
            : precedingFallback(provider, element);
    }

    export function preceding<T>(provider: HierarchyProvider<T>, element: T) {
        if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        return precedingGen(provider, element);
    }

    function * followingUsingNextSiblingAndFirstChild<T>(provider: HierarchyProvider<T> & HasNextSibling<T> & HasFirstChild<T>, element: T) {
        for (const ancestor of ancestorsGen(provider, element, /*self*/ true)) {
            for (const sibling of followingSiblingsUsingNextSibling(provider, ancestor)) {
                yield* descendantsUsingNextSiblingAndFirstChild(provider, sibling, /*self*/ true, /*after*/ true);
            }
        }
    }

    function * followingFallback<T>(provider: HierarchyProvider<T>, element: T) {
        for (const ancestor of ancestorsGen(provider, element, /*self*/ true)) {
            for (const sibling of followingSiblingsFallback(provider, ancestor)) {
                yield* descendantsFallback(provider, sibling, /*self*/ true, /*after*/ true);
            }
        }
    }

    function * followingGen<T>(provider: HierarchyProvider<T>, element: T) {
        yield* hasNextSibling(provider) && hasFirstChild(provider)
            ? followingUsingNextSiblingAndFirstChild(provider, element)
            : followingFallback(provider, element);
    }

    export function following<T>(provider: HierarchyProvider<T>, element: T) {
        if (!HierarchyProvider.hasInstance(provider)) throw new TypeError("HierarchyProvider expected: provider");
        return followingGen(provider, element);
    }
}
