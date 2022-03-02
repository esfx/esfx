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

import /*#__INLINE__*/ { isBoolean, isNumber, isString, isObject, isFunction, isIterable, isIterator, isAsyncIterable, IsFiniteNumber, isPositiveFiniteNumber, isPositiveNonZeroFiniteNumber, isInteger, isPositiveInteger, IsInteger, IsPositiveNumber, IsNonZeroNumber } from "@esfx/internal-guards";

namespace Debug {
    interface ErrorConstructorWithStackTraceApi extends ErrorConstructor {
        captureStackTrace(target: any, stackCrawlMark?: Function): void;
    }

    declare const Error: ErrorConstructorWithStackTraceApi;

    export function captureStackTrace(error: any, stackCrawlMark?: Function) {
        if (typeof error === "object" && error !== null && Error.captureStackTrace) {
            Error.captureStackTrace(error, stackCrawlMark || captureStackTrace);
        }
    }
}

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
    assertType(isBoolean(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeNumber(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeNumber): asserts value is number {
    assertType(isNumber(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeFiniteNumber<T>(value: T, paramName?: string, message?: string, stackCrawlMark: Function = mustBeFiniteNumber): asserts value is Extract<T, number> & IsFiniteNumber {
    assertType(isNumber(value), paramName, message, stackCrawlMark);
    assertRange(isFinite(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBePositiveFiniteNumber<T>(value: T, paramName?: string, message?: string, stackCrawlMark: Function = mustBePositiveFiniteNumber): asserts value is Extract<T, number> & IsPositiveNumber & IsFiniteNumber {
    assertType(isNumber(value), paramName, message, stackCrawlMark);
    assertRange(isPositiveFiniteNumber(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBePositiveNonZeroFiniteNumber<T>(value: T, paramName?: string, message?: string, stackCrawlMark: Function = mustBePositiveNonZeroFiniteNumber): asserts value is Exclude<Extract<T, number>, 0> & IsPositiveNumber & IsFiniteNumber & IsNonZeroNumber {
    assertType(isNumber(value), paramName, message, stackCrawlMark);
    assertRange(isPositiveNonZeroFiniteNumber(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeInteger<T>(value: T, paramName?: string, message?: string, stackCrawlMark: Function = mustBeInteger): asserts value is Extract<T, number> & IsInteger {
    assertType(isNumber(value), paramName, message, stackCrawlMark);
    assertRange(isInteger(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBePositiveInteger<T>(value: T, paramName?: string, message?: string, stackCrawlMark: Function = mustBePositiveInteger): asserts value is Extract<T, number> & IsPositiveNumber & IsInteger {
    assertType(isNumber(value), paramName, message, stackCrawlMark);
    assertRange(isPositiveInteger(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeString(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeString): asserts value is string {
    assertType(isString(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeObject(value: unknown, paramName?: string, message: string = "Object expected", stackCrawlMark: Function = mustBeObject): asserts value is object {
    assertType(isObject(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeObjectOrNull(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeObjectOrNull): asserts value is object | null {
    assertType(value === null || isObject(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeFunction(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeFunction): asserts value is Function {
    assertType(isFunction(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeFunctionOrUndefined(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeFunctionOrUndefined): asserts value is Function | undefined {
    assertType(value === undefined || isFunction(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeIterable(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeIterable): asserts value is Iterable<unknown> {
    assertType(isIterable(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeIterableOrUndefined(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeIterableOrUndefined): asserts value is Iterable<unknown> | undefined {
    assertType(value === undefined || isIterable(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeIterableObject(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeIterableObject): asserts value is Iterable<unknown> & object {
    assertType(isObject(value) && isIterable(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeIterableObjectOrUndefined(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeIterableObjectOrUndefined): asserts value is Iterable<unknown> & object {
    assertType(value === undefined || isObject(value) && isIterable(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeIterator(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeIterator): asserts value is Iterator<unknown, unknown, unknown> {
    assertType(isIterator(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeAsyncIterableObject(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeAsyncIterableObject): asserts value is AsyncIterable<unknown> & object {
    assertType(isObject(value) && isAsyncIterable(value), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeAsyncOrSyncIterableObject(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeAsyncOrSyncIterableObject): asserts value is (AsyncIterable<unknown> | Iterable<unknown>) & object {
    assertType(isObject(value) && (isAsyncIterable(value) || isIterable(value)), paramName, message, stackCrawlMark);
}

/* @internal */
export function mustBeAsyncOrSyncIterableObjectOrUndefined(value: unknown, paramName?: string, message?: string, stackCrawlMark: Function = mustBeAsyncOrSyncIterableObjectOrUndefined): asserts value is (AsyncIterable<unknown> | Iterable<unknown>) & object | undefined {
    assertType(value === undefined || isObject(value) && (isAsyncIterable(value) || isIterable(value)), paramName, message, stackCrawlMark);
}
