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

import { Endianness, endianness } from "../endianness.js";

/* @internal */
export type Alignment = 1 | 2 | 4 | 8;

/* @internal */
export function align(offset: number, alignment: Alignment) {
    return (offset + (alignment - 1)) & -alignment;
}

/* @internal */
export interface ArrayBufferViewConstructor {
    new (size: number): ArrayBufferView & Record<number, number | bigint>;
    new (buffer: ArrayBufferLike, byteOffset?: number): ArrayBufferView & Record<number, number | bigint>;
    BYTES_PER_ELEMENT: number;
}

/* @internal */
export const enum NumberType {
    Bool8 = "Bool8",
    Bool32 = "Bool32",
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

type AtomicNumberTypes =
    | NumberType.Bool8
    | NumberType.Bool32
    | NumberType.Int8
    | NumberType.Int16
    | NumberType.Int32
    | NumberType.Uint8
    | NumberType.Uint16
    | NumberType.Uint32;

/* @internal */
export interface NumberTypeToType {
    [NumberType.Bool8]: boolean;
    [NumberType.Bool32]: boolean;
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
    [NumberType.Bool8]: Uint8Array;
    [NumberType.Bool32]: Int32Array;
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

type NumberTypeToCoersion<N extends NumberType> = (value: any) => NumberTypeToType[N];

/* @internal */
export function sizeOf(nt: NumberType): Alignment {
    switch (nt) {
        case NumberType.Bool8:
        case NumberType.Int8:
        case NumberType.Uint8:
            return 1;
        case NumberType.Int16:
        case NumberType.Uint16:
            return 2;
        case NumberType.Bool32:
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

/* @internal */
export function putValueInView(view: DataView, nt: NumberType, byteOffset: number, value: number | bigint | boolean, byteOrder: Endianness = endianness) {
    if (isSharedArrayBuffer(view.buffer) && isAtomic(nt) && typeof value === "number" && ((view.byteOffset + byteOffset) % sizeOf(nt)) === 0) {
        return putValueInBuffer(view.buffer, nt, view.byteOffset + byteOffset, value, byteOrder);
    }
    switch (nt) {
        case NumberType.Bool8: return view.setUint8(byteOffset, Number(coerceValue(nt, value)));
        case NumberType.Bool32: return view.setInt32(byteOffset, Number(coerceValue(nt, value)), byteOrder === "LE");
        case NumberType.Int8: return view.setInt8(byteOffset, coerceValue(nt, value));
        case NumberType.Int16: return view.setInt16(byteOffset, coerceValue(nt, value), byteOrder === "LE");
        case NumberType.Int32: return view.setInt32(byteOffset, coerceValue(nt, value), byteOrder === "LE");
        case NumberType.Uint8: return view.setUint8(byteOffset, coerceValue(nt, value));
        case NumberType.Uint16: return view.setUint16(byteOffset, coerceValue(nt, value), byteOrder === "LE");
        case NumberType.Uint32: return view.setUint32(byteOffset, coerceValue(nt, value), byteOrder === "LE");
        case NumberType.Float32: return view.setFloat32(byteOffset, coerceValue(nt, value), byteOrder === "LE");
        case NumberType.Float64: return view.setFloat64(byteOffset, coerceValue(nt, value), byteOrder === "LE");
        case NumberType.BigInt64: return view.setBigInt64(byteOffset, coerceValue(nt, value), byteOrder === "LE");
        case NumberType.BigUint64: return view.setBigUint64(byteOffset, coerceValue(nt, value), byteOrder === "LE");
    }
}

/* @internal */
export function getValueFromView<N extends NumberType>(view: DataView, nt: N, byteOffset: number, byteOrder?: Endianness): NumberTypeToType[N];
/* @internal */
export function getValueFromView(view: DataView, nt: NumberType, byteOffset: number, byteOrder: Endianness = endianness): number | bigint | boolean {
    // attempt an atomic read
    if (isSharedArrayBuffer(view.buffer) && isAtomic(nt) && ((view.byteOffset + byteOffset) % sizeOf(nt)) === 0) {
        return getValueFromBuffer(view.buffer, nt, view.byteOffset + byteOffset, byteOrder);
    }

    switch (nt) {
        case NumberType.Bool8: return Boolean(view.getUint8(byteOffset));
        case NumberType.Bool32: return Boolean(view.getInt32(byteOffset, byteOrder === "LE"));
        case NumberType.Int8: return view.getInt8(byteOffset);
        case NumberType.Int16: return view.getInt16(byteOffset, byteOrder === "LE");
        case NumberType.Int32: return view.getInt32(byteOffset, byteOrder === "LE");
        case NumberType.Uint8: return view.getUint8(byteOffset);
        case NumberType.Uint16: return view.getUint16(byteOffset, byteOrder === "LE");
        case NumberType.Uint32: return view.getUint32(byteOffset, byteOrder === "LE");
        case NumberType.Float32: return view.getFloat32(byteOffset, byteOrder === "LE");
        case NumberType.Float64: return view.getFloat64(byteOffset, byteOrder === "LE");
        case NumberType.BigInt64: return view.getBigInt64(byteOffset, byteOrder === "LE");
        case NumberType.BigUint64: return view.getBigUint64(byteOffset, byteOrder === "LE");
    }
}

interface GenerationRecord<V> {
    generation: number;
    phase: number;
    counter: number;
    value: V;
}

class WeakGenerativeCache<K extends object, V> {
    private _generations = [
        // gen 0
        [new WeakMap<K, GenerationRecord<V>>(), new WeakMap<K, GenerationRecord<V>>()],
        // gen 1
        [new WeakMap<K, GenerationRecord<V>>()],
        // gen 2
        [new WeakMap<K, GenerationRecord<V>>()],
    ];

    private _gen0Phase = 0;
    private _accessCounter = 0;

    has(key: K) {
        const record = this._find(key);
        if (record) {
            this._access(key, record);
            return true;
        }
        return false;
    }

    get(key: K) {
        const record = this._find(key);
        if (record) {
            this._access(key, record);
            this._prune();
            return record.value;
        }
    }

    set(key: K, value: V) {
        let record = this._find(key);
        if (!record) {
            this._prune();
            record = { generation: 0, phase: this._gen0Phase, counter: 0, value };
            this._generations[record.generation][record.phase].set(key, record);
        }
        else {
            this._access(key, record);
            this._prune();
            record.value = value;
        }
    }

    delete(key: K) {
        const record = this._find(key);
        if (record) {
            this._generations[record.generation][record.phase].delete(key);
            this._prune();
            return true;
        }
        return false;
    }

    clear() {
        for (const generation of this._generations) {
            for (let i = 0; i < generation.length; i++) {
                generation[i] = new WeakMap();
            }
        }
        this._accessCounter = 0;
        this._gen0Phase = 0;
    }

    private _find(key: K) {
        for (const generation of this._generations) {
            for (const phase of generation) {
                const record = phase.get(key);
                if (record) return record;
            }
        }
    }

    private _access(key: K, record: GenerationRecord<V>) {
        if (record.generation < 2) {
            record.counter++;
            if (this._shouldPromote(record)) {
                const currentGen = this._generations[record.generation][record.phase];
                currentGen.delete(key);
                record.generation++;
                record.phase = 0;
                record.counter = 1;
                const nextGen = this._generations[record.generation][record.phase];
                nextGen.set(key, record);
            }
        }
    }

    private _shouldPromote(record: GenerationRecord<V>) {
        switch (record.generation) {
            case 0: return record.counter >= 1;
            case 1: return record.counter >= 2;
        }
        return false;
    }

    private _prune() {
        this._accessCounter++;
        if (this._accessCounter >= 10) {
            this._gen0Phase = this._gen0Phase ? 0 : 1;
            this._generations[0][this._gen0Phase] = new WeakMap()
            this._accessCounter = 0;
        }
    }
}

const dataViewCache = new WeakGenerativeCache<ArrayBufferLike, DataView>();
const int8ArrayCache = new WeakGenerativeCache<SharedArrayBuffer, Int8Array>();
const int16ArrayCache = new WeakGenerativeCache<SharedArrayBuffer, Int16Array>();
const int32ArrayCache = new WeakGenerativeCache<SharedArrayBuffer, Int32Array>();
const uint8ArrayCache = new WeakGenerativeCache<SharedArrayBuffer, Uint8Array>();
const uint16ArrayCache = new WeakGenerativeCache<SharedArrayBuffer, Uint16Array>();
const uint32ArrayCache = new WeakGenerativeCache<SharedArrayBuffer, Uint32Array>();
const float32ArrayCache = new WeakGenerativeCache<SharedArrayBuffer, Float32Array>();
const float64ArrayCache = new WeakGenerativeCache<SharedArrayBuffer, Float64Array>();
const bigInt64ArrayCache = new WeakGenerativeCache<SharedArrayBuffer, BigInt64Array>();
const bigUint64ArrayCache = new WeakGenerativeCache<SharedArrayBuffer, BigUint64Array>();

/* @internal */
export function putValueInBuffer(buffer: ArrayBufferLike, nt: NumberType, byteOffset: number, value: number | bigint | boolean, byteOrder: Endianness = endianness) {
    // attempt an atomic write
    if (isSharedArrayBuffer(buffer) && isAtomic(nt) && typeof value === "number") {
        const size = sizeOf(nt);
        if ((byteOffset % size) === 0) {
            // aligned within the buffer
            const array = getTypedArray(buffer, nt);
            const arrayIndex = byteOffset / size;
            const coercedValue = coerceValue(nt, value);
            const correctedValue = size === 1 || byteOrder === endianness ? coercedValue : swapByteOrder(nt, coercedValue);
            Atomics.store(array, arrayIndex, typeof correctedValue === "boolean" ? Number(correctedValue) : correctedValue);
            return;
        }
    }
    putValueInView(getDataView(buffer), nt, byteOffset, value, byteOrder);
}

/* @internal */
export function getValueFromBuffer<N extends NumberType>(buffer: ArrayBufferLike, nt: N, byteOffset: number, byteOrder?: Endianness): NumberTypeToType[N];
/* @internal */
export function getValueFromBuffer<N extends NumberType>(buffer: ArrayBufferLike, nt: N, byteOffset: number, byteOrder: Endianness = endianness): number | bigint | boolean {
    // attempt an atomic read
    if (isSharedArrayBuffer(buffer) && isAtomic(nt)) {
        const size = sizeOf(nt);
        if ((byteOffset % size) === 0) {
            // aligned within the buffer
            const array = getTypedArray(buffer, nt);
            const arrayIndex = byteOffset / size;
            const value = Atomics.load(array, arrayIndex);
            if (nt === NumberType.Bool8 || nt === NumberType.Bool32) return Boolean(value);
            return size === 1 || byteOrder === endianness ? value : swapByteOrder(nt, value);
        }
    }
    return getValueFromView(getDataView(buffer), nt, byteOffset, byteOrder);
}

function getTypedArrayConstructor<N extends NumberType>(nt: N): new (buffer: ArrayBufferLike) => NumberTypeToTypedArray[N];
function getTypedArrayConstructor(nt: NumberType) {
    switch (nt) {
        case NumberType.Bool8: return Uint8Array;
        case NumberType.Bool32: return Int32Array;
        case NumberType.Int8: return Int8Array;
        case NumberType.Int16: return Int16Array;
        case NumberType.Int32: return Int32Array;
        case NumberType.Uint8: return Uint8Array;
        case NumberType.Uint16: return Uint16Array;
        case NumberType.Uint32: return Uint32Array;
        case NumberType.Float32: return Float32Array;
        case NumberType.Float64: return Float64Array;
        case NumberType.BigInt64: return BigInt64Array;
        case NumberType.BigUint64: return BigUint64Array;
    }
}

function getTypedArrayCache<N extends NumberType>(nt: N): WeakGenerativeCache<SharedArrayBuffer, NumberTypeToTypedArray[N]>;
function getTypedArrayCache(nt: NumberType) {
    switch (nt) {
        case NumberType.Bool8: return uint8ArrayCache;
        case NumberType.Bool32: return int32ArrayCache;
        case NumberType.Int8: return int8ArrayCache;
        case NumberType.Int16: return int16ArrayCache;
        case NumberType.Int32: return int32ArrayCache;
        case NumberType.Uint8: return uint8ArrayCache;
        case NumberType.Uint16: return uint16ArrayCache;
        case NumberType.Uint32: return uint32ArrayCache;
        case NumberType.Float32: return float32ArrayCache;
        case NumberType.Float64: return float64ArrayCache;
        case NumberType.BigInt64: return bigInt64ArrayCache;
        case NumberType.BigUint64: return bigUint64ArrayCache;
    }
}

function getTypedArray<N extends NumberType>(buffer: SharedArrayBuffer, nt: N): NumberTypeToTypedArray[N] {
    const cache = getTypedArrayCache(nt);
    let array = cache.get(buffer);
    if (!array) {
        const ctor = getTypedArrayConstructor(nt);
        array = new ctor(buffer);
        cache.set(buffer, array);
    }
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

function isAtomic(nt: NumberType): nt is AtomicNumberTypes {
    switch (nt) {
        case NumberType.Bool8:
        case NumberType.Bool32:
        case NumberType.Int8:
        case NumberType.Int16:
        case NumberType.Int32:
        case NumberType.Uint8:
        case NumberType.Uint16:
        case NumberType.Uint32:
            return true;
    }
    return false;
}

const tempDataView = new DataView(new ArrayBuffer(8));

function swapByteOrder<N extends NumberType>(nt: N, value: NumberTypeToType[N]): NumberTypeToType[N] {
    putValueInView(tempDataView, nt, 0, value, "BE");
    return getValueFromView(tempDataView, nt, 0, "LE");
}

function getTypeCoersion<N extends NumberType>(nt: N): NumberTypeToCoersion<N>;
function getTypeCoersion(nt: NumberType) {
    switch (nt) {
        case NumberType.Bool8:
        case NumberType.Bool32:
            return Boolean;
        case NumberType.Int8:
        case NumberType.Int16:
        case NumberType.Int32:
        case NumberType.Uint8:
        case NumberType.Uint16:
        case NumberType.Uint32:
        case NumberType.Float32:
        case NumberType.Float64:
            return Number;
        case NumberType.BigInt64:
        case NumberType.BigUint64:
            return BigInt;
    }
}

const sizeCoersionArrays: { [N in NumberType]?: NumberTypeToTypedArray[N]; } = {};

/* @internal */
export function coerceValue<N extends NumberType>(nt: N, value: number | bigint | boolean): NumberTypeToType[N];
/* @internal */
export function coerceValue<N extends NumberType>(nt: N, value: number | bigint | boolean): number | bigint | boolean {
    const typeCoersion = getTypeCoersion(nt);
    const coerced = typeCoersion(value);
    if (typeof coerced === "boolean") return coerced;
    const sizeCoersionArray = sizeCoersionArrays[nt] || (sizeCoersionArrays[nt] = new (getTypedArrayConstructor(nt))(new ArrayBuffer(sizeOf(nt))));
    sizeCoersionArray![0] = coerced;
    return sizeCoersionArray![0];
}

function isSharedArrayBuffer(value: unknown): value is SharedArrayBuffer {
    return typeof SharedArrayBuffer === "function" && value instanceof SharedArrayBuffer;
}
