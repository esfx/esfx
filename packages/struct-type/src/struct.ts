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

import type { StructDefinition, StructElementLayout, StructElementLayoutIndices, StructArrayInit, StructObjectInit, StructFieldLayout, StructPropertyLayoutKeys } from './index.js';
import { StructTypeInfo } from './typeInfo.js';

let _getDataView: (struct: Struct) => DataView;

/* @internal */
export function getDataView(struct: Struct): DataView {
    return _getDataView(struct);
}

type StructConstructorEmptyOverload = [];
type StructConstructorSharedOverload = [boolean];
type StructConstructorArrayBufferLikeOverload = [ArrayBufferLike, number?];
type StructConstructorStructFieldsOverload<TDef extends StructDefinition> = [Partial<StructObjectInit<TDef>>, boolean?];
type StructConstructorStructFieldArrayOverload<TDef extends StructDefinition> = [Partial<StructArrayInit<TDef>>, boolean?];
type StructConstructorOverloads<TDef extends StructDefinition> =
    | StructConstructorEmptyOverload
    | StructConstructorSharedOverload
    | StructConstructorArrayBufferLikeOverload
    | StructConstructorStructFieldsOverload<TDef>
    | StructConstructorStructFieldArrayOverload<TDef>;

function isStructConstructorArrayBufferLikeOverload<TDef extends StructDefinition>(args: StructConstructorOverloads<TDef>): args is StructConstructorArrayBufferLikeOverload {
    return args.length > 0 && (args[0] instanceof ArrayBuffer || (typeof SharedArrayBuffer === "function" && args[0] instanceof SharedArrayBuffer));
}

function isStructConstructorStructFieldsOverload<TDef extends StructDefinition>(args: StructConstructorOverloads<TDef>): args is StructConstructorStructFieldsOverload<TDef> {
    return args.length > 0 && typeof args[0] === "object" && args[0] !== null && !Array.isArray(args[0]);
}

function isStructConstructorStructFieldArrayOverload<TDef extends StructDefinition>(args: StructConstructorOverloads<TDef>): args is StructConstructorStructFieldArrayOverload<TDef> {
    return args.length > 0 && Array.isArray(args[0]);
}

/* @internal */
abstract class Struct<TDef extends StructDefinition = any> {
    static {
        _getDataView = struct => struct.#dataView;
    }

    #buffer: ArrayBufferLike;
    #byteOffset: number;
    #type: StructTypeInfo;
    #dataView: DataView;

    constructor();
    constructor(shared: boolean);
    constructor(buffer: ArrayBufferLike, byteOffset?: number);
    constructor(object: Partial<StructObjectInit<TDef>>, shared?: boolean);
    constructor(elements: Partial<StructArrayInit<TDef>>, shared?: boolean);
    constructor(...args: StructConstructorOverloads<TDef>) {
        this.#type = StructTypeInfo.get(new.target);
        if (isStructConstructorArrayBufferLikeOverload(args)) {
            const [buffer, byteOffset = 0] = args;
            if (byteOffset < 0 || byteOffset > buffer.byteLength - this.#type.size) throw new RangeError("Out of range: byteOffset");
            if (byteOffset % this.#type.alignment) throw new RangeError(`Not aligned: byteOffset must be a multiple of ${this.#type.alignment}`);
            this.#buffer = buffer;
            this.#byteOffset = byteOffset;
            this.#dataView = new DataView(buffer, byteOffset, this.#type.size);
        }
        else {
            const shared =
                isStructConstructorStructFieldsOverload(args) ? args[1] :
                isStructConstructorStructFieldArrayOverload(args) ? args[1] :
                args[0];
            if (shared && typeof SharedArrayBuffer !== "function") throw new TypeError("SharedArrayBuffer is not available");
            this.#buffer = shared ? new SharedArrayBuffer(this.#type.size) : new ArrayBuffer(this.#type.size);
            this.#byteOffset = 0;
            this.#dataView = new DataView(this.#buffer, 0, this.#type.size);
            if (isStructConstructorStructFieldsOverload(args)) {
                const [obj] = args;
                if (obj) {
                    for (const key of Object.keys(obj)) {
                        const value = obj[key as keyof Partial<StructObjectInit<TDef>>];
                        if (value !== undefined) {
                            const field = this.#type.fieldsByName.get(key);
                            if (field) {
                                field.writeTo(this, this.#dataView, field.coerce(value));
                            }
                        }
                    }
                }
            }
            else if (isStructConstructorStructFieldArrayOverload(args)) {
                const [ar] = args;
                if (ar) {
                    for (const [index, value] of ar.entries!()) {
                        if (value !== undefined && index < this.#type.fields.length) {
                            const field = this.#type.fields[index];
                            field.writeTo(this, this.#dataView, field.coerce(value));
                        }
                    }
                }
            }
        }
        Object.freeze(this);
    }

    static get SIZE(): number { return StructTypeInfo.get(this).size; }

    get buffer() { return this.#buffer; }
    get byteOffset() { return this.#byteOffset; }
    get byteLength() { return this.#type.size; }

    get<K extends StructPropertyLayoutKeys<TDef>>(key: K): StructFieldLayout<TDef>[K];
    get<K extends StructPropertyLayoutKeys<TDef>>(key: K) {
        const field = this.#type.fieldsByName.get(key as string | symbol);
        if (field) {
            return field.readFrom(this, this.#dataView);
        }
        throw new RangeError();
    }

    set<K extends StructPropertyLayoutKeys<TDef>>(key: K, value: StructFieldLayout<TDef>[K]) {
        const field = this.#type.fieldsByName.get(key as string | symbol);
        if (field) {
            field.writeTo(this, this.#dataView, field.coerce(value));
            return;
        }
        throw new RangeError();
    }

    getIndex<I extends StructElementLayoutIndices<TDef>>(index: I): StructElementLayout<TDef>[I];
    getIndex<I extends StructElementLayoutIndices<TDef>>(index: I) {
        if (+index < this.#type.fields.length) {
            const field = this.#type.fields[index as number];
            return field.readFrom(this, this.#dataView);
        }
        throw new RangeError();
    }

    setIndex<I extends StructElementLayoutIndices<TDef>>(index: I, value: StructElementLayout<TDef>[I]) {
        if (index < this.#type.fields.length) {
            const field = this.#type.fields[index as number];
            field.writeTo(this, this.#dataView, field.coerce(value));
            return true;
        }
        return false;
    }

    writeTo(buffer: ArrayBufferLike, byteOffset: number = 0) {
        if (byteOffset < 0 || byteOffset > buffer.byteLength - this.#type.size) throw new RangeError("Out of range: byteOffset");
        if (byteOffset % this.#type.alignment) throw new RangeError(`Not aligned: byteOffset must be a multiple of ${this.#type.alignment}`);
        if (buffer === this.#buffer) {
            if (byteOffset === this.#byteOffset) {
                return;
            }
            new Uint8Array(buffer).copyWithin(byteOffset, this.#byteOffset, this.#byteOffset + this.#type.size);
            return;
        }

        const size = this.#type.size;
        const src = new Uint8Array(this.#buffer, this.#byteOffset, size);
        const dest = new Uint8Array(buffer, byteOffset, size);
        dest.set(src);
    }
}

/* @internal */
export { Struct as StructImpl };
