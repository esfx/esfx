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

import { MatchingKeys } from '@esfx/type-model';
import { TypedArrayImpl } from './array.js';
import { ArrayType, FixedLengthArrayType, PrimitiveType, Struct, StructFieldDefinition, StructType, Type, TypedArray } from './index.js';
import { Alignment, coerceValue, getValueFromView, NumberType, putValueInView, sizeOf } from './numbers.js';
import { getDataView, StructImpl } from "./struct.js";

type StructTypeLike =
    | StructType<any>
    | typeof StructImpl;

type ArrayTypeLike =
    | ArrayType<any>
    | typeof TypedArrayImpl;

type FixedLengthArrayTypeLike =
    | FixedLengthArrayType<any, any>
    | typeof TypedArrayImpl;

type TypeLike =
    | PrimitiveType
    | StructTypeLike
    | ArrayTypeLike
    | FixedLengthArrayTypeLike;

type TypeInfoGetResultOf<T extends TypeLike, TConstraint extends TypeInfo = TypeInfo> = Extract<
    T extends PrimitiveType ? PrimitiveTypeInfo :
    T extends StructTypeLike ? StructTypeInfo :
    T extends ArrayTypeLike ? BaseArrayTypeInfo | FixedLengthArrayTypeInfo :
    T extends FixedLengthArrayTypeLike ? FixedLengthArrayTypeInfo :
    never,
    TConstraint>;

const typeInfos = new WeakMap<object, TypeInfo>();

/**
 * A base class for an object used to describe a `Type`.
 * @internal
 */
export abstract class TypeInfo {
    readonly name: string;
    readonly size: number | undefined;
    readonly alignment: Alignment;

    constructor(name: string, size: number | undefined, alignment: Alignment) {
        this.name = name;
        this.size = size;
        this.alignment = alignment;
    }

    static get<T extends TypeLike>(type: T): TypeInfoGetResultOf<T>;
    static get(type: TypeLike): TypeInfo;
    static get(type: TypeLike): TypeInfo {
        const typeInfo = this.tryGet(type);
        if (!typeInfo) {
            throw new TypeError("Invalid struct, array, or primitive type.");
        }
        return typeInfo;
    }

    protected static tryGet(type: TypeLike) {
        let current: object | undefined = type;
        while (typeof current === "function") {
            const typeInfo = typeInfos.get(current);
            if (typeInfo) {
                return typeInfo;
            }
            current = Object.getPrototypeOf(current);
        }
    }

    abstract isCompatibleWith(other: TypeInfo): boolean;
    abstract coerce(value: any): number | bigint | Struct | TypedArray<any, number>;
    abstract readFrom(view: DataView, offset: number, isLittleEndian?: boolean): number | bigint | Struct | TypedArray<any, number>;
    abstract writeTo(view: DataView, offset: number, value: number | bigint | Struct | TypedArray<any, number>, isLittleEndian?: boolean): void;
}

/* @internal */
export interface ArrayBufferViewConstructor {
    new (size: number): ArrayBufferView & Record<number, number | bigint>;
    new (buffer: ArrayBufferLike, byteOffset?: number): ArrayBufferView & Record<number, number | bigint>;
    BYTES_PER_ELEMENT: number;
}

/* @internal */
export type DataViewReaders = MatchingKeys<DataView, (offset: number) => number | bigint>;

/* @internal */
export type DataViewWriters = MatchingKeys<DataView, ((offset: number, value: number) => void) | ((offset: number, value: bigint) => void)>;

/**
 * Type information about a primitive type.
 *
 * @internal
 */
export class PrimitiveTypeInfo extends TypeInfo {
    declare readonly size: number;
    readonly runtimeType: PrimitiveType;
    readonly #numberType: NumberType;

    constructor(name: string, numberType: NumberType) {
        const size = sizeOf(numberType);
        super(numberType, size, size);
        this.#numberType = numberType;
        this.runtimeType = Object.defineProperties(function (value: number | bigint) { return coerceValue(numberType, value); } as PrimitiveType, {
            name: { value: name },
            SIZE: { value: size },
        });
        typeInfos.set(this.runtimeType, this);
        Object.freeze(this);
    }

    isCompatibleWith(other: TypeInfo): boolean {
        if (this === other) return true;
        if (other instanceof PrimitiveTypeInfo) {
            const thisIsBigInt = this.#numberType === NumberType.BigInt64 || this.#numberType === NumberType.BigUint64;
            const otherIsBigInt = other.#numberType === NumberType.BigInt64 || other.#numberType === NumberType.BigUint64;
            return thisIsBigInt === otherIsBigInt;
        }
        return false;
    }

    coerce(value: any) {
        return this.runtimeType(value);
    }

    readFrom(view: DataView, offset: number, isLittleEndian?: boolean) {
        return getValueFromView(view, this.#numberType, offset, isLittleEndian);
    }

    writeTo(view: DataView, offset: number, value: number | bigint, isLittleEndian?: boolean) {
        putValueInView(view, this.#numberType, offset, value, isLittleEndian);
    }

    static get(type: TypeLike): PrimitiveTypeInfo {
        const typeInfo = typeInfos.get(type);
        if (!(typeInfo instanceof PrimitiveTypeInfo)) {
            throw new TypeError("Invalid primitive type.");
        }
        return typeInfo;
    }
}

const weakFieldCache = new WeakMap<StructFieldInfo, WeakMap<Struct, Struct>>();

/**
 * Type information about a field in a structured type.
 * @internal
 */
export class StructFieldInfo {
    readonly containingType: StructTypeInfo;
    readonly field: StructFieldDefinition;
    readonly index: number;
    readonly byteOffset: number;
    readonly typeInfo: TypeInfo;

    constructor(type: StructTypeInfo, field: StructFieldDefinition, index: number, byteOffset: number) {
        this.containingType = type;
        this.field = {...field};
        this.index = index;
        this.byteOffset = byteOffset;
        this.typeInfo = TypeInfo.get(this.field.type);
        Object.freeze(this.field);
        Object.freeze(this);
    }

    get name(): string | symbol { return this.field.name; }
    get runtimeType() { return this.field.type; }
    get size() { return this.field.type.SIZE; }

    coerce(value: any) {
        return this.typeInfo.coerce(value);
    }

    readFrom(owner: StructImpl, view: DataView, isLittleEndian?: boolean) {
        if (this.typeInfo instanceof StructTypeInfo) {
            let cache = weakFieldCache.get(this);
            if (!cache) weakFieldCache.set(this, cache = new WeakMap());
            let value = cache.get(owner);
            if (!value) cache.set(owner, value = this.typeInfo.readFrom(view, this.byteOffset, isLittleEndian));
            return value;
        }
        return this.typeInfo.readFrom(view, this.byteOffset, isLittleEndian);
    }

    writeTo(_owner: StructImpl, view: DataView, value: number | bigint | Struct | TypedArray<any, number>, isLittleEndian?: boolean) {
        this.typeInfo.writeTo(view, this.byteOffset, value, isLittleEndian);
    }
}

function generateName(fields: readonly StructFieldDefinition[], baseType: StructTypeInfo | undefined) {
    const structName = baseType ? `struct extends ${baseType.name}` : `struct`;
    const fieldNames = fields.map(field => {
        const fieldName = typeof field.name === "string" ? field.name : `[${field.name.toString()}]`;
        return `${fieldName}: ${TypeInfo.get(field.type).name}`;
    }).join(", ");
    return `${structName} {${fieldNames}}`;
}

const hasOwn = Object.hasOwn ?? ((obj: object, k: PropertyKey) => Object.prototype.hasOwnProperty.call(obj, k));

/* @internal */
export class StructTypeInfo extends TypeInfo {
    declare readonly size: number;

    readonly fields: readonly StructFieldInfo[];
    readonly ownFields: readonly StructFieldInfo[];
    readonly fieldsByName: ReadonlyMap<string | symbol, StructFieldInfo>;
    readonly fieldsByOffset: ReadonlyMap<number, StructFieldInfo>;
    readonly baseType: StructTypeInfo | undefined;
    readonly runtimeType: StructType<any>;

    constructor(name: string | undefined, fieldsObject: { readonly [key: string | symbol]: Type }, fieldOrder: readonly (string | number | symbol)[], baseType?: StructTypeInfo) {
        const fieldNames = new Set<string | symbol>();
        const fieldsArray: StructFieldInfo[] = [];
        const fieldsByName = new Map<string | symbol, StructFieldInfo>();
        const fieldsByOffset = new Map<number, StructFieldInfo>();
        if (baseType) {
            for (const field of baseType.fields) {
                fieldsArray.push(field);
                fieldNames.add(field.name);
                fieldsByName.set(field.name, field);
                fieldsByOffset.set(field.byteOffset, field);
            }
        }

        const fields: StructFieldDefinition[] = [];
        const fieldOffsets: number[] = [];
        let offset = baseType ? baseType.size : 0;
        let maxAlignment: Alignment = 1;

        for (const fieldName of fieldOrder) {
            const name = typeof fieldName === "number" ? `${fieldName}` : fieldName;
            if (!hasOwn(fieldsObject, name)) {
                throw new TypeError(`Field specified in order not found in definition: ${name.toString()}`);
            }
            
            if (fieldNames.has(name)) {
                throw new TypeError(`Duplicate field: ${name.toString()}`);
            }
            fieldNames.add(name);

            const type = fieldsObject[name];
            fields.push({ name: name, type });
        }

        for (const name of Reflect.ownKeys(fieldsObject)) {
            if (fieldNames.has(name)) continue;
            fieldNames.add(name);

            const type = fieldsObject[name];
            fields.push({ name, type });
        }

        for (const field of fields) {
            const fieldTypeInfo = TypeInfo.get(field.type);
            if (fieldTypeInfo.size === undefined) {
                throw new TypeError(`A struct may only contain fixed-size elements: ${field.name.toString()}`);
            }

            const alignment = fieldTypeInfo.alignment;
            offset = align(offset, alignment);
            fieldOffsets.push(offset);
            fieldNames.add(field.name);
            if (maxAlignment < alignment) maxAlignment = alignment;
            offset += fieldTypeInfo.size;
        }

        super(name ?? generateName(fields, baseType), align(offset, maxAlignment), maxAlignment);

        const baseLength = baseType ? baseType.fields.length : 0;
        const ownFieldsArray: StructFieldInfo[] = [];
        for (let i = 0; i < fields.length; i++) {
            const fieldInfo = new StructFieldInfo(this, fields[i], baseLength + i, fieldOffsets[i]);
            fieldsArray.push(fieldInfo);
            ownFieldsArray.push(fieldInfo);
            fieldsByName.set(fieldInfo.name, fieldInfo);
            fieldsByOffset.set(fieldInfo.byteOffset, fieldInfo);
        }

        this.ownFields = ownFieldsArray;
        this.fields = fieldsArray;
        this.fieldsByName = fieldsByName;
        this.fieldsByOffset = fieldsByOffset;
        this.baseType = baseType;

        const baseClass = (baseType ? baseType.runtimeType : StructImpl) as abstract new () => Struct;
        const structClass = (void 0, class extends baseClass { } as StructType<any>);
        Object.defineProperty(structClass, "name", { value: name });
        for (const field of ownFieldsArray) {
            Object.defineProperty(structClass.prototype, field.name, {
                enumerable: false,
                configurable: true,
                get() { return field.readFrom(this, getDataView(this)); },
                set(value) { field.writeTo(this, getDataView(this), value); }
            });
            Object.defineProperty(structClass.prototype, field.index, {
                enumerable: false,
                configurable: true,
                get() { return field.readFrom(this, getDataView(this)); },
                set(value) { field.writeTo(this, getDataView(this), value); }
            });
        }
        this.runtimeType = structClass;
        Object.freeze(this.ownFields);
        Object.freeze(this.fields);
        Object.freeze(this.fieldsByName);
        Object.freeze(this.fieldsByOffset);
        Object.freeze(this);
        typeInfos.set(this.runtimeType, this);
    }

    static get(type: TypeLike): StructTypeInfo {
        const typeInfo = this.tryGet(type);
        if (!typeInfo || !(typeInfo instanceof StructTypeInfo)) {
            throw new TypeError("Invalid struct, array, or primitive type.");
        }
        return typeInfo;
    }

    isCompatibleWith(other: TypeInfo): boolean {
        if (this === other) return true;
        if (!(other instanceof StructTypeInfo)) return false;
        if (this.fields.length !== other.fields.length) return false;
        for (let i = 0; i < this.fields.length; i++) {
            const thisField = this.fields[i];
            const otherField = other.fields[i];
            if (thisField.typeInfo instanceof PrimitiveTypeInfo) {
                if (thisField.typeInfo !== otherField.typeInfo) {
                    return false;
                }
            }
            else {
                if (!this.fields[i].typeInfo.isCompatibleWith(other.fields[i].typeInfo)) {
                    return false;
                }
            }
        }
        return true;
    }

    coerce(value: any) {
        return value instanceof this.runtimeType ? value : new this.runtimeType(value);
    }

    readFrom(view: DataView, offset: number, _isLittleEndian?: boolean) {
        return new this.runtimeType(view.buffer, view.byteOffset + offset);
    }

    writeTo(view: DataView, offset: number, value: number | bigint | Struct, _isLittleEndian?: boolean) {
        if (value instanceof this.runtimeType) {
            value.writeTo(view.buffer, view.byteOffset + offset);
        }
        else {
            throw new TypeError(`Expected an instance of type '${this.name}'`);
        }
    }
}

/* @internal */
export abstract class ArrayTypeInfo extends TypeInfo {
    abstract declare readonly runtimeType: ArrayType<any>;
    readonly elementType: Type;
    readonly elementTypeInfo: TypeInfo;
    readonly bytesPerElement: number;
    readonly fixedLength: number | undefined;

    protected constructor(elementType: Type, fixedLength: number | undefined) {
        const elementTypeInfo = TypeInfo.get(elementType);
        if (elementTypeInfo.size === undefined) {
            throw new TypeError(`A typed array may only contain fixed-size elements`);
        }

        const bytesPerElement = align(elementTypeInfo.size, elementTypeInfo.alignment);
        super(`typedarray ${elementType.name}[${fixedLength ?? ""}]`, fixedLength === undefined ? -1 : fixedLength * bytesPerElement, elementTypeInfo.alignment);
        this.elementType = elementType;
        this.elementTypeInfo = elementTypeInfo;
        this.bytesPerElement = bytesPerElement;
        this.fixedLength = fixedLength;
    }

    static get(type: TypeLike): BaseArrayTypeInfo | FixedLengthArrayTypeInfo {
        const typeInfo = super.tryGet(type);
        if (!(typeInfo instanceof BaseArrayTypeInfo || typeInfo instanceof FixedLengthArrayTypeInfo)) {
            throw new TypeError("Invalid struct, array, or primitive type.");
        }
        return typeInfo;
    }

    abstract getResizedType(length: number): ArrayType<any> | FixedLengthArrayType<any, number>;
    abstract toFixed(lenth: number): FixedLengthArrayTypeInfo;

    isCompatibleWith(other: TypeInfo): boolean {
        return this === other || other instanceof ArrayTypeInfo &&
            this.fixedLength === other.fixedLength &&
            this.elementTypeInfo.isCompatibleWith(other.elementTypeInfo);
    }

    coerce(value: any) {
        return value instanceof this.runtimeType ? value : new this.runtimeType(value);
    }

    readElementFrom(view: DataView, index: number, isLittleEndian?: boolean) {
        return this.elementTypeInfo.readFrom(view, index * this.bytesPerElement, isLittleEndian);
    }

    writeElementTo(view: DataView, index: number, value: number | bigint | Struct | TypedArray<any, number>, isLittleEndian?: boolean): void {
        this.elementTypeInfo.writeTo(view, index * this.bytesPerElement, value, isLittleEndian);
    }

    readFrom(view: DataView, offset: number, _isLittleEndian?: boolean) {
        return new this.runtimeType(view.buffer, view.byteOffset + offset);
    }

    writeTo(view: DataView, offset: number, value: number | bigint | Struct | TypedArray<any, number>, _isLittleEndian?: boolean): void {
        if (!(value instanceof this.runtimeType)) throw new TypeError();
        value.writeTo(view.buffer, view.byteOffset + offset);
    }
}

/* @internal */
export class BaseArrayTypeInfo extends ArrayTypeInfo {
    readonly runtimeType: ArrayType<any>;
    #fixedLengthTypes: Map<number, WeakRef<FixedLengthArrayTypeInfo>> | undefined;
    #fixedLengthTypesFinalizationRegistry: FinalizationRegistry<number> | undefined;

    constructor(elementType: Type) {
        super(elementType, /*fixedLength*/ undefined);
        this.runtimeType = (void 0, class extends TypedArrayImpl<any> {} as ArrayType<any>);
        Object.defineProperty(this.runtimeType, "name", { value: this.name });
        Object.freeze(this);
        typeInfos.set(this.runtimeType, this);
    }

    static get(type: TypeLike): BaseArrayTypeInfo {
        const typeInfo = super.tryGet(type);
        if (!(typeInfo instanceof BaseArrayTypeInfo)) {
            throw new TypeError("Invalid struct, array, or primitive type.");
        }
        return typeInfo;
    }

    getResizedType(length: number) {
        return this.runtimeType;
    }

    toFixed(fixedLength: number) {
        this.#fixedLengthTypes ??= new Map();

        let fixedLengthType = this.#fixedLengthTypes.get(fixedLength)?.deref();
        if (fixedLengthType) {
            return fixedLengthType;
        }

        this.#fixedLengthTypesFinalizationRegistry ??= new FinalizationRegistry(fixedLength => {
            this.#fixedLengthTypes?.delete(fixedLength);
        });

        fixedLengthType = new FixedLengthArrayTypeInfo(this, fixedLength);
        this.#fixedLengthTypes.set(fixedLength, new WeakRef(fixedLengthType));
        this.#fixedLengthTypesFinalizationRegistry.register(fixedLengthType, fixedLength);
        return fixedLengthType;
    }
}

/* @internal */
export class FixedLengthArrayTypeInfo extends ArrayTypeInfo {
    readonly runtimeType: FixedLengthArrayType<any, number>;
    readonly baseType: BaseArrayTypeInfo;

    declare readonly fixedLength: number;
    declare readonly size: number;

    constructor(baseType: BaseArrayTypeInfo, fixedLength: number) {
        super(baseType.elementType, fixedLength);
        this.baseType = baseType;
        this.runtimeType = (void 0, class extends baseType.runtimeType {} as unknown as FixedLengthArrayType<any, number>);
        Object.defineProperty(this.runtimeType, "name", { value: this.name });
        Object.freeze(this);
        typeInfos.set(this.runtimeType, this);
    }

    static get(type: TypeLike): FixedLengthArrayTypeInfo {
        const typeInfo = super.tryGet(type);
        if (!typeInfo || !(typeInfo instanceof FixedLengthArrayTypeInfo)) {
            throw new TypeError("Invalid struct, array, or primitive type.");
        }
        return typeInfo;
    }

    getResizedType(length: number) {
        return this.baseType.toFixed(length).runtimeType;
    }

    toFixed(fixedLength: number) {
        return fixedLength === this.fixedLength ? this : this.baseType.toFixed(fixedLength);
    }
}

function align(offset: number, alignment: Alignment) {
    return (offset + (alignment - 1)) & -alignment;
}
