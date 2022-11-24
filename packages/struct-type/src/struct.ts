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

import { combineHashes, Equaler, Equatable, StructuralEquatable } from '@esfx/equatable';
import { numstr } from '@esfx/type-model';
import type { StructFieldDefinition, StructFieldRuntimeType, StructInitElements, StructInitProperties } from './index.js';
import { StructTypeInfo } from './typeInfo.js';

let _getIsLittleEndian: (struct: Struct) => boolean;

/* @internal */
export function getIsLittleEndian(struct: Struct): boolean {
    return _getIsLittleEndian(struct);
}

type StructConstructorArrayBufferLikeOverload = [buffer: ArrayBufferLike, byteOffset?: number, isLittleEndian?: boolean];
function isStructConstructorArrayBufferLikeOverload<TDef extends readonly StructFieldDefinition[]>(args: StructConstructorOverloads<TDef>): args is StructConstructorArrayBufferLikeOverload {
    return (
        /*arity*/ (args.length >= 1 && args.length <= 3) &&
        /*buffer*/ (args[0] instanceof ArrayBuffer || (typeof SharedArrayBuffer === "function" && args[0] instanceof SharedArrayBuffer)) &&
        /*byteOffset?*/ (args.length <= 1 || args[1] === undefined || typeof args[1] === "number") &&
        /*isLittleEndian?*/ (args.length <= 2 || args[2] === undefined || typeof args[2] === "boolean")
    );
}

type StructConstructorStructFieldsOverload<TDef extends readonly StructFieldDefinition[]> = [object: Partial<StructInitProperties<TDef>>, shared?: boolean, isLittleEndian?: boolean];
function isStructConstructorStructFieldsOverload<TDef extends readonly StructFieldDefinition[]>(args: StructConstructorOverloads<TDef>): args is StructConstructorStructFieldsOverload<TDef> {
    return (
        /*arity*/ (args.length >= 1 && args.length <= 3) &&
        /*object*/ (typeof args[0] === "object" && args[0] !== null && !Array.isArray(args[0])) &&
        /*shared?*/ (args.length <= 1 || args[1] === undefined || typeof args[1] === "boolean") &&
        /*isLittleEndian?*/ (args.length <= 2 || args[2] === undefined || typeof args[2] === "boolean")
    );
}

type StructConstructorStructFieldArrayOverload<TDef extends readonly StructFieldDefinition[]> = [elements: Partial<StructInitElements<TDef>>, shared?: boolean, isLittleEndian?: boolean];
function isStructConstructorStructFieldArrayOverload<TDef extends readonly StructFieldDefinition[]>(args: StructConstructorOverloads<TDef>): args is StructConstructorStructFieldArrayOverload<TDef> {
    return (
        /*arity*/ (args.length >= 1 && args.length <= 3) &&
        /*elements*/ (Array.isArray(args[0])) &&
        /*shared?*/ (args.length <= 1 || args[1] === undefined || typeof args[1] === "boolean") &&
        /*isLittleEndian?*/ (args.length <= 2 || args[2] === undefined || typeof args[2] === "boolean")
    );
}

type StructConstructorSharedOverload = [shared: boolean, isLittleEndian?: boolean];
function isStructConstructorSharedOverload<TDef extends readonly StructFieldDefinition[]>(args: StructConstructorOverloads<TDef>): args is StructConstructorSharedOverload {
    return (
        /*arity*/ (args.length >= 1 && args.length <= 2) &&
        /*shared?*/ (typeof args[0] === "boolean") &&
        /*isLittleEndian?*/ (args.length <= 1 || args[1] === undefined || typeof args[1] === "boolean")
    );
}

type StructConstructorEmptyOverload = [];
function isStructConstructorEmptyOverload<TDef extends readonly StructFieldDefinition[]>(args: StructConstructorOverloads<TDef>): args is StructConstructorEmptyOverload {
    return (
        /*arity*/ (args.length === 0)
    );
}

type StructConstructorOverloads<TDef extends readonly StructFieldDefinition[]> =
    | StructConstructorEmptyOverload
    | StructConstructorSharedOverload
    | StructConstructorArrayBufferLikeOverload
    | StructConstructorStructFieldsOverload<TDef>
    | StructConstructorStructFieldArrayOverload<TDef>
    ;

/* @internal */
export abstract class Struct<TDef extends readonly StructFieldDefinition[] = any> implements Equatable, StructuralEquatable {
    static {
        _getIsLittleEndian = struct => struct.#isLittleEndian;
    }

    #buffer: ArrayBufferLike;
    #byteOffset: number;
    #type: StructTypeInfo;
    #isLittleEndian: boolean;

    constructor();
    constructor(shared: boolean, isLittleEndian?: boolean);
    constructor(buffer: ArrayBufferLike, byteOffset?: number, isLittleEndian?: boolean);
    constructor(object: Partial<StructInitProperties<TDef>>, shared?: boolean, isLittleEndian?: boolean);
    constructor(elements: Partial<StructInitElements<TDef>>, shared?: boolean, isLittleEndian?: boolean);
    constructor(...args: StructConstructorOverloads<TDef>) {
        this.#type = StructTypeInfo.get(new.target);
        if (isStructConstructorArrayBufferLikeOverload(args)) {
            const [buffer, byteOffset = 0, isLittleEndian = false] = args;
            if (byteOffset < 0 || byteOffset > buffer.byteLength - this.#type.size) throw new RangeError("Out of range: byteOffset");
            if (byteOffset % this.#type.alignment) throw new RangeError(`Not aligned: byteOffset must be a multiple of ${this.#type.alignment}`);
            this.#buffer = buffer;
            this.#byteOffset = byteOffset;
            this.#isLittleEndian = isLittleEndian;
        }
        else if (isStructConstructorStructFieldsOverload(args)) {
            const [object, shared = false, isLittleEndian = false] = args;
            if (shared && typeof SharedArrayBuffer !== "function") throw new TypeError("SharedArrayBuffer is not available");
            this.#buffer = shared ? new SharedArrayBuffer(this.#type.size) : new ArrayBuffer(this.#type.size);
            this.#byteOffset = 0;
            this.#isLittleEndian = isLittleEndian;
            for (const key of Object.keys(object)) {
                const value = object[key as keyof Partial<StructInitProperties<TDef>>];
                if (value !== undefined) {
                    const field = this.#type.fieldsByName.get(key);
                    if (field) {
                        field.writeToBuffer(this, this.#buffer, this.#byteOffset, field.coerce(value), this.#isLittleEndian);
                    }
                }
            }
        }
        else if (isStructConstructorStructFieldArrayOverload(args)) {
            const [array, shared = false, isLittleEndian = false] = args;
            if (shared && typeof SharedArrayBuffer !== "function") throw new TypeError("SharedArrayBuffer is not available");
            this.#buffer = shared ? new SharedArrayBuffer(this.#type.size) : new ArrayBuffer(this.#type.size);
            this.#byteOffset = 0;
            this.#isLittleEndian = isLittleEndian;
            for (const [index, value] of array.entries()) {
                if (value !== undefined && index < this.#type.fields.length) {
                    const field = this.#type.fields[index];
                    field.writeToBuffer(this, this.#buffer, this.#byteOffset, field.coerce(value), this.#isLittleEndian);
                }
            }
        }
        else if (isStructConstructorSharedOverload(args) || isStructConstructorEmptyOverload(args)) {
            const [shared = false, isLittleEndian = false] = args;
            if (shared && typeof SharedArrayBuffer !== "function") throw new TypeError("SharedArrayBuffer is not available");
            this.#buffer = shared ? new SharedArrayBuffer(this.#type.size) : new ArrayBuffer(this.#type.size);
            this.#byteOffset = 0;
            this.#isLittleEndian = isLittleEndian;
        }
        else {
            throw new TypeError("Invalid arguments");
        }
 
        Object.freeze(this);
    }

    static get SIZE(): number { return StructTypeInfo.get(this).size; }

    get buffer() { return this.#buffer; }
    get byteOffset() { return this.#byteOffset; }
    get byteLength() { return this.#type.size; }

    get<K extends TDef[number]["name"]>(key: K): StructFieldRuntimeType<Extract<TDef[number], { readonly name: K }>>;
    get<K extends TDef[number]["name"]>(key: K) {
        const field = this.#type.fieldsByName.get(key);
        if (field) {
            return field.readFromBuffer(this, this.#buffer, this.#byteOffset, this.#isLittleEndian);
        }
        throw new RangeError();
    }

    set<K extends TDef[number]["name"]>(key: K, value: StructFieldRuntimeType<Extract<TDef[number], { readonly name: K }>>) {
        const field = this.#type.fieldsByName.get(key);
        if (field) {
            field.writeToBuffer(this, this.#buffer, this.#byteOffset, field.coerce(value), this.#isLittleEndian);
            return;
        }
        throw new RangeError();
    }

    getIndex<I extends numstr<keyof TDef>>(index: I): StructFieldRuntimeType<Extract<TDef[Extract<I, keyof TDef>], StructFieldDefinition>>;
    getIndex<I extends numstr<keyof TDef>>(index: I) {
        if (index < this.#type.fields.length) {
            const field = this.#type.fields[index as number];
            return field.readFromBuffer(this, this.#buffer, this.#byteOffset, this.#isLittleEndian);
        }
        throw new RangeError();
    }

    setIndex<I extends keyof TDef & number>(index: I, value: StructFieldRuntimeType<Extract<TDef[I], StructFieldDefinition>>) {
        if (index < this.#type.fields.length) {
            const field = this.#type.fields[index as number];
            field.writeToBuffer(this, this.#buffer, this.#byteOffset, field.coerce(value), this.#isLittleEndian);
            return true;
        }
        return false;
    }

    writeTo(buffer: ArrayBufferLike, byteOffset: number = 0, isLittleEndian: boolean = false) {
        if (byteOffset < 0 || byteOffset > buffer.byteLength - this.#type.size) throw new RangeError("Out of range: byteOffset");
        if (byteOffset % this.#type.alignment) throw new RangeError(`Not aligned: byteOffset must be a multiple of ${this.#type.alignment}`);
        if (isLittleEndian === this.#isLittleEndian) {
            if (buffer === this.#buffer) {
                if (byteOffset === this.#byteOffset) {
                    return;
                }
                new Uint8Array(buffer).copyWithin(byteOffset, this.#byteOffset, this.#type.size);
                return;
            }
    
            const size = this.#type.size;
            const src = new Uint8Array(this.#buffer, this.#byteOffset, size);
            const dest = new Uint8Array(buffer, byteOffset, size);
            dest.set(src);
        }
        else {
            for (let i = 0; i < this.#type.fields.length; i++) {
                const value = this.#type.fields[i].readFromBuffer(this, this.#buffer, this.#byteOffset, this.#isLittleEndian);
                this.#type.fields[i].writeToBuffer(this, buffer, this.#byteOffset + byteOffset, value, isLittleEndian);
            }
        }
    }

    [Equatable.equals](other: unknown): boolean {
        return this[StructuralEquatable.structuralEquals](other, Equaler.defaultEqualer);
    }

    [Equatable.hash](): number {
        return this[StructuralEquatable.structuralHash](Equaler.defaultEqualer);
    }

    [StructuralEquatable.structuralEquals](other: unknown, equaler: Equaler<unknown>): boolean {
        if (!(other instanceof Struct)) return false;
        if (!Equaler.defaultEqualer.equals(this.#type, other.#type)) return false;
        for (let i = 0; i < this.#type.fields.length; i++) {
            const thisValue = this.#type.fields[i].readFromBuffer(this, this.#buffer, this.#byteOffset, this.#isLittleEndian);
            const otherValue = other.#type.fields[i].readFromBuffer(other, other.#buffer, other.#byteOffset, other.#isLittleEndian);
            if (!equaler.equals(thisValue, otherValue)) return false;
        }
        return true;
    }

    [StructuralEquatable.structuralHash](equaler: Equaler<unknown>): number {
        let hc = 0;
        hc = combineHashes(hc, Equaler.defaultEqualer.hash(this.#type));
        for (let i = 0; i < this.#type.fields.length; i++) {
            const field = this.#type.fields[i];
            hc = combineHashes(hc, equaler.hash(field.readFromBuffer(this, this.#buffer, this.#byteOffset, this.#isLittleEndian)));
        }
        return hc;
    }
}

new StructTypeInfo([]).finishType(Struct);
