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

import { HierarchyProvider, HierarchyIterable, Hierarchical, OrderedHierarchyIterable } from "../hierarchy";


/** @internal */
export * from '@esfx/internal-guards';

import { isIterable } from '@esfx/internal-guards';
import { Equaler, Comparer } from '@esfx/equatable';
import { OrderedIterable } from "../ordered";

/** @internal */
export function isEqualer(x: unknown): x is Equaler<unknown> {
    return typeof x === "object"
        && x !== null
        && "equals" in x && typeof (x as Equaler<unknown>).equals === "function"
        && "hash" in x && typeof (x as Equaler<unknown>).hash === "function";
}

/** @internal */
export function isComparer(x: unknown): x is Comparer<unknown> {
    return typeof x === "object"
        && x !== null
        && "compare" in x && typeof (x as Comparer<unknown>).compare === "function";
}

/** @internal */
export function isOrderedIterable(x: unknown): x is OrderedIterable<unknown> {
    return isIterable(x)
        && OrderedIterable.thenBy in x;
}

/** @internal */
export function isHierarchyIterable<T>(x: Iterable<T>): x is HierarchyIterable<unknown, T>;
/** @internal */
export function isHierarchyIterable(x: unknown): x is HierarchyIterable<unknown>;
export function isHierarchyIterable(x: unknown): x is HierarchyIterable<unknown> {
    return isIterable(x)
        && Hierarchical.hierarchy in x;
}

/** @internal */
export function isOrderedHierarchyIterable(x: unknown): x is OrderedHierarchyIterable<unknown> {
    return isIterable(x)
        && OrderedIterable.thenBy in x
        && Hierarchical.hierarchy in x;
}

/** @internal */
export type HasPreviousSibling<T> = Pick<Required<HierarchyProvider<T>>, "previousSibling">;
/** @internal */
export type HasNextSibling<T> = Pick<Required<HierarchyProvider<T>>, "nextSibling">;
/** @internal */
export type HasFirstChild<T> = Pick<Required<HierarchyProvider<T>>, "firstChild">;
/** @internal */
export type HasLastChild<T> = Pick<Required<HierarchyProvider<T>>, "lastChild">;

/** @internal */
export function hasPreviousSibling<T>(provider: HierarchyProvider<T>): provider is HierarchyProvider<T> & HasPreviousSibling<T> {
    return provider.previousSibling !== undefined;
}

/** @internal */
export function hasNextSibling<T>(provider: HierarchyProvider<T>): provider is HierarchyProvider<T> & HasNextSibling<T> {
    return provider.nextSibling !== undefined;
}

/** @internal */
export function hasFirstChild<T>(provider: HierarchyProvider<T>): provider is HierarchyProvider<T> & HasFirstChild<T> {
    return provider.firstChild !== undefined;
}

/** @internal */
export function hasLastChild<T>(provider: HierarchyProvider<T>): provider is HierarchyProvider<T> & HasLastChild<T> {
    return provider.lastChild !== undefined;
}

/** @internal */
export function isHierarchyElement<T>(provider: HierarchyProvider<T>, value: T) {
    return value !== undefined && (provider.owns === undefined || provider.owns(value));
}
