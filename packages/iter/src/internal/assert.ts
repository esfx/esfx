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

/** @internal */
export * from "@esfx/internal-assert";

import { mustBeObject, assertType, mustBeFunction, mustBeFunctionOrUndefined } from '@esfx/internal-assert';
import { Equaler, Comparer } from '@esfx/equatable';
import { isFunction, isDefined } from '@esfx/internal-guards';
import { OrderedIterable } from "../ordered";
import { isIterable, isEqualer, isComparer } from './guards';
import { HierarchyIterable, Hierarchical, OrderedHierarchyIterable, HierarchyProvider } from '../hierarchy';

/** @internal */
export function mustBeEqualer(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeEqualer): asserts value is Equaler<unknown> {
    mustBeObject(value, paramName, message, stackCrawlMark);
    assertType(isEqualer(value), paramName, message, stackCrawlMark);
}

/** @internal */
export function mustBeEqualerOrUndefined(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeEqualerOrUndefined): asserts value is Equaler<unknown> | undefined {
    if (value !== undefined) mustBeEqualer(value, paramName, message, stackCrawlMark);
}

/** @internal */
export function mustBeComparer(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeComparer): asserts value is Comparer<unknown> {
    mustBeObject(value, paramName, message, stackCrawlMark);
    assertType(isComparer(value), paramName, message, stackCrawlMark);
}

/** @internal */
export function mustBeIterator(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeIterator): asserts value is Iterator<unknown> {
    mustBeObject(value, paramName, message, stackCrawlMark);
    mustBeFunction((value as Iterator<unknown>).next, paramName, message, stackCrawlMark);
    mustBeFunctionOrUndefined((value as Iterator<unknown>).return, paramName, message, stackCrawlMark);
}

/** @internal */
export function mustBeOrderedIterable(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeOrderedIterable): asserts value is OrderedIterable<unknown> {
    mustBeObject(value, paramName, message, stackCrawlMark);
    assertType(isIterable(value) && OrderedIterable.thenBy in value, paramName, message, stackCrawlMark);
}

/** @internal */
export function mustBeHierarchyIterable(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeHierarchyIterable): asserts value is HierarchyIterable<unknown> {
    mustBeObject(value, paramName, message, stackCrawlMark);
    assertType(isIterable(value) && Hierarchical.hierarchy in value, paramName, message, stackCrawlMark);
}

function isFunctionOrUndefined(value: unknown) {
    return isFunction(value) || value === undefined;
}

/** @internal */
export function mustBeHierarchyProvider(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeHierarchyProvider): asserts value is HierarchyProvider<unknown> {
    mustBeObject(value, paramName, message, stackCrawlMark);
    assertType(
        isFunction((value as HierarchyProvider<unknown>).parent) &&
        isFunction((value as HierarchyProvider<unknown>).children) &&
        isFunctionOrUndefined((value as HierarchyProvider<unknown>).owns) &&
        isFunctionOrUndefined((value as HierarchyProvider<unknown>).root) &&
        isFunctionOrUndefined((value as HierarchyProvider<unknown>).firstChild) &&
        isFunctionOrUndefined((value as HierarchyProvider<unknown>).lastChild) &&
        isFunctionOrUndefined((value as HierarchyProvider<unknown>).previousSibling) &&
        isFunctionOrUndefined((value as HierarchyProvider<unknown>).nextSibling),
        paramName, message, stackCrawlMark);
}

/** @internal */
export function mustBeHierarchyProviderOrUndefined(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeHierarchyProviderOrUndefined): asserts value is HierarchyProvider<unknown> | undefined {
    if (value !== undefined) mustBeHierarchyProvider(value, paramName, message, stackCrawlMark);
}

/** @internal */
export function mustBeOrderedHierarchyIterable(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeOrderedHierarchyIterable): asserts value is OrderedHierarchyIterable<unknown> {
    mustBeObject(value, paramName, message, stackCrawlMark);
    assertType(isIterable(value) && Hierarchical.hierarchy in value && OrderedIterable.thenBy in value, paramName, message, stackCrawlMark);
}
