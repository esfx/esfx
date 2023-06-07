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

import type { conststring, constsymbol, numstr } from "@esfx/type-model";
import type { Endianness } from "./endianness.js";
import { StructTypeImpl } from "./internal/struct/structTypeImpl.js";
import type { InitType, RuntimeType, Type } from "./type.js";

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
    get<K extends StructFieldLayoutKeys<TDef>>(key: K): StructFieldLayout<TDef>[K];

    /**
     * Sets the value of a named field of this struct.
     */
    set<K extends StructFieldLayoutKeys<TDef>>(key: K, value: StructFieldLayout<TDef>[K]): void;

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
    writeTo(buffer: ArrayBufferLike, byteOffset?: number, byteOrder?: Endianness): void;
} & StructFieldLayout<TDef> & StructElementLayout<TDef>;

/**
 * Represents the constructor for a struct.
 */
export interface StructType<TDef extends StructDefinition> {
    new (): Struct<TDef>;
    new (shared: boolean): Struct<TDef>;
    new (buffer: ArrayBufferLike, byteOffset?: number): Struct<TDef>;
    new (object: Partial<StructObjectInit<TDef>>, shared?: boolean): Struct<TDef>;
    new (elements: Partial<StructArrayInit<TDef>>, shared?: boolean): Struct<TDef>;
    prototype: Struct<any>;

    /**
     * Gets the size of this struct, in bytes.
     */
    readonly SIZE: number;

    /**
     * Reads a structured value from the buffer. The resulting structured value will be backed by its own buffer.
     * @param buffer The `ArrayBuffer` or `SharedArrayBuffer` from which to read the value.
     * @param byteOffset The byte offset into {@link buffer} at which to start reading.
     * @param byteOrder The endianness to use when reading the value. If unspecified, the native byte order will be used.
     */
    read(buffer: ArrayBufferLike, byteOffset: number, byteOrder?: Endianness): Struct<TDef>;
    /**
     * Reads a structured value from the buffer. The resulting structured value will be backed by its own buffer.
     * @param buffer The `ArrayBuffer` or `SharedArrayBuffer` from which to read the value.
     * @param byteOffset The byte offset into {@link buffer} at which to start reading.
     * @param shared When `true`, the resulting value will be backed by a `SharedArrayBuffer`.
     * @param byteOrder The endianness to use when reading the value. If unspecified, the native byte order will be used.
     */
    read(buffer: ArrayBufferLike, byteOffset: number, shared?: boolean, byteOrder?: Endianness): Struct<TDef>;

    /**
     * Writes a structured value to a buffer.
     * @param buffer The `ArrayBuffer` or `SharedArrayBuffer` into which to write the value.
     * @param byteOffset The byte offset into {@link buffer} at which to start writing.
     * @param value The value to write.
     * @param byteOrder The endianness to use when writing the value. If unspecified, the native byte order will be used.
     */
    write(buffer: ArrayBufferLike, byteOffset: number, value: Struct<TDef>, byteOrder?: Endianness): void;

    // #region Related Types
    [RuntimeType]: Struct<TDef>;
    [InitType]: Struct<TDef> | StructObjectInit<TDef> | StructArrayInit<TDef>;
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
export const StructType = StructTypeImpl as StructTypeConstructor;

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
    -readonly [K in StructFieldLayoutKeys<TDef>]: RuntimeType<TDef["fields"][K]>;
};

export type StructElementLayout<TDef extends StructDefinition> = {
    /**
     * Gets or sets a named field of the struct.
     */
    -readonly [I in StructElementLayoutIndices<TDef>]: RuntimeType<TDef["fields"][TDef["order"][I]]>;
};

export type StructFieldLayoutKeys<TDef extends StructDefinition> = keyof TDef["fields"];
export type StructElementLayoutIndices<TDef extends StructDefinition> = TDef["order"] extends "unspecified" ? never : numstr<keyof TDef["order"]>;

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
