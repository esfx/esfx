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
import * as structType from "./structType.js";
import * as primitives from "./primitives.js";

/**
 * Represents a primitive struct type.
 */
export interface StructPrimitiveType<K extends string = string, T extends number | bigint = number | bigint> {
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
    int16 as short,
    int32 as int,
    uint8 as byte,
    uint16 as ushort,
    uint32 as uint,
    bigint64 as long,
    biguint64 as ulong,
    float32 as float,
    float64 as double,
};

export type StructFieldType =
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
    | ((new () => Struct) & { readonly SIZE: number });

export interface StructFieldDefinition {
    readonly name: conststring | constsymbol;
    readonly type: StructFieldType;
}

/**
 * Represents an instance of a struct type.
 */
export type Struct<TDef extends readonly StructFieldDefinition[] = any> = {
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
    get<K extends TDef[number]["name"]>(key: K): StructFieldRuntimeType<Extract<TDef[number], { readonly name: K }>>;

    /**
     * Sets the value of a named field of this struct.
     */
    set<K extends TDef[number]["name"]>(key: K, value: StructFieldRuntimeType<Extract<TDef[number], { readonly name: K }>>): void;

    /**
     * Gets the value of an ordinal field of this struct.
     */
    getIndex<I extends numstr<keyof TDef>>(index: I): StructFieldRuntimeType<Extract<TDef[Extract<I, keyof TDef>], StructFieldDefinition>>;

    /**
     * Sets the value of an ordinal field of this struct.
     */
    setIndex<I extends numstr<keyof TDef>>(index: I, value: StructFieldRuntimeType<Extract<TDef[Extract<I, keyof TDef>], StructFieldDefinition>>): boolean;

    /**
     * Writes the value of this struct to an array buffer.
     */
    writeTo(buffer: ArrayBufferLike, byteOffset?: number): void;
} & {
    /**
     * Gets or sets a named field of the struct.
     */
    [K in TDef[number]["name"]]: StructFieldRuntimeType<Extract<TDef[number], { readonly name: K }>>;
} & {
    /**
     * Gets or sets an ordinal field of the struct.
     */
    [I in Extract<keyof TDef, `${number}`>]: StructFieldRuntimeType<Extract<TDef[I], StructFieldDefinition>>;
};

/**
 * Gets the runtime type from a `StructFieldType`.
 */
export type StructFieldRuntimeType<TField extends StructFieldDefinition> =
    TField["type"] extends StructPrimitiveType ? ReturnType<TField["type"]> :
    TField["type"] extends new () => Struct ? InstanceType<TField["type"]> :
    never;

/**
 * Describes a type that can be used to initialize a property or element of a struct.
 */
export type StructInitFieldType<TField extends StructFieldDefinition> =
    TField["type"] extends StructPrimitiveType ? ReturnType<TField["type"]> :
    TField["type"] extends new () => Struct<infer TDef> ? InstanceType<TField["type"]> | StructInitProperties<TDef> | StructInitElements<TDef> :
    never;

/**
 * Describes the properties that can be used to initialize a struct.
 */
export type StructInitProperties<TDef extends readonly StructFieldDefinition[]> = {
    [P in TDef[number]["name"]]: StructInitFieldType<Extract<TDef[number], { readonly name: P }>>;
};

/**
 * Describes the ordered elements that can be used to initialize a struct.
 */
export type StructInitElements<TDef extends readonly StructFieldDefinition[]> = {
    [I in keyof TDef]: StructInitFieldType<Extract<TDef[I], StructFieldDefinition>>;
};

/**
 * Represents the constructor for a struct.
 */
export interface StructType<TDef extends readonly StructFieldDefinition[] = any> {
    new (): Struct<TDef>;
    new (shared: boolean): Struct<TDef>;
    new (buffer: ArrayBufferLike, byteOffset?: number): Struct<TDef>;
    new (object: Partial<StructInitProperties<TDef>>, shared?: boolean): Struct<TDef>;
    new (elements: Partial<StructInitElements<TDef>>, shared?: boolean): Struct<TDef>;
    readonly SIZE: number;
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
    <TDef extends readonly StructFieldDefinition[] | readonly []>(fields: TDef, name?: string): StructType<TDef>;

    /**
     * Creates a new Struct type from the provided field definition.
     * @param baseType A base struct from which this struct is derived. Fields in this struct will come after fields in the base struct.
     * @param fields An array of `StructFieldDefinition` entries describing the ordered fields in the struct.
     * @param name A name for the struct.
     */
    <TDef extends readonly StructFieldDefinition[] | readonly [], TBaseDef extends readonly StructFieldDefinition[]>(baseType: StructType<TBaseDef>, fields: TDef, name?: string): StructType<readonly [...TBaseDef, ...TDef]>;

    /**
     * Creates a new Struct type from the provided field definition.
     * @param fields An array of `StructFieldDefinition` entries describing the ordered fields in the struct.
     * @param name A name for the struct.
     */
    new <TDef extends readonly StructFieldDefinition[] | readonly []>(fields: TDef, name?: string): StructType<TDef>;

    /**
     * Creates a new Struct type from the provided field definition.
     * @param baseType A base struct from which this struct is derived. Fields in this struct will come after fields in the base struct.
     * @param fields An array of `StructFieldDefinition` entries describing the ordered fields in the struct.
     * @param name A name for the struct.
     */
    new <TDef extends readonly StructFieldDefinition[] | readonly [], TBaseDef extends readonly StructFieldDefinition[]>(baseType: StructType<TBaseDef>, fields: TDef, name?: string): StructType<readonly [...TBaseDef, ...TDef]>;

    prototype: StructType<[]>;
}

/**
 * Creates a new `Struct` type from a provided field definition.
 */
export const StructType = structType.StructType as StructTypeConstructor;
