/*
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

import type { Constructor, AbstractConstructor } from "@esfx/type-model";

/*@internal*/
export function isFunction(value: unknown): value is Function {
    return typeof value === "function";
}

/*@internal*/
export function isFunctionOrUndefined(value: unknown): value is Function | undefined {
    return typeof value === "function" || value === undefined;
}

/*@internal*/
export function isObject(value: unknown): value is object {
    return typeof value === "object" && value !== null
        || typeof value === "function";
}

/*@internal*/
export function isInstance<C extends Constructor | AbstractConstructor>(value: unknown, ctor: C): value is InstanceType<C> {
    return !isMissing(value) && value instanceof ctor;
}

/*@internal*/
export function isUndefined(value: unknown): value is undefined {
    return value === undefined;
}

/*@internal*/
export function isDefined<T>(value: T): value is T extends undefined ? never : T {
    return value === undefined;
}

/*@internal*/
export function isMissing(value: unknown): value is null | undefined {
    return value === null
        || value === undefined;
}

/*@internal*/
export function isPresent<T>(value: T): value is NonNullable<T> {
    return value !== null
        && value !== undefined;
}

/*@internal*/
export function isIterable(value: unknown): value is Iterable<any> {
    return value !== undefined
        && value !== null
        && Symbol.iterator in Object(value);
}

/*@internal*/
export function isIterableObject(value: unknown): value is object & Iterable<any> {
    return isObject(value) && Symbol.iterator in value;
}

/*@internal*/
export function isAsyncIterable(value: unknown): value is AsyncIterable<any> {
    return value !== undefined
        && value !== null
        && Symbol.asyncIterator in Object(value);
}

/*@internal*/
export function isAsyncIterableObject(value: unknown): value is object & AsyncIterable<any> {
    return isObject(value) && Symbol.asyncIterator in value;
}

/** @internal */
export function isIterator(value: unknown): value is Iterator<unknown> {
    return isObject(value)
        && isFunction((value as Iterator<unknown>).next)
        && isFunctionOrUndefined((value as Iterator<unknown>).throw)
        && isFunctionOrUndefined((value as Iterator<unknown>).return)
        && isFunctionOrUndefined((value as IterableIterator<unknown>)[Symbol.iterator]);
}

declare const kFinite: unique symbol;
declare const kPositive: unique symbol;
declare const kNonZero: unique symbol;
declare const kInteger: unique symbol;

/* @internal */
export interface IsFiniteNumber { [kFinite]: never };

/* @internal */
export interface IsPositiveNumber { [kPositive]: never };

/* @internal */
export interface IsNonZeroNumber { [kNonZero]: never };

/* @internal */
export interface IsInteger extends IsFiniteNumber { [kInteger]: never };

/*@internal*/
export function isNumber(value: unknown): value is number {
    return typeof value === "number";
}

/*@internal*/
export function isPositiveFiniteNumber(value: number): value is number & IsPositiveNumber & IsFiniteNumber {
    return isFinite(value) && value >= 0;
}

/*@internal*/
export function isPositiveNonZeroFiniteNumber(value: number): value is number & IsPositiveNumber & IsFiniteNumber & IsNonZeroNumber {
    return isFinite(value) && value > 0;
}

/*@internal*/
export function isInteger(value: number): value is number & IsInteger {
    return Object.is(value, value | 0);
}

/*@internal*/
export function isPositiveInteger(value: number): value is number & IsPositiveNumber & IsInteger {
    return isInteger(value) && value >= 0;
}

/*@internal*/
export function isBoolean(value: unknown): value is boolean {
    return typeof value === "boolean";
}

/*@internal*/
export function isString(value: unknown): value is string {
    return typeof value === "string";
}

/*@internal*/
export function isPropertyKey(value: unknown): value is PropertyKey {
    return typeof value === "string"
        || typeof value === "symbol"
        || typeof value === "number";
}

/*@internal*/
export function isPrimitive(value: unknown): value is string | symbol | number | bigint | boolean | undefined | null {
    return typeof value !== "function"
        && (typeof value !== "object" || value === null);
}
