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

import { conststring, constsymbol, numstr } from "@esfx/type-model";
import * as arrayType from "./arrayType.js";
import * as primitives from "./primitives.js";
import * as structType from "./structType.js";

// NOTE: We use a non-existent, unreachable, unique symbol to store related type information on
//       some definitions to avoid hitting the recursive instantiation limit, which we would hit
//       much faster were we to use multiple conditional types and `infer` to do the same thing.
declare const RelatedTypes: unique symbol;

/**
 * Gets the runtime type from a type definition.
 */
export type RuntimeType<TType extends Type> = NonNullable<TType[typeof RelatedTypes]>["RuntimeType"];

/**
 * Gets a runtime type from a type definition that can be used to initialize a value of that type.
 */
export type InitType<TType extends Type> = NonNullable<TType[typeof RelatedTypes]>["InitType"];

/**
 * Represents a primitive type.
 */
export interface PrimitiveType<K extends string = string, T extends number | bigint = number | bigint> {
    /**
     * Coerce the provided value into a value of this type.
     */
    (value: number | bigint): T;

    /**
     * The name of the primitive type.
     */
    readonly name: K;

    /**
     * The size, in bytes, of the primitive type.
     */
    readonly SIZE: number;

    // #region Related Types
    [RelatedTypes]?: {
        RuntimeType: T;
        InitType: number | bigint;
    };
    // #endregion
}

/**
 * A primitive type representing a 1-byte signed integer.
 *
 * Aliases: `i8`, `sbyte`
 */
export const int8 = primitives.int8;

/**
 * A primitive type representing a 2-byte signed integer.
 *
 * Aliases: `i16`, `short`
 */
export const int16 = primitives.int16;

/**
 * A primitive type representing a 4-byte signed integer.
 *
 * Aliases: `i32`, `int`
 */
export const int32 = primitives.int32;

/**
 * A primitive type representing a 1-byte unsigned integer.
 *
 * Aliases: `u8`, `byte`
 */
export const uint8 = primitives.uint8;

/**
 * A primitive type representing a 2-byte unsigned integer.
 *
 * Aliases: `u16`, `ushort`
 */
export const uint16 = primitives.uint16;

/**
 * A primitive type representing a 4-byte unsigned integer.
 *
 * Aliases: `u32`, `uint`
 */
export const uint32 = primitives.uint32;

/**
 * A primitive type representing an 8-byte signed integer.
 *
 * Aliases: `i64`, `long`
 */
export const bigint64 = primitives.bigint64;

/**
 * A primitive type representing an 8-byte unsigned integer.
 *
 * Aliases: `u64`, `ulong`
 */
export const biguint64 = primitives.biguint64;

/**
 * A primitive type representing a 4-byte floating point number.
 *
 * Aliases: `f32`, `float`
 */
export const float32 = primitives.float32;

/**
 * A primitive type representing an 8-byte floating point number.
 *
 * Aliases: `f64`, `double`
 */
export const float64 = primitives.float64;

// wasm type names
export {
    int8 as i8,
    int16 as i16,
    int32 as i32,
    uint8 as u8,
    uint16 as u16,
    uint32 as u32,
    bigint64 as i64,
    biguint64 as u64,
    float32 as f32,
    float64 as f64,
};

// other type aliases
export {
    int8 as sbyte,
    int8 as char,
    int16 as short,
    int32 as int,
    uint8 as byte,
    uint8 as uchar,
    uint16 as ushort,
    uint32 as uint,
    bigint64 as long,
    biguint64 as ulong,
    float32 as float,
    float64 as double,
};


export type PrimitiveTypes =
    | typeof int8
    | typeof int16
    | typeof int32
    | typeof uint8
    | typeof uint16
    | typeof uint32
    | typeof bigint64
    | typeof biguint64
    | typeof float32
    | typeof float64
    ;

export type Type =
    | PrimitiveTypes
    | StructType<any>
    | ArrayType<any>
    | FixedLengthArrayType<any>;

export interface StructFieldDefinition {
    readonly name: conststring | constsymbol;
    readonly type: Type;
}

export interface StructDefinition<
    TFields extends { [key: string | symbol]: Type } = any,
    TOrder extends readonly (keyof TFields)[] | "unspecified" = any
> {
    fields: TFields;
    order: TOrder;
}

export type StructInheritedDefinition<
    TBaseDef extends StructDefinition,
    TFields extends { [key: string | symbol]: Type },
    TOrder extends readonly (keyof TFields)[] | "unspecified",
> = StructDefinition<
    TBaseDef["fields"] & TFields,
    TBaseDef["order"] extends "unspecified" ? TBaseDef["order"] :
    TOrder extends "unspecified" ? TBaseDef["order"] & "unspecified" :
    TOrder extends readonly (keyof TFields)[] ? [...TBaseDef["order"], ...TOrder] :
    "unspecified"
>;

export type StructDefinitionOf<TDef extends readonly StructFieldDefinition[]> = StructDefinition<
    { [I in Extract<numstr<keyof TDef>, number> as TDef[I]["name"]]: TDef[I]["type"]; },
    { [I in keyof TDef]: TDef[I] extends StructFieldDefinition ? TDef[I]["name"] : TDef[I] }
>;

export type StructFieldLayout<TDef extends StructDefinition> = {
    /**
     * Gets or sets a named field of the struct.
     */
    -readonly [K in StructPropertyLayoutKeys<TDef>]: RuntimeType<TDef["fields"][K]>;
};

export type StructElementLayout<TDef extends StructDefinition> = {
    /**
     * Gets or sets a named field of the struct.
     */
    -readonly [I in StructElementLayoutIndices<TDef>]: RuntimeType<TDef["fields"][TDef["order"][I]]>;
};

export type StructPropertyLayoutKeys<TDef extends StructDefinition> = keyof TDef["fields"];
export type StructElementLayoutIndices<TDef extends StructDefinition> = TDef["order"] extends "unspecified" ? never : numstr<keyof TDef["order"]>;

/**
 * Represents an instance of a struct type.
 */
export type Struct<TDef extends StructDefinition = StructDefinition> = {
    /**
     * Gets the underlying `ArrayBuffer` or `SharedArrayBuffer` of a struct.
     */
    readonly buffer: ArrayBufferLike;

    /**
     * Gets the byte offset into this struct's `buffer` at which the struct starts.
     */
    readonly byteOffset: number;

    /**
     * Gets the size of this struct in bytes.
     */
    readonly byteLength: number;

    /**
     * Gets the value of a named field of this struct.
     */
    get<K extends StructPropertyLayoutKeys<TDef>>(key: K): StructFieldLayout<TDef>[K];

    /**
     * Sets the value of a named field of this struct.
     */
    set<K extends StructPropertyLayoutKeys<TDef>>(key: K, value: StructFieldLayout<TDef>[K]): void;

    /**
     * Gets the value of an ordinal field of this struct.
     */
    getIndex<I extends StructElementLayoutIndices<TDef>>(index: I): StructElementLayout<TDef>[I];

    /**
     * Sets the value of an ordinal field of this struct.
     */
    setIndex<I extends StructElementLayoutIndices<TDef>>(index: I, value: StructElementLayout<TDef>[I]): boolean;

    /**
     * Writes the value of this struct to an array buffer.
     */
    writeTo(buffer: ArrayBufferLike, byteOffset?: number): void;
} & StructFieldLayout<TDef> & StructElementLayout<TDef>;

/**
 * Describes the properties that can be used to initialize a struct.
 */
export type StructObjectInit<TDef extends StructDefinition> = {
    [P in keyof TDef["fields"]]: InitType<TDef["fields"][P]>;
};

/**
 * Describes the ordered elements that can be used to initialize a struct.
 */
export type StructArrayInit<TDef extends StructDefinition> = TDef["order"] extends "unspecified" ? never : {
    [I in keyof TDef["order"]]: InitType<TDef["fields"][TDef["order"][I]]>;
};

/**
 * Represents the constructor for a struct.
 */
export interface StructType<TDef extends StructDefinition> {
    new (): Struct<TDef>;
    new (shared: boolean): Struct<TDef>;
    new (buffer: ArrayBufferLike, byteOffset?: number): Struct<TDef>;
    new (object: Partial<StructObjectInit<TDef>>, shared?: boolean): Struct<TDef>;
    new (elements: Partial<StructArrayInit<TDef>>, shared?: boolean): Struct<TDef>;

    readonly SIZE: number;
    prototype: Struct<any>;

    // #region Related Types
    [RelatedTypes]?: {
        RuntimeType: Struct<TDef>;
        InitType: Struct<TDef> | StructObjectInit<TDef> | StructArrayInit<TDef>;
    };
    // #endregion
}

/**
 * Represents the constructor for a struct type.
 */
export interface StructTypeConstructor {
    /**
     * Creates a new Struct type from the provided field definition.
     * @param fields An array of `StructFieldDefinition` entries describing the ordered fields in the struct.
     * @param name A name for the struct.
     */
    <TDef extends readonly StructFieldDefinition[] | readonly []>(fields: TDef, name?: string): StructType<StructDefinitionOf<TDef>>;
    /**
     * Creates a new Struct type from the provided field definition.
     *
     * NOTE: Field order is determined by property definition order in the object, but that cannot be determined via type inference.
     * @param fields An object mapping ordered field names to data types in the struct.
     * @param name A name for the struct.
     */
    <TFields extends { readonly [key: string | symbol]: Type }>(fields: TFields, name?: string): StructType<StructDefinition<TFields, "unspecified">>;
    /**
     * Creates a new Struct type from the provided field definition.
     * @param fields An object mapping ordered field names to data types in the struct.
     * @param order An used to specify the field order in the struct.
     * @param name A name for the struct.
     */
    <TFields extends { readonly [key: string | symbol]: Type }, TOrder extends readonly (keyof TFields)[] | readonly []>(fields: TFields, order: TOrder, name?: string): StructType<StructDefinition<TFields, TOrder>>;

    /**
     * Creates a new Struct type from the provided field definition.
     * @param baseType A base struct from which this struct is derived. Fields in the new struct will come after fields in the base struct.
     * @param fields An array of `StructFieldDefinition` entries describing the ordered fields in the struct.
     * @param name A name for the struct.
     */
    <TDef extends readonly StructFieldDefinition[] | readonly [], TBaseDef extends readonly StructFieldDefinition[]>(baseType: StructType<StructDefinitionOf<TBaseDef>>, fields: TDef, name?: string): StructType<StructDefinitionOf<readonly [...TBaseDef, ...TDef]>>;
    /**
     * Creates a new Struct type from the provided field definition.
     *
     * NOTE: Field order is determined by property definition order in the object, but that cannot be determined via type inference.
     * @param baseType A base struct from which this struct is derived. Fields in the new struct will come after fields in the base struct.
     * @param fields An object mapping ordered field names to data types in the struct.
     * @param name A name for the struct.
     */
    <TBaseDef extends StructDefinition, TFields extends { readonly [key: string | symbol]: Type }>(baseType: StructType<TBaseDef>, fields: TFields, name?: string): StructType<StructInheritedDefinition<TBaseDef, TFields, "unspecified">>;
    /**
     * Creates a new Struct type from the provided field definition.
     * @param baseType A base struct from which this struct is derived. Fields in the new struct will come after fields in the base struct.
     * @param fields An object mapping ordered field names to data types in the struct.
     * @param order An used to specify the field order in the struct.
     * @param name A name for the struct.
     */
    <TBaseDef extends StructDefinition, TFields extends { readonly [key: string | symbol]: Type }, TOrder extends readonly (keyof TFields)[] | readonly []>(baseType: StructType<TBaseDef>, fields: TFields, order: TOrder, name?: string): StructType<StructInheritedDefinition<TBaseDef, TFields, TOrder>>;

    /**
     * Creates a new Struct type from the provided field definition.
     * @param fields An array of `StructFieldDefinition` entries describing the ordered fields in the struct.
     * @param name A name for the struct.4
     */
    new <TDef extends readonly StructFieldDefinition[] | readonly []>(fields: TDef, name?: string): StructType<StructDefinitionOf<TDef>>;
    /**
     * Creates a new Struct type from the provided field definition.
     *
     * NOTE: Field order is determined by property definition order in the object, but that cannot be determined via type inference.
     * @param fields An object mapping ordered field names to data types in the struct.
     * @param name A name for the struct.
     */
    new <TFields extends { readonly [key: string | symbol]: Type }>(fields: TFields, name?: string): StructType<StructDefinition<TFields, "unspecified">>;
    /**
     * Creates a new Struct type from the provided field definition.
     * @param fields An object mapping ordered field names to data types in the struct.
     * @param order An used to specify the field order in the struct.
     * @param name A name for the struct.
     */
    new <TFields extends { readonly [key: string | symbol]: Type }, TOrder extends readonly (keyof TFields)[] | readonly []>(fields: TFields, order: TOrder, name?: string): StructType<StructDefinition<TFields, TOrder>>;

    /**
     * Creates a new Struct type from the provided field definition.
     * @param baseType A base struct from which this struct is derived. Fields in the new struct will come after fields in the base struct.
     * @param fields An array of `StructFieldDefinition` entries describing the ordered fields in the struct.
     * @param name A name for the struct.
     */
    new <TDef extends readonly StructFieldDefinition[] | readonly [], TBaseDef extends readonly StructFieldDefinition[]>(baseType: StructType<StructDefinitionOf<TBaseDef>>, fields: TDef, name?: string): StructType<StructDefinitionOf<readonly [...TBaseDef, ...TDef]>>;
    /**
     * Creates a new Struct type from the provided field definition.
     *
     * NOTE: Field order is determined by property definition order in the object, but that cannot be determined via type inference.
     * @param baseType A base struct from which this struct is derived. Fields in the new struct will come after fields in the base struct.
     * @param fields An object mapping ordered field names to data types in the struct.
     * @param name A name for the struct.
     */
    new <TBaseDef extends StructDefinition, TFields extends { readonly [key: string | symbol]: Type }>(baseType: StructType<TBaseDef>, fields: TFields, name?: string): StructType<StructInheritedDefinition<TBaseDef, TFields, "unspecified">>;
    /**
     * Creates a new Struct type from the provided field definition.
     * @param baseType A base struct from which this struct is derived. Fields in the new struct will come after fields in the base struct.
     * @param fields An object mapping ordered field names to data types in the struct.
     * @param order An used to specify the field order in the struct.
     * @param name A name for the struct.
     */
    new <TBaseDef extends StructDefinition, TFields extends { readonly [key: string | symbol]: Type }, TOrder extends readonly (keyof TFields)[] | readonly []>(baseType: StructType<TBaseDef>, fields: TFields, order: TOrder, name?: string): StructType<StructInheritedDefinition<TBaseDef, TFields, TOrder>>;

    prototype: StructType<StructDefinitionOf<[]>>;
}

/**
 * Creates a new `Struct` type from a provided field definition.
 */
export const StructType = structType.StructType as StructTypeConstructor;

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
    [RelatedTypes]?: {
        RuntimeType: TypedArray<TType, number>;
        InitType: TypedArray<TType, number> | ArrayLike<InitType<TType>>;
    };
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
    [RelatedTypes]?: {
        RuntimeType: TypedArray<TType, TFixedLength>;
        InitType: TypedArray<TType, TFixedLength> | ArrayLike<InitType<TType>>;
    };
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
export const ArrayType = arrayType.ArrayType as ArrayTypeConstructor;
