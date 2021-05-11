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

import { Constructor, AbstractConstructor } from "@esfx/type-model";

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

type AbstractInstanceType<T extends abstract new (...args: any) => any> = T extends abstract new (...args: any) => infer R ? R : any;

/*@internal*/
export function isInstance<C extends Constructor>(value: unknown, ctor: C): value is InstanceType<C>;
/*@internal*/
export function isInstance<C extends AbstractConstructor>(value: unknown, ctor: C): value is AbstractInstanceType<C>;
/*@internal*/
export function isInstance(value: unknown, ctor: Function) {
    return !isMissing(value) && value instanceof ctor;
}

/*@internal*/
export function isMissing(value: unknown): value is null | undefined {
    return value === null
        || value === undefined;
}

/*@internal*/
export function isDefined<T>(value: T): value is NonNullable<T> {
    return value !== null && value !== undefined;
}

/*@internal*/
export function isIterable(value: unknown): value is Iterable<any> {
    return value !== undefined
        && value !== null
        && Symbol.iterator in Object(value);
}

/*@internal*/
export function isAsyncIterable(value: unknown): value is AsyncIterable<any> {
    return value !== undefined
        && value !== null
        && Symbol.asyncIterator in Object(value);
}

/** @internal */
export function isIterator(value: unknown): value is Iterator<unknown> {
    return isObject(value)
        && isFunction((value as Iterator<unknown>).next)
        && isFunctionOrUndefined((value as Iterator<unknown>).throw)
        && isFunctionOrUndefined((value as Iterator<unknown>).return)
        && isFunctionOrUndefined((value as IterableIterator<unknown>)[Symbol.iterator]);
}

/*@internal*/
export function isNumber(value: unknown): value is number {
    return typeof value === "number";
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
