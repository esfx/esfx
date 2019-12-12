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
import { isObject, isIterable } from "@esfx/internal-guards";

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
export function mustBeBoolean(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeBoolean): asserts value is boolean {
    assertType(typeof value === "boolean", paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeNumber(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeNumber): asserts value is number {
    assertType(typeof value === "number", paramName, message, stackCrawlMark);
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
    mustBeNumber(value, paramName, message, stackCrawlMark);
    assertRange(isFinite(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBePositiveFiniteNumber<T>(value: T, paramName?: string, message?: string, stackCrawlMark: Function = mustBePositiveFiniteNumber): asserts value is Extract<T, number> & tag_Positive & tag_Finite {
    mustBeNumber(value, paramName, message, stackCrawlMark);
    assertRange(isFinite(value) && value >= 0, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBePositiveNonZeroFiniteNumber<T>(value: T, paramName?: string, message?: string, stackCrawlMark: Function = mustBePositiveNonZeroFiniteNumber): asserts value is Exclude<Extract<T, number>, 0> & tag_Positive & tag_Finite & tag_NonZero {
    mustBeNumber(value, paramName, message, stackCrawlMark);
    assertRange(isFinite(value) && value > 0, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeInteger<T>(value: T, paramName?: string, message?: string, stackCrawlMark: Function = mustBeInteger): asserts value is Extract<T, number> & tag_Integer {
    mustBeNumber(value, paramName, message, stackCrawlMark);
    assertRange(Object.is(value, value | 0), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBePositiveInteger<T>(value: T, paramName?: string, message?: string, stackCrawlMark: Function = mustBePositiveInteger): asserts value is Extract<T, number> & tag_Integer & tag_Positive {
    mustBeNumber(value, paramName, message, stackCrawlMark);
    assertType(Object.is(value, value | 0), paramName, message, stackCrawlMark);
    assertRange(value >= 0, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeString(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeString): asserts value is string {
    assertType(typeof value === "string", paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeObject(value: unknown, paramName?: string, message: string = "Object expected", stackCrawlMark: Function = mustBeObject): asserts value is object {
    assertType(isObject(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeObjectOrNull(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeObjectOrNull): asserts value is object | null {
    if (value !== null) mustBeObject(value, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeFunction(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeFunction): asserts value is Function {
    assertType(typeof value === "function", paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeFunctionOrUndefined(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeFunctionOrUndefined): asserts value is Function | undefined {
    if (value !== undefined) mustBeFunction(value, paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeIterable(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeIterable): asserts value is Iterable<unknown> {
    mustBeObject(value, paramName, message, stackCrawlMark);
    assertType(isIterable(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeIterableOrUndefined(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeIterableOrUndefined): asserts value is Iterable<unknown> | undefined {
    if (value !== undefined) mustBeIterable(value, paramName, message, stackCrawlMark);
}
