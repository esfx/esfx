/*!
   Copyright 2023 Ron Buckton

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

import { IntegerIndexedObject } from "@esfx/indexed-object";
import type { InitType, RuntimeType, Type } from "../../type.js";
import { PrimitiveTypeInfo } from "../primitive/primitiveTypeInfo.js";
import { ArrayTypeInfo } from "./arrayTypeInfo.js";

type TypedArrayConstructorEmptyOverload = [];
type TypedArrayConstructorSharedOverload = [boolean];
type TypedArrayConstructorLengthOverload = [number, boolean?];
type TypedArrayConstructorArrayBufferLikeOverload = [ArrayBufferLike, number?, number?];
type TypedArrayConstructorElementsOverload<TType extends Type> = [ArrayLike<InitType<TType>>, boolean?];
type TypedArrayConstructorOverloads<TType extends Type> =
    | TypedArrayConstructorEmptyOverload
    | TypedArrayConstructorSharedOverload
    | TypedArrayConstructorLengthOverload
    | TypedArrayConstructorArrayBufferLikeOverload
    | TypedArrayConstructorElementsOverload<TType>;

function isTypedArrayConstructorLengthOverload<TType extends Type>(args: TypedArrayConstructorOverloads<TType>): args is TypedArrayConstructorLengthOverload {
    return args.length >= 1 && typeof args[0] === "number";
}

function isTypedArrayConstructorArrayBufferLikeOverload<TType extends Type>(args: TypedArrayConstructorOverloads<TType>): args is TypedArrayConstructorArrayBufferLikeOverload {
    return args.length > 0 && (args[0] instanceof ArrayBuffer || (typeof SharedArrayBuffer === "function" && args[0] instanceof SharedArrayBuffer));
}

function isTypedArrayConstructorElementsOverload<TType extends Type>(args: TypedArrayConstructorOverloads<TType>): args is TypedArrayConstructorElementsOverload<TType> {
    return args.length > 0 && Array.isArray(args[0]);
}

function isSharedArrayBuffer(buffer: ArrayBufferLike): buffer is SharedArrayBuffer {
    return typeof SharedArrayBuffer === "function" && buffer instanceof SharedArrayBuffer;
}

/* @internal */
abstract class TypedArray<TType extends Type> extends IntegerIndexedObject<RuntimeType<TType>> {
    declare static [RuntimeType]: any;
    declare static [InitType]: any;

    #buffer: ArrayBufferLike;
    #byteOffset: number;
    #type: ArrayTypeInfo;
    #dataView: DataView;
    #fixedLength: number;
    #byteLength: number;
    #elementCacheView: ElementCacheView<TType> | undefined;

    constructor();
    constructor(shared: boolean);
    constructor(length: number);
    constructor(length: number, shared: boolean);
    constructor(buffer: ArrayBufferLike, byteOffset?: number, length?: number);
    constructor(elements: ArrayLike<InitType<TType>>, shared?: boolean);
    constructor(...args: TypedArrayConstructorOverloads<TType>) {
        const type = ArrayTypeInfo.get(new.target);
        const elementTypeInfo = type.elementTypeInfo;
        const elementSize = elementTypeInfo.size;
        if (elementSize === undefined) {
            throw new TypeError(`A TypedArray may only contain fixed-size elements, but element type '${elementTypeInfo.name}' is not fixed-size`);
        }

        super();

        let fixedLength: number;
        let byteLength: number;
        let buffer: ArrayBufferLike;
        let byteOffset: number;
        let dataView: DataView;
        let elements: ArrayLike<InitType<TType>> | undefined;

        if (isTypedArrayConstructorArrayBufferLikeOverload(args)) {
            buffer = args[0];
            byteOffset = ToIndex(args.length > 1 ? args[1] : undefined);
            const length = args.length > 2 && args[2] !== undefined ? ToIndex(args[2]) : undefined;

            if (byteOffset % type.alignment) {
                throw new RangeError(`start offset of a ${new.target.name} must be a multiple of ${type.alignment}`);
            }
            if (type.fixedLength !== undefined) {
                if (length !== undefined && length !== type.fixedLength) {
                    throw new RangeError("Cannot override length of a fixed-length TypedArray");
                }
                fixedLength = type.fixedLength;
            }
            else {
                if (length === undefined) {
                    const remainingSize = buffer.byteLength - byteOffset;
                    if (remainingSize % elementSize) {
                        throw new RangeError(`byte length of typed array should be a multiple of ${elementSize}`);
                    }
                    fixedLength = remainingSize / elementSize;
                }
                else {
                    fixedLength = length;
                }
            }

            byteLength = fixedLength * elementSize;
            if (byteOffset > buffer.byteLength - byteLength) {
                throw new RangeError(`start offset ${byteOffset} is outside the bounds of the buffer`);
            }
            dataView = new DataView(buffer, byteOffset, byteLength);
        }
        else {
            let length: number | undefined;
            let shared: boolean | undefined;
            if (isTypedArrayConstructorLengthOverload(args)) {
                length = ToIndex(args[0]);
                shared = args.length > 1 ? args[1] : undefined;
            }
            else if (isTypedArrayConstructorElementsOverload(args)) {
                elements = args[0];
                shared = args.length > 1 ? args[1] : undefined;
            }
            else {
                shared = args.length > 0 ? args[0] : undefined;
            }

            if (type.fixedLength !== undefined) {
                if (length !== undefined && length !== type.fixedLength) {
                    throw new RangeError("Cannot override length of a fixed-length TypedArray");
                }
                else if (elements !== undefined && elements.length !== type.fixedLength) {
                    throw new RangeError("Wrong number of elements for fixed-length TypedArray");
                }

                fixedLength = type.fixedLength;
            }
            else {
                if (length !== undefined) {
                    fixedLength = length;
                }
                else if (elements !== undefined) {
                    fixedLength = elements.length;
                }
                else {
                    fixedLength = 0;
                }
            }

            if (shared && typeof SharedArrayBuffer !== "function") {
                throw new TypeError("SharedArrayBuffer is not available");
            }

            byteLength = fixedLength * elementSize;
            buffer = shared ? new SharedArrayBuffer(byteLength) : new ArrayBuffer(byteLength);
            dataView = new DataView(buffer, 0, byteLength);
        }

        this.#type = type;
        this.#fixedLength = fixedLength;
        this.#byteLength = byteLength;
        this.#buffer = buffer;
        this.#byteOffset = 0;
        this.#dataView = dataView;

        if (!(elementTypeInfo instanceof PrimitiveTypeInfo)) {
            this.#elementCacheView = new ElementCacheView(new ElementCache(fixedLength), 0, fixedLength);
        }

        if (elements !== undefined) {
            for (let i = 0; i < elements.length; i++) {
                const value = elements[i];
                if (value !== undefined) {
                    this[i] = elementTypeInfo.coerce(value) as RuntimeType<TType>;
                }
            }
        }
    }

    static get BYTES_PER_ELEMENT(): number { return ArrayTypeInfo.get(this).bytesPerElement; }
    static get SIZE(): number | undefined { return ArrayTypeInfo.get(this).size; }
    static get fixedLength(): number | undefined { return ArrayTypeInfo.get(this).fixedLength; }

    get length(): number { return this.#fixedLength; }
    get buffer(): ArrayBufferLike { return this.#buffer; }
    get byteOffset(): number { return this.#byteOffset; }
    get byteLength(): number { return this.#byteLength; }

    static toFixed(fixedLength: number) {
        return ArrayTypeInfo.get(this).toFixed(fixedLength).runtimeType;
    }

    protected override getLength(): number {
        return this.#fixedLength;
    }

    protected override getIndex(index: number): RuntimeType<TType> {
        let value = this.#elementCacheView?.get(index);
        if (value === undefined) {
            value = this.#type.readElementFrom(this.#dataView, index) as RuntimeType<TType>;
            this.#elementCacheView?.set(index, value);
        }
        return value;
    }

    protected override setIndex(index: number, value: RuntimeType<TType>): boolean {
        this.#type.writeElementTo(this.#dataView, index, value);
        return true;
    }

    protected override deleteIndex(index: number): boolean {
        const elementSize = this.#type.bytesPerElement;
        const ar = new Uint8Array(this.#buffer, this.#byteOffset, this.#byteLength);
        ar.fill(0, index * elementSize, (index + 1) * elementSize);
        return true;
    }

    writeTo(buffer: ArrayBufferLike, byteOffset?: number): void {
        byteOffset = ToIndex(byteOffset);
        if (byteOffset < 0 || byteOffset > buffer.byteLength - this.#byteLength) throw new RangeError("Out of range: byteOffset");
        if (byteOffset % this.#type.alignment) throw new RangeError(`Not aligned: byteOffset must be a multiple of ${this.#type.alignment}`);
        if (buffer === this.#buffer) {
            if (byteOffset === this.#byteOffset) {
                return;
            }
            new Uint8Array(buffer).copyWithin(byteOffset, this.#byteOffset, this.#byteLength);
            return;
        }

        const size = this.#byteLength;
        const src = new Uint8Array(this.#buffer, this.#byteOffset, size);
        const dest = new Uint8Array(buffer, byteOffset, size);
        dest.set(src);
    }

    toArray(): RuntimeType<TType>[] {
        const ar: RuntimeType<TType>[] = [];
        for (let i = 0; i < this.#fixedLength; i++) {
            ar[i] = this[i];
        }
        return ar;
    }

    copyWithin(target: number, start: number, end?: number): this {
        const thisLength = this.#fixedLength;

        target = ToIntegerOrInfinity(target);
        if (target === -Infinity) target = 0;
        else if (target < 0) target = Math.max(thisLength + target, 0);
        else target = Math.min(target, thisLength);

        start = ToIntegerOrInfinity(start);
        if (start === -Infinity) start = 0;
        else if (start < 0) start = Math.max(thisLength + start, 0);
        else start = Math.min(start, thisLength);

        end = end === undefined ? thisLength : ToIntegerOrInfinity(end);
        if (end === -Infinity) end = 0;
        else if (end < 0) end = Math.max(thisLength + end, 0);
        else end = Math.min(end, thisLength);

        const count = Math.min(end - start, thisLength - target);
        if (count > 0) {
            const elementSize = this.#type.bytesPerElement;
            const ar = new Uint8Array(this.#buffer, this.#byteOffset, this.#byteLength);
            ar.copyWithin(target * elementSize, start * elementSize, end * elementSize);
        }
        return this;
    }

    every(predicate: (value: RuntimeType<TType>, index: number) => unknown): boolean {
        const len = this.#fixedLength;
        for (let i = 0; i < len; i++) {
            if (!predicate(this[i], i)) {
                return false;
            }
        }
        return true;
    }

    some(predicate: (value: RuntimeType<TType>, index: number) => unknown): boolean {
        const len = this.#fixedLength;
        for (let i = 0; i < len; i++) {
            if (predicate(this[i], i)) {
                return true;
            }
        }
        return false;
    }

    fill(value: RuntimeType<TType>, start?: number, end?: number): this {
        const thisLength = this.#fixedLength;

        start = ToIntegerOrInfinity(start);
        if (start === -Infinity) start = 0;
        else if (start < 0) start = Math.max(thisLength + start, 0);
        else start = Math.min(start, thisLength);

        end = end === undefined ? thisLength : ToIntegerOrInfinity(end);
        if (end === -Infinity) end = 0;
        else if (end < 0) end = Math.max(thisLength + end, 0);
        else end = Math.min(end, thisLength);

        const count = Math.max(0, end - start);
        for (let i = 0; i < count; i++) {
            this[i + start] = value;
        }

        return this;
    }

    filter(predicate: (value: RuntimeType<TType>, index: number) => unknown) {
        const result: RuntimeType<TType>[] = [];
        const len = this.#fixedLength;
        for (let i = 0; i < len; i++) {
            const value = this[i];
            if (predicate(value, i)) {
                result.push(value);
            }
        }

        const ArrayType = this.#type.getResizedType(result.length);
        const shared = isSharedArrayBuffer(this.#buffer);
        const ar = new ArrayType(result, shared);
        return ar;
    }

    find(predicate: (value: RuntimeType<TType>, index: number) => unknown, fromIndex?: number): RuntimeType<TType> | undefined {
        const len = this.#fixedLength;
        if (len === 0) return undefined;

        fromIndex = ToIntegerOrInfinity(fromIndex);
        if (fromIndex === Infinity) return undefined;
        else if (fromIndex === -Infinity) fromIndex = 0;
        else if (fromIndex < 0) fromIndex = Math.max(len + fromIndex, 0);

        for (let i = fromIndex; i < len; i++) {
            const value = this[i];
            if (predicate(value, i)) return value;
        }
    }

    findIndex(predicate: (value: RuntimeType<TType>, index: number) => unknown, fromIndex?: number): number {
        const len = this.#fixedLength;
        if (len === 0) return -1;

        fromIndex = ToIntegerOrInfinity(fromIndex);
        if (fromIndex === Infinity) return -1;
        else if (fromIndex === -Infinity) fromIndex = 0;
        else if (fromIndex < 0) fromIndex = Math.max(len + fromIndex, 0);

        for (let i = fromIndex; i < len; i++) {
            const value = this[i];
            if (predicate(value, i)) return i;
        }
        return -1;
    }

    findLast(predicate: (value: RuntimeType<TType>, index: number) => unknown, fromIndex?: number): RuntimeType<TType> | undefined {
        const len = this.#fixedLength;
        if (len === 0) return undefined;

        fromIndex = fromIndex === undefined ? len - 1 : ToIntegerOrInfinity(fromIndex);
        if (fromIndex === -Infinity) return undefined;
        else if (fromIndex < 0) fromIndex = len + fromIndex;
        else fromIndex = Math.min(fromIndex, len - 1);

        for (let i = fromIndex; i >= 0; i--) {
            const value = this[i];
            if (predicate(value, i)) return value;
        }
    }

    findLastIndex(predicate: (value: RuntimeType<TType>, index: number) => unknown, fromIndex?: number): number {
        const len = this.#fixedLength;
        if (len === 0) return -1;

        fromIndex = fromIndex === undefined ? len - 1 : ToIntegerOrInfinity(fromIndex);
        if (fromIndex === -Infinity) return -1;
        else if (fromIndex < 0) fromIndex = len + fromIndex;
        else fromIndex = Math.min(fromIndex, len - 1);

        for (let i = fromIndex; i >= 0; i--) {
            const value = this[i];
            if (predicate(value, i)) return i;
        }
        return -1;
    }

    forEach(callbackfn: (value: RuntimeType<TType>, index: number) => void): void {
        const len = this.#fixedLength;
        for (let i = 0; i < len; i++) {
            const value = this[i];
            callbackfn(value, i);
        }
    }

    map(callbackfn: (value: RuntimeType<TType>, index: number) => RuntimeType<TType>) {
        const len = this.#fixedLength;
        const ArrayType = this.#type.getResizedType(this.#fixedLength);
        const shared = isSharedArrayBuffer(this.#buffer);
        const ar = new ArrayType(len, shared);
        for (let i = 0; i < len; i++) {
            ar[i] = callbackfn(this[i], i);
        }
        return ar;
    }

    mapToArray<U>(callbackfn: (value: RuntimeType<TType>, index: number) => U): U[] {
        const result: U[] = [];
        const len = this.#fixedLength;
        for (let i = 0; i < len; i++) {
            const value = callbackfn(this[i], i);
            result.push(value);
        }
        return result;
    }

    reduce<U>(callbackfn: (previousValue: U, value: RuntimeType<TType>, index: number) => U, initialValue: U): U;
    reduce(callbackfn: (previousValue: RuntimeType<TType>, value: RuntimeType<TType>, index: number) => RuntimeType<TType>): RuntimeType<TType>;
    reduce(callbackfn: (previousValue: RuntimeType<TType>, value: RuntimeType<TType>, index: number) => RuntimeType<TType>, initialValue?: RuntimeType<TType>) {
        let hasInitialValue = arguments.length > 1;
        let acc = initialValue;
        const len = this.#fixedLength;
        for (let i = 0; i < len; i++) {
            if (!hasInitialValue) {
                acc = this[i];
                hasInitialValue = true;
                continue;
            }
            acc = callbackfn(acc!, this[i], i);
        }
        return acc!;
    }

    reduceRight<U>(callbackfn: (previousValue: U, value: RuntimeType<TType>, index: number) => U, initialValue: U): U;
    reduceRight(callbackfn: (previousValue: RuntimeType<TType>, value: RuntimeType<TType>, index: number) => RuntimeType<TType>): RuntimeType<TType>;
    reduceRight(callbackfn: (previousValue: RuntimeType<TType>, value: RuntimeType<TType>, index: number) => RuntimeType<TType>, initialValue?: RuntimeType<TType>): RuntimeType<TType> {
        let hasInitialValue = arguments.length > 1;
        let acc = initialValue;
        for (let i = this.#fixedLength - 1; i >= 0; i--) {
            if (!hasInitialValue) {
                acc = this[i];
                hasInitialValue = true;
                continue;
            }
            acc = callbackfn(acc!, this[i], i);
        }
        return acc!;
    }

    set(array: ArrayLike<RuntimeType<TType>>, offset?: number): void {
        offset = ToIntegerOrInfinity(offset);
        if (offset < 0) throw new RangeError();
        if (offset === Infinity) throw new RangeError();

        if (array instanceof TypedArray) {
            const targetType = this.#type.elementTypeInfo;
            const targetElementSize = targetType.size!;
            const targetLength = this.#fixedLength;
            const targetByteOffset = this.#byteOffset;

            const sourceType = array.#type.elementTypeInfo;
            const sourceElementSize = sourceType.size!;
            const sourceLength = array.#fixedLength;
            const sourceByteOffset = array.#byteOffset;

            if (sourceLength + offset > targetLength) throw new RangeError();

            if (!targetType.isCompatibleWith(sourceType)) {
                throw new TypeError("Cannot set from a TypedArray with an incompatible type.");
            }

            if (sourceType === targetType) {
                const sourceArray = new Uint8Array(array.#buffer, array.#byteOffset, array.#byteLength);
                const targetArray = new Uint8Array(this.#buffer, this.#byteOffset, this.#byteLength);
                targetArray.set(sourceArray, offset * targetElementSize);
            }
            else {
                let sourceByteIndex = sourceByteOffset;
                let targetByteIndex = offset * targetElementSize + targetByteOffset;
                const limit = targetByteIndex + targetElementSize * sourceLength;
                while (targetByteIndex < limit) {
                    const value = sourceType.readFrom(array.#dataView, sourceByteIndex);
                    targetType.writeTo(this.#dataView, targetByteIndex, value);
                    sourceByteIndex += sourceElementSize;
                    targetByteIndex += targetElementSize;
                }
            }
        }
        else {
            const len = array.length;
            if (len + offset > this.#fixedLength) throw new RangeError();

            for (let i = 0; i < len; i++) {
                this[i + offset] = array[i];
            }
        }
    }

    subarray(start?: number, end?: number) {
        const thisLength = this.#fixedLength;
        const elementSize = this.#type.bytesPerElement;

        start = ToIntegerOrInfinity(start);
        if (start === -Infinity) start = 0;
        else if (start < 0) start = Math.max(thisLength + start, 0);
        else start = Math.min(start, thisLength);

        end = end === undefined ? thisLength : ToIntegerOrInfinity(end);
        if (end === -Infinity) end = 0;
        else if (end < 0) end = Math.max(thisLength + end, 0);
        else end = Math.min(end, thisLength);

        const count = Math.max(0, end - start);
        const ArrayType = this.#type.getResizedType(count);
        const ar = new ArrayType(this.#buffer, start * elementSize, count);
        if (this.#elementCacheView) {
            (ar as TypedArray<any>).#elementCacheView = new ElementCacheView(this.#elementCacheView.cache, start, count);
        }
        return ar;
    }

    slice(start?: number, end?: number) {
        const thisLength = this.#fixedLength;
        const elementSize = this.#type.bytesPerElement;

        start = ToIntegerOrInfinity(start);
        if (start === -Infinity) start = 0;
        else if (start < 0) start = Math.max(thisLength + start, 0);
        else start = Math.min(start, thisLength);

        end = end === undefined ? thisLength : ToIntegerOrInfinity(end);
        if (end === -Infinity) end = 0;
        else if (end < 0) end = Math.max(thisLength + end, 0);
        else end = Math.min(end, thisLength);

        const count = Math.max(0, end - start);
        const buffer = this.#buffer.slice(start * elementSize, end * elementSize);
        const ArrayType = this.#type.getResizedType(count);
        const ar = new ArrayType(buffer, 0, count);
        return ar;
    }

    at(index: number) {
        const thisLength = this.#fixedLength;
        index = ToIntegerOrInfinity(index);
        if (index < 0) index = thisLength + index;
        if (index < 0 || index >= thisLength) return undefined;
        return this[index];
    }

    * keys(): IterableIterator<number> {
        const len = this.#fixedLength;
        for (let i = 0; i < len; i++) {
            yield i;
        }
    }

    * values(): IterableIterator<RuntimeType<TType>> {
        const len = this.#fixedLength;
        for (let i = 0; i < len; i++) {
            yield this[i];
        }
    }

    * entries(): IterableIterator<[number, RuntimeType<TType>]> {
        const len = this.#fixedLength;
        for (let i = 0; i < len; i++) {
            yield [i, this[i]];
        }
    }

    * [Symbol.iterator](): IterableIterator<RuntimeType<TType>> {
        const len = this.#fixedLength;
        for (let i = 0; i < len; i++) {
            yield this[i];
        }
    }
}

type WeakRuntimeType<TType extends Type> = Exclude<RuntimeType<TType>, object> | WeakRef<Extract<RuntimeType<TType>, object>>;

class ElementCache<TType extends Type> {
    #entries: (WeakRuntimeType<TType> | undefined)[] | undefined;

    readonly fixedLength: number;

    constructor(fixedLength: number) {
        this.fixedLength = fixedLength;
    }

    get hasValues() {
        return this.#entries !== undefined;
    }

    get values() {
        this.#entries ??= Array(this.fixedLength);
        return this.#entries;
    }
}

class ElementCacheView<TType extends Type> {
    readonly cache: ElementCache<TType>;

    #offset: number;
    #length: number;

    constructor(cache: ElementCache<TType>, offset: number, length: number) {
        if (offset < 0) offset = 0;
        if (offset >= cache.fixedLength) offset = cache.fixedLength;

        if (length < 0) length = 0;
        if (length > cache.fixedLength - offset) length = cache.fixedLength - offset;

        this.cache = cache;
        this.#offset = offset;
        this.#length = length;
    }

    get(index: number) {
        if (!this.cache.hasValues) return undefined;
        if (index < 0) return undefined;
        if (index >= this.#length) return undefined;
        const value = this.cache.values[index + this.#offset];
        return (typeof value === "object" ? value.deref() : value) as RuntimeType<TType> | undefined;
    }

    set(index: number, value: RuntimeType<TType>) {
        if (index < 0) return;
        if (index >= this.#length) return;
        this.cache.values[index + this.#offset] = (typeof value === "object" ? new WeakRef(value) : value) as WeakRuntimeType<TType>;
    }
}

function ToIntegerOrInfinity(value: unknown) {
    let number = Number(value);
    if (isNaN(number)) return 0;
    if (!isFinite(number)) return number;
    number = Math.trunc(number);
    if (Object.is(number, -0)) return 0;
    return number;
}

function ToLength(argument: number) {
    const len = ToIntegerOrInfinity(argument);
    if (len <= 0) return 0;
    return Math.min(len, (2 ** 53) - 1);
}

function ToIndex(value: unknown) {
    if (value === undefined) return 0;
    const integer = ToIntegerOrInfinity(value);
    const clamped = ToLength(integer);
    if (!Object.is(integer, clamped)) throw new RangeError("Invalid typed array length");
    return integer;
}

/* @internal */
export { TypedArray as TypedArrayImpl };

