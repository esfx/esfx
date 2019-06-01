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

import { PrimitiveTypeInfo, StructTypeInfo } from './typeInfo';
import { NumberType, NumberTypeToType, coerceValue } from './numbers';

export interface StructPrimitiveType<K extends string = string, T extends number | bigint = number | bigint> {
    readonly name: K;
    readonly SIZE: number;
    (value: number | bigint): T;
}

const primitiveTypes = new Set<object>();

function createPrimitiveType<K extends string, N extends NumberType>(name: K, nt: N): StructPrimitiveType<K, NumberTypeToType[N]> {
    const typeInfo = new PrimitiveTypeInfo(nt);
    const type: StructPrimitiveType<K, NumberTypeToType[N]> = Object.defineProperties(function (value: number | bigint) {
        return coerceValue(nt, value);
    }, {
        name: { value: name },
        SIZE: { value: typeInfo.size },
    });
    primitiveTypes.add(type);
    return typeInfo.finishType(type);
}

export const int8 = createPrimitiveType("int8", NumberType.Int8);
export const int16 = createPrimitiveType("int16", NumberType.Int16);
export const int32 = createPrimitiveType("int32", NumberType.Int32);
export const uint8 = createPrimitiveType("uint8", NumberType.Uint8);
export const uint16 = createPrimitiveType("uint16", NumberType.Uint16);
export const uint32 = createPrimitiveType("uint32", NumberType.Uint32);
export const float32 = createPrimitiveType("float32", NumberType.Float32);
export const float64 = createPrimitiveType("float64", NumberType.Float64);
export const bigint64 = createPrimitiveType("bigint64", NumberType.BigInt64);
export const biguint64 = createPrimitiveType("biguint64", NumberType.BigUint64);

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
    | StructType;

export interface StructFieldDefinition {
    readonly name: string | symbol;
    readonly type: StructFieldType;
}

type __Concat<L extends readonly any[], R extends readonly any[]> =
    L extends readonly [] ? R :
    L extends readonly [any] ? ((l0: L[0], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    L extends readonly [any, any] ? ((l0: L[0], l1: L[1], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    L extends readonly [any, any, any] ? ((l0: L[0], l1: L[1], l2: L[2], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    L extends readonly [any, any, any, any] ? ((l0: L[0], l1: L[1], l2: L[2], l3: L[3], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    L extends readonly [any, any, any, any, any] ? ((l0: L[0], l1: L[1], l2: L[2], l3: L[3], l4: L[4], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    L extends readonly [any, any, any, any, any, any] ? ((l0: L[0], l1: L[1], l2: L[2], l3: L[3], l4: L[4], l5: L[5], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    L extends readonly [any, any, any, any, any, any, any] ? ((l0: L[0], l1: L[1], l2: L[2], l3: L[3], l4: L[4], l5: L[5], l6: L[6], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    L extends readonly [any, any, any, any, any, any, any, any] ? ((l0: L[0], l1: L[1], l2: L[2], l3: L[3], l4: L[4], l5: L[5], l6: L[6], l7: L[7], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    L extends readonly [any, any, any, any, any, any, any, any, any] ? ((l0: L[0], l1: L[1], l2: L[2], l3: L[3], l4: L[4], l5: L[5], l6: L[6], l7: L[7], l8: L[8], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    L extends readonly [any, any, any, any, any, any, any, any, any, any] ? ((l0: L[0], l1: L[1], l2: L[2], l3: L[3], l4: L[4], l5: L[5], l6: L[6], l7: L[7], l8: L[8], l9: L[9], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    readonly never[];

export type StructDefinition = readonly StructFieldDefinition[];

export type StructFieldRuntimeType<T extends StructFieldType> =
    T extends StructPrimitiveType ? ReturnType<T> :
    T extends StructType ? InstanceType<T> :
    never;

export type StructProperties<TDef extends StructDefinition> = {
    [P in TDef[number]["name"]]: StructFieldRuntimeType<Extract<TDef[number], { readonly name: P }>["type"]>;
};

export type StructElements<TDef extends StructDefinition> = {
    [I in Extract<keyof TDef, number>]: StructFieldRuntimeType<TDef[I]["type"]>;
};

export type StructInitFieldType<T extends StructFieldType> =
    T extends StructPrimitiveType ? ReturnType<T> :
    T extends StructType<infer TDef> ? InstanceType<T> | StructInitProperties<TDef> | StructInitElements<TDef> :
    never;

export type StructInitProperties<TDef extends StructDefinition> = {
    [P in TDef[number]["name"]]: StructInitFieldType<Extract<TDef[number], { readonly name: P }>["type"]>;
};

export type StructInitElements<TDef extends StructDefinition> = {
    [I in keyof TDef]: TDef[I] extends StructFieldDefinition ? StructInitFieldType<TDef[I]["type"]> : never;
};

declare const kFields: unique symbol;

export interface StructType<TDef extends StructDefinition = any> {
    new (buffer: ArrayBufferLike, byteOffset?: number): TypedStruct<TDef>;
    readonly SIZE: number;
    [kFields]: TDef;
}

export interface StructClass<TDef extends StructDefinition = any> extends StructType<TDef> {
    [kFields]: TDef;
    new (): TypedStruct<TDef>;
    new (shared: boolean): TypedStruct<TDef>;
    new (buffer: ArrayBufferLike, byteOffset?: number): TypedStruct<TDef>;
    new (object: Partial<StructInitProperties<TDef>>, shared?: boolean): TypedStruct<TDef>;
    new (elements: Partial<StructInitElements<TDef>>, shared?: boolean): TypedStruct<TDef>;
    readonly SIZE: number;
}

export type TypedStruct<TDef extends StructDefinition> =
    & Struct<TDef>
    & StructProperties<TDef>
    & StructElements<TDef>;

const kBuffer = Symbol("[[Buffer]]");
const kByteOffset = Symbol("[[ByteOffset]]");
const kDataView = Symbol("[[DataView]]");
const kType = Symbol("[[Type]]");

export abstract class Struct<TDef extends StructDefinition = any> {
    private [kBuffer]: ArrayBufferLike;
    private [kByteOffset]: number;
    private [kType]: StructTypeInfo;
    private [kDataView]: DataView;

    constructor();
    constructor(shared: boolean);
    constructor(buffer: ArrayBufferLike, byteOffset?: number);
    constructor(object: Partial<StructInitProperties<TDef>>, shared?: boolean);
    constructor(elements: Partial<StructInitElements<TDef>>, shared?: boolean);
    constructor(...args: StructConstructorOverloads<TDef>) {
        this[kType] = StructTypeInfo.get(new.target);
        if (isStructConstructorArrayBufferLikeOverload(args)) {
            const [buffer, byteOffset = 0] = args;
            if (byteOffset < 0 || byteOffset > buffer.byteLength - this[kType].size) throw new RangeError("Out of range: byteOffset");
            if (byteOffset % this[kType].alignment) throw new RangeError(`Not aligned: byteOffset must be a multiple of ${this[kType].alignment}`);
            this[kBuffer] = buffer;
            this[kByteOffset] = byteOffset;
            this[kDataView] = new DataView(buffer, byteOffset, this[kType].size);
        }
        else {
            const shared =
                isStructConstructorStructFieldsOverload(args) ? args[1] :
                isStructConstructorStructFieldArrayOverload(args) ? args[1] :
                args[0];
            this[kBuffer] = shared ? new SharedArrayBuffer(this[kType].size) : new ArrayBuffer(this[kType].size);
            this[kByteOffset] = 0;
            this[kDataView] = new DataView(this[kBuffer], 0, this[kType].size);
            if (isStructConstructorStructFieldsOverload(args)) {
                const [obj] = args;
                if (obj) {
                    for (const key of Object.keys(obj)) {
                        const value = obj[key as keyof Partial<StructInitProperties<TDef>>];
                        if (value !== undefined) {
                            const field = this[kType].fieldsByName.get(key);
                            if (field) {
                                field.writeTo(this, this[kDataView], field.coerce(value));
                            }
                        }
                    }
                }
            }
            else if (isStructConstructorStructFieldArrayOverload(args)) {
                const [ar] = args;
                if (ar) {
                    for (const [index, value] of ar.entries()) {
                        if (value !== undefined && index < this[kType].fields.length) {
                            const field = this[kType].fields[index];
                            field.writeTo(this, this[kDataView], field.coerce(value));
                        }
                    }
                }
            }
        }
        Object.freeze(this);
    }

    static get SIZE(): number { return StructTypeInfo.get(this).size; }

    get buffer() { return this[kBuffer]; }
    get byteOffset() { return this[kByteOffset]; }
    get byteLength() { return this[kType].size; }

    get<K extends keyof StructProperties<TDef>>(key: K): StructProperties<TDef>[K] {
        const field = this[kType].fieldsByName.get(key);
        if (field) {
            return field.readFrom(this, this[kDataView]) as StructProperties<TDef>[K];
        }
        throw new RangeError();
    }

    set<K extends keyof StructProperties<TDef>>(key: K, value: StructProperties<TDef>[K]) {
        const field = this[kType].fieldsByName.get(key);
        if (field) {
            field.writeTo(this, this[kDataView], field.coerce(value));
            return;
        }
        throw new RangeError();
    }

    getIndex<I extends keyof StructElements<TDef>>(index: I): StructElements<TDef>[I] {
        if (index < this[kType].fields.length) {
            const field = this[kType].fields[index];
            return field.readFrom(this, this[kDataView]) as StructElements<TDef>[I];
        }
        throw new RangeError();
    }

    setIndex<I extends keyof StructElements<TDef>>(index: I, value: StructElements<TDef>[I]) {
        if (index < this[kType].fields.length) {
            const field = this[kType].fields[index];
            field.writeTo(this, this[kDataView], field.coerce(value));
            return true;
        }
        return false;
    }

    writeTo(buffer: ArrayBufferLike, byteOffset: number = 0) {
        if (byteOffset < 0 || byteOffset > buffer.byteLength - this[kType].size) throw new RangeError("Out of range: byteOffset");
        if (byteOffset % this[kType].alignment) throw new RangeError(`Not aligned: byteOffset must be a multiple of ${this[kType].alignment}`);
        if (buffer === this[kBuffer]) {
            if (byteOffset === this[kByteOffset]) {
                return;
            }
            new Uint8Array(buffer).copyWithin(byteOffset, this[kByteOffset], this[kType].size);
            return;
        }

        const size = this[kType].size;
        const src = new Uint8Array(this[kBuffer], this[kByteOffset], size);
        const dest = new Uint8Array(buffer, byteOffset, size);
        dest.set(src);
    }
}

new StructTypeInfo([]).finishType(Struct);

type StructConstructorEmptyOverload = [];
type StructConstructorSharedOverload = [boolean];
type StructConstructorArrayBufferLikeOverload = [ArrayBufferLike, number?];
type StructConstructorStructFieldsOverload<TDef extends StructDefinition> = [Partial<StructInitProperties<TDef>>, boolean?];
type StructConstructorStructFieldArrayOverload<TDef extends StructDefinition> = [Partial<StructInitElements<TDef>>, boolean?];
type StructConstructorOverloads<TDef extends StructDefinition> =
    | StructConstructorEmptyOverload
    | StructConstructorSharedOverload
    | StructConstructorArrayBufferLikeOverload
    | StructConstructorStructFieldsOverload<TDef>
    | StructConstructorStructFieldArrayOverload<TDef>;

function isStructConstructorArrayBufferLikeOverload<TDef extends StructDefinition>(args: StructConstructorOverloads<TDef>): args is StructConstructorArrayBufferLikeOverload {
    return args.length > 0 && (args[0] instanceof ArrayBuffer || args[0] instanceof SharedArrayBuffer);
}

function isStructConstructorStructFieldsOverload<TDef extends StructDefinition>(args: StructConstructorOverloads<TDef>): args is StructConstructorStructFieldsOverload<TDef> {
    return args.length > 0 && typeof args[0] === "object" && args[0] !== null && !Array.isArray(args[0]);
}

function isStructConstructorStructFieldArrayOverload<TDef extends StructDefinition>(args: StructConstructorOverloads<TDef>): args is StructConstructorStructFieldArrayOverload<TDef> {
    return args.length > 0 && Array.isArray(args[0]);
}

function createStructType<TBase extends StructDefinition, TDef extends StructDefinition>(...args: CreateStructTypeOverloads<TBase, TDef>): StructClass<__Concat<TDef, TBase>> {
    let baseType: any;
    let fields: TDef;
    let name: string | undefined;
    if (isCreateStructTypeBaseFieldsNameOverload(args)) {
        [baseType, fields, name] = args;
    }
    else if (isCreateStructTypeFieldsNameOverload(args)) {
        [fields, name] = args;
        baseType = Struct as any;
    }
    else {
        throw new TypeError();
    }

    const baseTypeInfo = StructTypeInfo.get(baseType);
    const structTypeInfo = new StructTypeInfo(fields, baseTypeInfo);
    const structClass = class extends baseType { } as StructClass<__Concat<TDef, TBase>>;
    Object.defineProperty(structClass, "name", { value: name });
    for (const field of structTypeInfo.ownFields) {
        Object.defineProperty(structClass.prototype, field.name, {
            enumerable: false,
            configurable: true,
            get(this: Struct<TDef>) {
                return field.readFrom(this, this[kDataView]);
            },
            set(this: Struct<TDef>, value) {
                field.writeTo(this, this[kDataView], value);
            }
        });
        Object.defineProperty(structClass.prototype, field.index, {
            enumerable: false,
            configurable: true,
            get(this: Struct<TDef>) {
                return field.readFrom(this, this[kDataView]);
            },
            set(this: Struct<TDef>, value) {
                field.writeTo(this, this[kDataView], value);
            }
        });
    }
    return structTypeInfo.finishType(structClass);
}

type CreateStructTypeFieldsNameOverload<TDef extends StructDefinition> = [TDef, string?];
type CreateStructTypeBaseFieldsNameOverload<TBase extends StructDefinition, TDef extends StructDefinition> = [StructType<TBase>, TDef, string?];
type CreateStructTypeOverloads<TBase extends StructDefinition, TDef extends StructDefinition> =
    | CreateStructTypeFieldsNameOverload<TDef>
    | CreateStructTypeBaseFieldsNameOverload<TBase, TDef>;

function isCreateStructTypeFieldsNameOverload<TBase extends StructDefinition, TDef extends StructDefinition>(args: CreateStructTypeOverloads<TBase, TDef>): args is CreateStructTypeFieldsNameOverload<TDef> {
    return Array.isArray(args[0]);
}

function isCreateStructTypeBaseFieldsNameOverload<TBase extends StructDefinition, TDef extends StructDefinition>(args: CreateStructTypeOverloads<TBase, TDef>): args is CreateStructTypeBaseFieldsNameOverload<TBase, TDef> {
    return Array.isArray(args[1]);
}

export interface StructTypeConstructor {
    <TDef extends StructDefinition>(fields: TDef, name?: string): StructClass<TDef>;
    <TDef extends StructDefinition, TBaseDef extends StructDefinition>(fields: TDef, baseType: StructType<TBaseDef>, name?: string): StructClass<__Concat<TDef, TBaseDef>>;

    new <TDef extends StructDefinition>(fields: TDef, name?: string): StructClass<TDef>;
    new <TDef extends StructDefinition, TBaseDef extends StructDefinition>(fields: TDef, baseType: StructType<TBaseDef>, name?: string): StructClass<__Concat<TDef, TBaseDef>>;

    prototype: typeof Struct;
}

export const StructType: StructTypeConstructor = createStructType as StructTypeConstructor;
StructType.prototype = Struct;
