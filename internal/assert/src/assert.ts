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

import * as Debug from "./debug";
import { isBoolean, isNumber, isString, isObject, isFunction, isIterable, isIterator, isAsyncIterable } from "@esfx/internal-guards";

/* @internal */
export function fail(ErrorType: new (message?: string) => Error, paramName: string | undefined, message: string | undefined, stackCrawlMark: Function = fail): never {
    const error = new ErrorType(typeof paramName === "string" ? message ? `${message}: ${paramName}` : `Invalid argument: ${paramName}` : message);
    Debug.captureStackTrace(error, stackCrawlMark || assertType);
    throw error;
}

/* @internal */
export function assert(condition: boolean, paramName?: string, message?: string, stackCrawlMark: Function = assert): asserts condition {
    if (!condition) fail(Error, paramName, message, stackCrawlMark);
}

/* @internal */
export function assertType(condition: boolean, paramName?: string, message?: string, stackCrawlMark: Function = assertType): asserts condition {
    if (!condition) fail(TypeError, paramName, message, stackCrawlMark);
}

/* @internal */
export function assertRange(condition: boolean, paramName?: string, message?: string, stackCrawlMark: Function = assertRange): asserts condition {
    if (!condition) fail(RangeError, paramName, message, stackCrawlMark)
}

/* @internal */
export function mustBeType<T>(test: (value: unknown) => value is T, value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeType): asserts value is T {
    assertType(test(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeInstanceOf<T>(C: new (...args: any[]) => T, value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeType): asserts value is T {
    assertType(value instanceof C, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeTypeOrUndefined<T>(test: (value: unknown) => value is T, value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeTypeOrUndefined): asserts value is T | undefined {
    if (value !== undefined) mustBeType(test, value, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeTypeOrNull<T>(test: (value: unknown) => value is T, value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeTypeOrNull): asserts value is T | null {
    if (value !== null) mustBeType(test, value, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeTypeInRange<T>(test: (value: unknown) => value is T, rangeTest: (value: T) => boolean, value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeTypeInRange): asserts value is T {
    mustBeType(test, value, paramName, message, stackCrawlMark);
    assertRange(rangeTest(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeBoolean(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeBoolean): asserts value is boolean {
    mustBeType(isBoolean, value, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeNumber(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeNumber): asserts value is number {
    mustBeType(isNumber, value, paramName, message, stackCrawlMark);
}

/* @internal */
export type tag_Finite = { tag_Finite: never };

/* @internal */
export type tag_Positive = { tag_Positive: never };

/* @internal */
export type tag_NonZero = { tag_NonZero: never };

/* @internal */
export type tag_Integer = { tag_Integer: never };

/* @internal */
export function mustBeFiniteNumber<T>(value: T, paramName?: string, message?: string, stackCrawlMark: Function = mustBeFiniteNumber): asserts value is Extract<T, number> & tag_Finite {
    mustBeTypeInRange(isNumber, isFinite, value, paramName, message, stackCrawlMark);
}

function isPositiveFinite(x: number) { return isFinite(x) && x >= 0; }

/* @internal */
export function mustBePositiveFiniteNumber<T>(value: T, paramName?: string, message?: string, stackCrawlMark: Function = mustBePositiveFiniteNumber): asserts value is Extract<T, number> & tag_Positive & tag_Finite {
    mustBeTypeInRange(isNumber, isPositiveFinite, value, paramName, message, stackCrawlMark);
}

function isPositiveNonZeroFinite(x: number) { return isFinite(x) && x > 0; }

/* @internal */
export function mustBePositiveNonZeroFiniteNumber<T>(value: T, paramName?: string, message?: string, stackCrawlMark: Function = mustBePositiveNonZeroFiniteNumber): asserts value is Exclude<Extract<T, number>, 0> & tag_Positive & tag_Finite & tag_NonZero {
    mustBeTypeInRange(isNumber, isPositiveNonZeroFinite, value, paramName, message, stackCrawlMark);
}

function isInteger(x: number) { return Object.is(x, x | 0); }

/* @internal */
export function mustBeInteger<T>(value: T, paramName?: string, message?: string, stackCrawlMark: Function = mustBeInteger): asserts value is Extract<T, number> & tag_Integer {
    mustBeTypeInRange(isNumber, isInteger, value, paramName, message, stackCrawlMark);
}

function isPositiveInteger(x: number) { return isInteger(x) && x >= 0; }

/* @internal */
export function mustBePositiveInteger<T>(value: T, paramName?: string, message?: string, stackCrawlMark: Function = mustBePositiveInteger): asserts value is Extract<T, number> & tag_Integer & tag_Positive {
    mustBeTypeInRange(isNumber, isPositiveInteger, value, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeString(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeString): asserts value is string {
    mustBeType(isString, value, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeObject(value: unknown, paramName?: string, message: string = "Object expected", stackCrawlMark: Function = mustBeObject): asserts value is object {
    mustBeType(isObject, value, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeObjectOrNull(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeObjectOrNull): asserts value is object | null {
    mustBeTypeOrNull(isObject, value, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeFunction(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeFunction): asserts value is Function {
    mustBeType(isFunction, value, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeFunctionOrUndefined(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeFunctionOrUndefined): asserts value is Function | undefined {
    mustBeTypeOrUndefined(isFunction, value, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeIterable(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeIterable): asserts value is Iterable<unknown> {
    mustBeType(isIterable, value, paramName, message, stackCrawlMark);
}

function isIterableObject(value: unknown): value is Iterable<unknown> & object {
    return isObject(value) && isIterable(value);
}

/* @internal */
export function mustBeIterableOrUndefined(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeIterableOrUndefined): asserts value is Iterable<unknown> | undefined {
    mustBeTypeOrUndefined(isIterable, value, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeIterableObject(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeIterable): asserts value is Iterable<unknown> & object {
    mustBeType(isIterableObject, value, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeIterableObjectOrUndefined(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeIterable): asserts value is Iterable<unknown> & object {
    mustBeTypeOrUndefined(isIterableObject, value, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeIterator(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeIterator): asserts value is Iterator<unknown, unknown, unknown> {
    mustBeType(isIterator, value, paramName, message, stackCrawlMark);
}

function isAsyncIterableObject(value: unknown): value is AsyncIterable<unknown> & object {
    return isObject(value) && isAsyncIterable(value);
}

/* @internal */
export function mustBeAsyncIterableObject(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeIterable): asserts value is AsyncIterable<unknown> & object {
    mustBeType(isAsyncIterableObject, value, paramName, message, stackCrawlMark);
}

function isAsyncOrSyncIterableObject(value: unknown): value is (AsyncIterable<unknown> | Iterable<unknown>) & object {
    return isObject(value) && (isAsyncIterable(value) || isIterable(value));
}

/* @internal */
export function mustBeAsyncOrSyncIterableObject(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeIterable): asserts value is (AsyncIterable<unknown> | Iterable<unknown>) & object {
    mustBeType(isAsyncOrSyncIterableObject, value, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeAsyncOrSyncIterableObjectOrUndefined(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeIterable): asserts value is (AsyncIterable<unknown> | Iterable<unknown>) & object | undefined {
    if (value !== undefined) mustBeType(isAsyncOrSyncIterableObject, value, paramName, message, stackCrawlMark);
}
