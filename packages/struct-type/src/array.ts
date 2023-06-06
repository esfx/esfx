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

import { ArrayTypeImpl } from "./internal/array/arrayTypeImpl.js";
import type { InitType, RuntimeType, Type } from "./type.js";

export interface TypedArray<TType extends Type, TFixedLength extends number = number> {
    [i: number]: RuntimeType<TType>;

    readonly length: TFixedLength;
    readonly buffer: ArrayBufferLike;
    readonly byteOffset: number;
    readonly byteLength: number;

    writeTo(buffer: ArrayBufferLike, byteOffset?: number): void;
    toArray(): RuntimeType<TType>[];
    copyWithin(target: number, start: number, end?: number): this;
    every(predicate: (value: RuntimeType<TType>, index: number) => unknown): boolean;
    some(predicate: (value: RuntimeType<TType>, index: number) => unknown): boolean;
    fill(value: RuntimeType<TType>, start?: number, end?: number): this;
    filter(predicate: (value: RuntimeType<TType>, index: number) => unknown): TypedArray<TType>;
    find(predicate: (value: RuntimeType<TType>, index: number) => unknown, fromIndex?: number): RuntimeType<TType> | undefined;
    findIndex(predicate: (value: RuntimeType<TType>, index: number) => unknown, fromIndex?: number): number;
    findLast(predicate: (value: RuntimeType<TType>, index: number) => unknown, fromIndex?: number): RuntimeType<TType> | undefined;
    findLastIndex(predicate: (value: RuntimeType<TType>, index: number) => unknown, fromIndex?: number): number;
    forEach(callbackfn: (value: RuntimeType<TType>, index: number) => void): void;
    map(callbackfn: (value: RuntimeType<TType>, index: number) => RuntimeType<TType>): TypedArray<TType, TFixedLength>;
    mapToArray<U>(callbackfn: (value: RuntimeType<TType>, index: number) => U): U[];
    reduce(callbackfn: (previousValue: RuntimeType<TType>, value: RuntimeType<TType>, index: number) => RuntimeType<TType>): RuntimeType<TType>;
    reduce<U>(callbackfn: (previousValue: U, value: RuntimeType<TType>, index: number) => U, initialValue: U): U;
    reduceRight(callbackfn: (previousValue: RuntimeType<TType>, value: RuntimeType<TType>, index: number) => RuntimeType<TType>): RuntimeType<TType>;
    reduceRight<U>(callbackfn: (previousValue: U, value: RuntimeType<TType>, index: number) => U, initialValue: U): U;
    set(array: ArrayLike<RuntimeType<TType>>, offset?: number): void;
    subarray(start?: number, end?: number): TypedArray<TType>;
    slice(start?: number, end?: number): TypedArray<TType>;
    at(index: number): RuntimeType<TType> | undefined;
    keys(): IterableIterator<number>;
    values(): IterableIterator<RuntimeType<TType>>;
    entries(): IterableIterator<[number, RuntimeType<TType>]>;
    [Symbol.iterator](): IterableIterator<RuntimeType<TType>>;
}

/**
 * Represents the constructor for a TypedArray
 */
export interface ArrayType<TType extends Type> {
    new (length: number): TypedArray<TType>;
    new (length: number, shared: boolean): TypedArray<TType>;
    new (buffer: ArrayBufferLike, byteOffset?: number, length?: number): TypedArray<TType>;
    new (elements: ArrayLike<InitType<TType>>, shared?: boolean): TypedArray<TType>;

    readonly BYTES_PER_ELEMENT: number;
    readonly SIZE: number | undefined;
    readonly fixedLength: number | undefined;
    prototype: TypedArray<TType>;

    toFixed<TFixedLength extends number>(fixedLength: TFixedLength): FixedLengthArrayType<TType, TFixedLength>;

    // #region Related Types
    [RuntimeType]: TypedArray<TType, number>;
    [InitType]: TypedArray<TType, number> | ArrayLike<InitType<TType>>;
    // #endregion
}

/**
 * Represents the constructor for a fixed-length TypedArray
 */
export interface FixedLengthArrayType<TType extends Type, TFixedLength extends number = number> {
    new (): TypedArray<TType, TFixedLength>;
    new (shared: boolean): TypedArray<TType, TFixedLength>;
    new (buffer: ArrayBufferLike, byteOffset?: number): TypedArray<TType, TFixedLength>;
    new (elements: ArrayLike<InitType<TType>>, shared?: boolean): TypedArray<TType, TFixedLength>;

    readonly BYTES_PER_ELEMENT: number;
    readonly SIZE: number;
    readonly fixedLength: TFixedLength;
    prototype: TypedArray<TType, TFixedLength>;

    toFixed<TFixedLength extends number>(fixedLength: TFixedLength): FixedLengthArrayType<TType, TFixedLength>;

    // #region Related Types
    [RuntimeType]: TypedArray<TType, TFixedLength>;
    [InitType]: TypedArray<TType, TFixedLength> | ArrayLike<InitType<TType>>;
    // #endregion
}

export interface ArrayTypeConstructor {
    /**
     * Creates a new TypedArray type from the provided type.
     * @param type The type for each element in the TypedArray type.
     */
    <TType extends Type>(type: TType): ArrayType<TType>;
    /**
     * Creates a new fixed-length TypedArray type from the provided type.
     * @param type The type for each element in the TypedArray type.
     * @param length The fixed length of the TypedArray type.
     */
    <TType extends Type, TFixedLength extends number>(type: TType, length: TFixedLength): FixedLengthArrayType<TType, TFixedLength>;

    /**
     * Creates a new TypedArray type from the provided type.
     * @param type The type for each element in the TypedArray type.
     */
    new <TType extends Type>(type: TType): ArrayType<TType>;
    /**
     * Creates a new fixed-length TypedArray type from the provided type.
     * @param type The type for each element in the TypedArray type.
     * @param length The fixed length of the TypedArray type.
     */
    new <TType extends Type, TLength extends number>(type: TType, length: TLength): FixedLengthArrayType<TType, TLength>;

    prototype: Omit<ArrayType<any>, never>;
}

/**
 * Creates a new `TypedArray` type for a provided type.
 */
export const ArrayType = ArrayTypeImpl as ArrayTypeConstructor;
