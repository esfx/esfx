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

import type { Endianness } from "./endianness.js";
import { NumberType } from "./internal/numbers.js";
import { createPrimitiveType } from "./internal/primitive/primitiveTypeImpl.js";
import type { InitType, RuntimeType } from "./type.js";

/**
 * Represents a primitive type.
 */
export interface PrimitiveType<
    K extends string = string,
    T extends number | bigint | boolean = number | bigint | boolean
> {
    [RuntimeType]: T;
    [InitType]: number | bigint | boolean;

    /**
     * Coerce the provided value into a value of this type.
     */
    (value: number | bigint | boolean): T;

    /**
     * The name of the primitive type.
     */
    readonly name: K;

    /**
     * The size, in bytes, of the primitive type.
     */
    readonly SIZE: number;

    /**
     * Reads a primitive value from the buffer.
     * @param buffer The `ArrayBuffer` or `SharedArrayBuffer` from which to read the value.
     * @param byteOffset The byte offset into {@link buffer} at which to start reading.
     * @param byteOrder The endianness to use when reading the value. If unspecified, the native byte order will be used.
     */
    read(buffer: ArrayBufferLike, byteOffset: number, byteOrder?: Endianness): T;

    /**
     * Writes a primitive value to a buffer.
     * @param buffer The `ArrayBuffer` or `SharedArrayBuffer` into which to write the value.
     * @param byteOffset The byte offset into {@link buffer} at which to start writing.
     * @param value The value to write.
     * @param byteOrder The endianness to use when writing the value. If unspecified, the native byte order will be used.
     */
    write(buffer: ArrayBufferLike, byteOffset: number, value: T, byteOrder?: Endianness): void;
}

/**
 * A primitive type representing a 1-byte unsigned boolean value.
 */
export const bool8 = createPrimitiveType("bool8", NumberType.Bool8);

/**
 * A primitive type representing a 4-byte signed boolean value.
 */
export const bool32 = createPrimitiveType("bool32", NumberType.Bool32);

/**
 * A primitive type representing a 1-byte signed integer.
 *
 * Aliases: `i8`, `sbyte`
 */
export const int8 = createPrimitiveType("int8", NumberType.Int8);

/**
 * A primitive type representing a 2-byte signed integer.
 *
 * Aliases: `i16`, `short`
 */
export const int16 = createPrimitiveType("int16", NumberType.Int16);

/**
 * A primitive type representing a 4-byte signed integer.
 *
 * Aliases: `i32`, `int`
 */
export const int32 = createPrimitiveType("int32", NumberType.Int32);

/**
 * A primitive type representing a 1-byte unsigned integer.
 *
 * Aliases: `u8`, `byte`
 */
export const uint8 = createPrimitiveType("uint8", NumberType.Uint8);

/**
 * A primitive type representing a 2-byte unsigned integer.
 *
 * Aliases: `u16`, `ushort`
 */
export const uint16 = createPrimitiveType("uint16", NumberType.Uint16);

/**
 * A primitive type representing a 4-byte unsigned integer.
 *
 * Aliases: `u32`, `uint`
 */
export const uint32 = createPrimitiveType("uint32", NumberType.Uint32);

/**
 * A primitive type representing an 8-byte signed integer.
 *
 * Aliases: `i64`, `long`
 */
export const bigint64 = createPrimitiveType("bigint64", NumberType.BigInt64);

/**
 * A primitive type representing an 8-byte unsigned integer.
 *
 * Aliases: `u64`, `ulong`
 */
export const biguint64 = createPrimitiveType("biguint64", NumberType.BigUint64);

/**
 * A primitive type representing a 4-byte floating point number.
 *
 * Aliases: `f32`, `float`
 */
export const float32 = createPrimitiveType("float32", NumberType.Float32);

/**
 * A primitive type representing an 8-byte floating point number.
 *
 * Aliases: `f64`, `double`
 */
export const float64 = createPrimitiveType("float64", NumberType.Float64);
