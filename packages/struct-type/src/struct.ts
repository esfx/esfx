import { StructFieldDefinition, StructInitProperties, StructInitElements, Struct as Struct_, StructFieldRuntimeType } from '.';
import { StructTypeInfo } from './typeInfo';
import { numstr } from '@esfx/type-model';

const kBuffer = Symbol("[[Buffer]]");
const kByteOffset = Symbol("[[ByteOffset]]");
const kType = Symbol("[[Type]]");
/* @internal */
export const kDataView = Symbol("[[DataView]]");

type StructConstructorEmptyOverload = [];
type StructConstructorSharedOverload = [boolean];
type StructConstructorArrayBufferLikeOverload = [ArrayBufferLike, number?];
type StructConstructorStructFieldsOverload<TDef extends readonly StructFieldDefinition[]> = [Partial<StructInitProperties<TDef>>, boolean?];
type StructConstructorStructFieldArrayOverload<TDef extends readonly StructFieldDefinition[]> = [Partial<StructInitElements<TDef>>, boolean?];
type StructConstructorOverloads<TDef extends readonly StructFieldDefinition[]> =
    | StructConstructorEmptyOverload
    | StructConstructorSharedOverload
    | StructConstructorArrayBufferLikeOverload
    | StructConstructorStructFieldsOverload<TDef>
    | StructConstructorStructFieldArrayOverload<TDef>;

function isStructConstructorArrayBufferLikeOverload<TDef extends readonly StructFieldDefinition[]>(args: StructConstructorOverloads<TDef>): args is StructConstructorArrayBufferLikeOverload {
    return args.length > 0 && (args[0] instanceof ArrayBuffer || args[0] instanceof SharedArrayBuffer);
}

function isStructConstructorStructFieldsOverload<TDef extends readonly StructFieldDefinition[]>(args: StructConstructorOverloads<TDef>): args is StructConstructorStructFieldsOverload<TDef> {
    return args.length > 0 && typeof args[0] === "object" && args[0] !== null && !Array.isArray(args[0]);
}

function isStructConstructorStructFieldArrayOverload<TDef extends readonly StructFieldDefinition[]>(args: StructConstructorOverloads<TDef>): args is StructConstructorStructFieldArrayOverload<TDef> {
    return args.length > 0 && Array.isArray(args[0]);
}

/* @internal */
export abstract class Struct<TDef extends readonly StructFieldDefinition[] = any> {
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

    get<K extends TDef[number]["name"]>(key: K): StructFieldRuntimeType<Extract<TDef[number], { readonly name: K }>>;
    get<K extends TDef[number]["name"]>(key: K) {
        const field = this[kType].fieldsByName.get(key);
        if (field) {
            return field.readFrom(this, this[kDataView]);
        }
        throw new RangeError();
    }

    set<K extends TDef[number]["name"]>(key: K, value: StructFieldRuntimeType<Extract<TDef[number], { readonly name: K }>>) {
        const field = this[kType].fieldsByName.get(key);
        if (field) {
            field.writeTo(this, this[kDataView], field.coerce(value));
            return;
        }
        throw new RangeError();
    }

    getIndex<I extends keyof TDef & numstr<keyof TDef>>(index: I): StructFieldRuntimeType<Extract<TDef[I], StructFieldDefinition>>;
    getIndex<I extends keyof TDef & numstr<keyof TDef>>(index: I) {
        if (index < this[kType].fields.length) {
            const field = this[kType].fields[index as number];
            return field.readFrom(this, this[kDataView]);
        }
        throw new RangeError();
    }

    setIndex<I extends keyof TDef>(index: I, value: StructFieldRuntimeType<Extract<TDef[I], StructFieldDefinition>>) {
        if (index < this[kType].fields.length) {
            const field = this[kType].fields[index as number];
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