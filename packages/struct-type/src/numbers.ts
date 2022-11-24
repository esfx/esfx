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

import { WeakGenerativeCache } from "./weakGenerativeCache";

/* @internal */
export type Alignment = 1 | 2 | 4 | 8;

/* @internal */
export const littleEndian = new DataView(new Int32Array([1]).buffer).getInt32(0, /*littleEndian*/ true) === 1;

/* @internal */
export interface ArrayBufferViewConstructor {
    new (size: number): ArrayBufferView & Record<number, number | bigint>;
    new (buffer: ArrayBufferLike, byteOffset?: number): ArrayBufferView & Record<number, number | bigint>;
    BYTES_PER_ELEMENT: number;
}

/* @internal */
export const enum NumberType {
    Int8 = "Int8",
    Int16 = "Int16",
    Int32 = "Int32",
    Uint8 = "Uint8",
    Uint16 = "Uint16",
    Uint32 = "Uint32",
    Float32 = "Float32",
    Float64 = "Float64",
    BigInt64 = "BigInt64",
    BigUint64 = "BigUint64",
}

/* @internal */
export interface NumberTypeToType {
    [NumberType.Int8]: number;
    [NumberType.Int16]: number;
    [NumberType.Int32]: number;
    [NumberType.Uint8]: number;
    [NumberType.Uint16]: number;
    [NumberType.Uint32]: number;
    [NumberType.Float32]: number;
    [NumberType.Float64]: number;
    [NumberType.BigInt64]: bigint;
    [NumberType.BigUint64]: bigint;
}

/* @internal */
export interface NumberTypeToTypedArray {
    [NumberType.Int8]: Int8Array;
    [NumberType.Int16]: Int16Array;
    [NumberType.Int32]: Int32Array;
    [NumberType.Uint8]: Uint8Array;
    [NumberType.Uint16]: Uint16Array;
    [NumberType.Uint32]: Uint32Array;
    [NumberType.Float32]: Float32Array;
    [NumberType.Float64]: Float64Array;
    [NumberType.BigInt64]: BigInt64Array;
    [NumberType.BigUint64]: BigUint64Array;
}

/* @internal */
export function sizeOf(nt: NumberType): Alignment {
    switch (nt) {
        case NumberType.Int8:
        case NumberType.Uint8:
            return 1;
        case NumberType.Int16:
        case NumberType.Uint16:
            return 2;
        case NumberType.Int32:
        case NumberType.Uint32:
        case NumberType.Float32:
            return 4;
        case NumberType.Float64:
        case NumberType.BigInt64:
        case NumberType.BigUint64:
            return 8;
    }
}

const tempBuffer = new ArrayBuffer(8);
const tempInt8Array = new Int8Array(tempBuffer);
const tempInt16Array = new Int16Array(tempBuffer);
const tempInt32Array = new Int32Array(tempBuffer);
const tempUint8Array = new Uint8Array(tempBuffer);
const tempUint16Array = new Uint16Array(tempBuffer);
const tempUint32Array = new Uint32Array(tempBuffer);
const tempBigInt64Array = new BigInt64Array(tempBuffer);
const tempBigUint64Array = new BigUint64Array(tempBuffer);
const tempFloat32Array = new Float32Array(tempBuffer);
const tempFloat64Array = new Float64Array(tempBuffer);

function swapBytes16(): void {
    let x = 0;
    x = tempUint8Array[0], tempUint8Array[0] = tempUint8Array[1], tempUint8Array[1] = x;
}

function swapBytes32(): void {
    let x = 0;
    x = tempUint8Array[0], tempUint8Array[0] = tempUint8Array[3], tempUint8Array[3] = x;
    x = tempUint8Array[1], tempUint8Array[1] = tempUint8Array[2], tempUint8Array[2] = x;
}

function swapBytes64(): void {
    let x = 0;
    x = tempUint8Array[0], tempUint8Array[0] = tempUint8Array[7], tempUint8Array[7] = x;
    x = tempUint8Array[1], tempUint8Array[1] = tempUint8Array[6], tempUint8Array[6] = x;
    x = tempUint8Array[2], tempUint8Array[2] = tempUint8Array[5], tempUint8Array[5] = x;
    x = tempUint8Array[3], tempUint8Array[3] = tempUint8Array[4], tempUint8Array[4] = x;
}

function swapInt16(value: number) {
    return tempInt16Array[0] = value, swapBytes16(), tempInt16Array[0];
}

function swapUint16(value: number) {
    return tempUint16Array[0] = value, swapBytes16(), tempUint16Array[0];
}

function swapInt32(value: number) {
    return tempInt32Array[0] = value, swapBytes32(), tempInt32Array[0];
}

function swapUint32(value: number) {
    return tempUint32Array[0] = value, swapBytes32(), tempUint32Array[0];
}

function swapBigInt64(value: bigint) {
    return tempBigInt64Array[0] = value, swapBytes64(), tempBigInt64Array[0];
}

function swapBigUint64(value: bigint) {
    return tempBigUint64Array[0] = value, swapBytes64(), tempBigUint64Array[0];
}

function coerceInt8(value: number | bigint) {
    return tempInt8Array[0] = Number(value), tempInt8Array[0];
}

function coerceUint8(value: number | bigint) {
    return tempUint8Array[0] = Number(value), tempUint8Array[0];
}

function coerceInt16(value: number | bigint) {
    return tempInt16Array[0] = Number(value), tempInt16Array[0];
}

function coerceUint16(value: number | bigint) {
    return tempUint16Array[0] = Number(value), tempUint16Array[0];
}

function coerceInt32(value: number | bigint) {
    return tempInt32Array[0] = Number(value), tempInt32Array[0];
}

function coerceUint32(value: number | bigint) {
    return tempUint32Array[0] = Number(value), tempUint32Array[0];
}

function coerceBigInt64(value: number | bigint) {
    return tempBigInt64Array[0] = BigInt(value), tempBigInt64Array[0];
}

function coerceBigUint64(value: number | bigint) {
    return tempBigUint64Array[0] = BigInt(value), tempBigUint64Array[0];
}

function coerceFloat32(value: number | bigint) {
    return tempFloat32Array[0] = Number(value), tempFloat32Array[0];
}

function coerceFloat64(value: number | bigint) {
    return tempFloat64Array[0] = Number(value), tempFloat64Array[0];
}

/* @internal */
export function coerceValue<N extends NumberType>(nt: N, value: number | bigint): NumberTypeToType[N];
/* @internal */
export function coerceValue(nt: NumberType, value: number | bigint): number | bigint {
    switch (nt) {
        case NumberType.Int8: return coerceInt8(value);
        case NumberType.Uint8: return coerceUint8(value);
        case NumberType.Int16: return coerceInt16(value);
        case NumberType.Uint16: return coerceUint16(value);
        case NumberType.Int32: return coerceInt32(value);
        case NumberType.Uint32: return coerceUint32(value);
        case NumberType.BigInt64: return coerceBigInt64(value);
        case NumberType.BigUint64: return coerceBigUint64(value);
        case NumberType.Float32: return coerceFloat32(value);
        case NumberType.Float64: return coerceFloat64(value);
    }
}

const dataViewCache = new WeakGenerativeCache<ArrayBufferLike, DataView>();
const int8ArrayCache = new WeakGenerativeCache<ArrayBufferLike, Int8Array>();
const int16ArrayCache = new WeakGenerativeCache<ArrayBufferLike, Int16Array>();
const int32ArrayCache = new WeakGenerativeCache<ArrayBufferLike, Int32Array>();
const uint8ArrayCache = new WeakGenerativeCache<ArrayBufferLike, Uint8Array>();
const uint16ArrayCache = new WeakGenerativeCache<ArrayBufferLike, Uint16Array>();
const uint32ArrayCache = new WeakGenerativeCache<ArrayBufferLike, Uint32Array>();
const bigInt64ArrayCache = new WeakGenerativeCache<ArrayBufferLike, BigInt64Array>();
const bigUint64ArrayCache = new WeakGenerativeCache<ArrayBufferLike, BigUint64Array>();

function getInt8TypedArray(buffer: ArrayBufferLike) {
    let array = int8ArrayCache.get(buffer);
    if (!array) int8ArrayCache.set(buffer, array = new Int8Array(buffer));
    return array;
}

function getUint8TypedArray(buffer: ArrayBufferLike) {
    let array = uint8ArrayCache.get(buffer);
    if (!array) uint8ArrayCache.set(buffer, array = new Uint8Array(buffer));
    return array;
}

function getInt16TypedArray(buffer: ArrayBufferLike) {
    let array = int16ArrayCache.get(buffer);
    if (!array) int16ArrayCache.set(buffer, array = new Int16Array(buffer));
    return array;
}

function getUint16TypedArray(buffer: ArrayBufferLike) {
    let array = uint16ArrayCache.get(buffer);
    if (!array) uint16ArrayCache.set(buffer, array = new Uint16Array(buffer));
    return array;
}

function getInt32TypedArray(buffer: ArrayBufferLike) {
    let array = int32ArrayCache.get(buffer);
    if (!array) int32ArrayCache.set(buffer, array = new Int32Array(buffer));
    return array;
}

function getUint32TypedArray(buffer: ArrayBufferLike) {
    let array = uint32ArrayCache.get(buffer);
    if (!array) uint32ArrayCache.set(buffer, array = new Uint32Array(buffer));
    return array;
}

function getBigInt64TypedArray(buffer: ArrayBufferLike) {
    let array = bigInt64ArrayCache.get(buffer);
    if (!array) bigInt64ArrayCache.set(buffer, array = new BigInt64Array(buffer));
    return array;
}

function getBigUint64TypedArray(buffer: ArrayBufferLike) {
    let array = bigUint64ArrayCache.get(buffer);
    if (!array) bigUint64ArrayCache.set(buffer, array = new BigUint64Array(buffer));
    return array;
}

function getDataView(buffer: ArrayBufferLike) {
    let view = dataViewCache.get(buffer);
    if (!view) {
        view = new DataView(buffer);
        dataViewCache.set(buffer, view);
    }
    return view;
}

function maybeSwapInt16(value: number, swapByteOrder: boolean) {
    return swapByteOrder ? swapInt16(value) : value;
}

function maybeSwapUint16(value: number, swapByteOrder: boolean) {
    return swapByteOrder ? swapUint16(value) : value;
}

function maybeSwapInt32(value: number, swapByteOrder: boolean) {
    return swapByteOrder ? swapInt32(value) : value;
}

function maybeSwapUint32(value: number, swapByteOrder: boolean) {
    return swapByteOrder ? swapUint32(value) : value;
}

function maybeSwapBigInt64(value: bigint, swapByteOrder: boolean) {
    return swapByteOrder ? swapBigInt64(value) : value;
}

function maybeSwapBigUint64(value: bigint, swapByteOrder: boolean) {
    return swapByteOrder ? swapBigUint64(value) : value;
}

function convertFloat32ToUint32(value: number, swapByteOrder: boolean) {
    tempFloat32Array[0] = value;
    if (swapByteOrder) swapBytes32();
    return tempUint32Array[0];
}

function convertFloat64ToBigUint64(value: number, swapByteOrder: boolean) {
    tempFloat64Array[0] = value;
    if (swapByteOrder) swapBytes64();
    return tempBigUint64Array[0];
}

function convertUint32ToFloat32(value: number, swapByteOrder: boolean) {
    tempUint32Array[0] = value;
    if (swapByteOrder) swapBytes32();
    return tempFloat32Array[0];
}

function convertBigUint64ToFloat64(value: bigint, swapByteOrder: boolean) {
    tempBigUint64Array[0] = value;
    if (swapByteOrder) swapBytes64();
    return tempFloat64Array[0];
}

function putValueInBufferWorker(buffer: ArrayBufferLike, nt: NumberType, index: number, value: number | bigint, isLittleEndian: boolean) {
    switch (nt) {
        case NumberType.Int8: Atomics.store(getInt8TypedArray(buffer), index, coerceInt8(value)); break;
        case NumberType.Uint8: Atomics.store(getUint8TypedArray(buffer), index, coerceUint8(value)); break;
        case NumberType.Int16: Atomics.store(getInt16TypedArray(buffer), index, maybeSwapInt16(coerceInt16(value), isLittleEndian !== littleEndian)); break;
        case NumberType.Uint16: Atomics.store(getUint16TypedArray(buffer), index, maybeSwapUint16(coerceUint16(value), isLittleEndian !== littleEndian)); break;
        case NumberType.Int32: Atomics.store(getInt32TypedArray(buffer), index, maybeSwapInt32(coerceInt32(value), isLittleEndian !== littleEndian)); break;
        case NumberType.Uint32: Atomics.store(getUint32TypedArray(buffer), index, maybeSwapUint32(coerceUint32(value), isLittleEndian !== littleEndian)); break;
        case NumberType.BigInt64: Atomics.store(getBigInt64TypedArray(buffer), index, maybeSwapBigInt64(coerceBigInt64(value), isLittleEndian !== littleEndian)); break;
        case NumberType.BigUint64: Atomics.store(getBigUint64TypedArray(buffer), index, maybeSwapBigUint64(coerceBigUint64(value), isLittleEndian !== littleEndian)); break;
        case NumberType.Float32: Atomics.store(getUint32TypedArray(buffer), index, convertFloat32ToUint32(coerceFloat32(value), isLittleEndian !== littleEndian)); break;
        case NumberType.Float64: Atomics.store(getBigUint64TypedArray(buffer), index, convertFloat64ToBigUint64(coerceFloat64(value), isLittleEndian !== littleEndian)); break;
    }
}

function putValueInViewWorker(view: DataView, nt: NumberType, byteOffset: number, value: number | bigint, isLittleEndian: boolean) {
    switch (nt) {
        case NumberType.Int8: return view.setInt8(byteOffset, coerceValue(nt, value));
        case NumberType.Uint8: return view.setUint8(byteOffset, coerceValue(nt, value));
        case NumberType.Int16: return view.setInt16(byteOffset, coerceValue(nt, value), isLittleEndian);
        case NumberType.Uint16: return view.setUint16(byteOffset, coerceValue(nt, value), isLittleEndian);
        case NumberType.Int32: return view.setInt32(byteOffset, coerceValue(nt, value), isLittleEndian);
        case NumberType.Uint32: return view.setUint32(byteOffset, coerceValue(nt, value), isLittleEndian);
        case NumberType.BigInt64: return view.setBigInt64(byteOffset, coerceValue(nt, value), isLittleEndian);
        case NumberType.BigUint64: return view.setBigUint64(byteOffset, coerceValue(nt, value), isLittleEndian);
        case NumberType.Float32: return view.setFloat32(byteOffset, coerceValue(nt, value), isLittleEndian);
        case NumberType.Float64: return view.setFloat64(byteOffset, coerceValue(nt, value), isLittleEndian);
    }
}

/* @internal */
export function putValueInBuffer(buffer: ArrayBufferLike, nt: NumberType, byteOffset: number, value: number | bigint, isLittleEndian: boolean = false) {
    // attempt an atomic write
    const size = sizeOf(nt);
    if ((byteOffset % size) === 0) {
        putValueInBufferWorker(buffer, nt, byteOffset / size, value, isLittleEndian);
    }
    else {
        putValueInView(getDataView(buffer), nt, byteOffset, value, isLittleEndian);
    }
}

/* @internal */
export function putValueInView(view: DataView, nt: NumberType, byteOffset: number, value: number | bigint, isLittleEndian: boolean = false) {
    const size = sizeOf(nt);
    const realByteOffset = view.byteOffset + byteOffset;
    if ((realByteOffset % size) === 0) {
        putValueInBufferWorker(view.buffer, nt, realByteOffset / size, value, isLittleEndian);
    }
    else {
        putValueInViewWorker(view, nt, byteOffset, value, isLittleEndian);
    }
}

function getValueFromBufferWorker(buffer: ArrayBufferLike, nt: NumberType, index: number, isLittleEndian: boolean) {
    switch (nt) {
        case NumberType.Int8: return Atomics.load(getInt8TypedArray(buffer), index);
        case NumberType.Uint8: return Atomics.load(getUint8TypedArray(buffer), index);
        case NumberType.Int16: return maybeSwapInt16(Atomics.load(getInt16TypedArray(buffer), index), isLittleEndian !== littleEndian);
        case NumberType.Uint16: return maybeSwapUint16(Atomics.load(getUint16TypedArray(buffer), index), isLittleEndian !== littleEndian);
        case NumberType.Int32: return maybeSwapInt32(Atomics.load(getInt32TypedArray(buffer), index), isLittleEndian !== littleEndian);
        case NumberType.Uint32: return maybeSwapUint32(Atomics.load(getUint32TypedArray(buffer), index), isLittleEndian !== littleEndian);
        case NumberType.BigInt64: return maybeSwapBigInt64(Atomics.load(getBigInt64TypedArray(buffer), index), isLittleEndian !== littleEndian);
        case NumberType.BigUint64: return maybeSwapBigUint64(Atomics.load(getBigUint64TypedArray(buffer), index), isLittleEndian !== littleEndian);
        case NumberType.Float32: return convertUint32ToFloat32(Atomics.load(getUint32TypedArray(buffer), index), isLittleEndian !== littleEndian);
        case NumberType.Float64: return convertBigUint64ToFloat64(Atomics.load(getBigUint64TypedArray(buffer), index), isLittleEndian !== littleEndian);
    }
}

function getValueFromViewWorker(view: DataView, nt: NumberType, byteOffset: number, isLittleEndian: boolean): number | bigint {
    switch (nt) {
        case NumberType.Int8: return view.getInt8(byteOffset);
        case NumberType.Uint8: return view.getUint8(byteOffset);
        case NumberType.Int16: return view.getInt16(byteOffset, isLittleEndian);
        case NumberType.Uint16: return view.getUint16(byteOffset, isLittleEndian);
        case NumberType.Int32: return view.getInt32(byteOffset, isLittleEndian);
        case NumberType.Uint32: return view.getUint32(byteOffset, isLittleEndian);
        case NumberType.BigInt64: return view.getBigInt64(byteOffset, isLittleEndian);
        case NumberType.BigUint64: return view.getBigUint64(byteOffset, isLittleEndian);
        case NumberType.Float32: return view.getFloat32(byteOffset, isLittleEndian);
        case NumberType.Float64: return view.getFloat64(byteOffset, isLittleEndian);
    }
}

/* @internal */
export function getValueFromBuffer<N extends NumberType>(buffer: ArrayBufferLike, nt: N, byteOffset: number, isLittleEndian?: boolean): NumberTypeToType[N];
/* @internal */
export function getValueFromBuffer<N extends NumberType>(buffer: ArrayBufferLike, nt: N, byteOffset: number, isLittleEndian: boolean = false): number | bigint {
    // attempt an atomic read
    const size = sizeOf(nt);
    if ((byteOffset % size) === 0) {
        return getValueFromBufferWorker(buffer, nt, byteOffset / size, isLittleEndian);
    }
    else {
        return getValueFromViewWorker(getDataView(buffer), nt, byteOffset, isLittleEndian);
    }
}

/* @internal */
export function getValueFromView<N extends NumberType>(view: DataView, nt: N, byteOffset: number, isLittleEndian?: boolean): NumberTypeToType[N];
/* @internal */
export function getValueFromView(view: DataView, nt: NumberType, byteOffset: number, isLittleEndian: boolean = false): number | bigint {
    // attempt an atomic read
    const size = sizeOf(nt);
    const realByteOffset = view.byteOffset + byteOffset;
    if ((realByteOffset % size) === 0) {
        return getValueFromBufferWorker(view.buffer, nt, realByteOffset / size, isLittleEndian);
    }
    else {
        return getValueFromViewWorker(view, nt, byteOffset, isLittleEndian);
    }
}
