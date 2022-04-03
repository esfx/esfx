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
import { StructPrimitiveType, StructFieldDefinition, StructType, Struct as StructBase } from './index.js';
import { NumberType, sizeOf, getValueFromView, putValueInView, Alignment } from './numbers.js';
import { Struct as Struct_ } from "./struct.js";

type StructTypeLike =
    | StructType
    | typeof Struct_;

const typeInfos = new WeakMap<object, TypeInfo>();

/* @internal */
export abstract class TypeInfo {
    readonly size: number;
    readonly alignment: Alignment;

    constructor (size: number, alignment: Alignment) {
        this.size = size;
        this.alignment = alignment;
    }

    static get(type: StructTypeLike): StructTypeInfo;
    static get(type: StructPrimitiveType): PrimitiveTypeInfo;
    static get(type: StructPrimitiveType | StructTypeLike): StructTypeInfo | PrimitiveTypeInfo;
    static get(type: StructPrimitiveType | StructTypeLike) {
        const typeInfo = this.tryGet(type);
        if (typeInfo) {
            return typeInfo;
        }
        throw new TypeError("Invalid struct or primitive type.");
    }

    protected static tryGet(type: StructPrimitiveType | StructTypeLike) {
        let current: object | undefined = type;
        while (typeof current === "function") {
            const typeInfo = typeInfos.get(current);
            if (typeInfo) {
                return typeInfo;
            }
            current = Object.getPrototypeOf(current);
        }
    }

    abstract coerce(value: any): number | bigint | StructBase;
    abstract readFrom(view: DataView, offset: number, isLittleEndian?: boolean): number | bigint | StructBase;
    abstract writeTo(view: DataView, offset: number, value: number | bigint | StructBase, isLittleEndian?: boolean): void;
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

/* @internal */
export class PrimitiveTypeInfo extends TypeInfo {
    private _primitiveType!: StructPrimitiveType;
    private _numberType: NumberType;

    constructor(numberType: NumberType) {
        super(sizeOf(numberType), sizeOf(numberType));
        this._numberType = numberType;
    }

    get primitiveType() {
        return this._primitiveType;
    }

    coerce(value: any) {
        return this._primitiveType(value);
    }

    readFrom(view: DataView, offset: number, isLittleEndian?: boolean) {
        return getValueFromView(view, this._numberType, offset, isLittleEndian);
    }

    writeTo(view: DataView, offset: number, value: number | bigint, isLittleEndian?: boolean) {
        putValueInView(view, this._numberType, offset, value, isLittleEndian);
    }

    static get(type: StructTypeLike): never;
    static get(type: StructPrimitiveType): PrimitiveTypeInfo;
    static get(type: StructPrimitiveType | StructTypeLike): PrimitiveTypeInfo;
    static get(type: StructPrimitiveType | StructTypeLike): PrimitiveTypeInfo {
        const typeInfo = typeInfos.get(type);
        if (!typeInfo || !(typeInfo instanceof PrimitiveTypeInfo)) {
            throw new TypeError("Invalid primitive type.");
        }
        return typeInfo;
    }

    finishType<T extends StructPrimitiveType>(primitiveType: T) {
        this._primitiveType = primitiveType;
        Object.freeze(this);
        typeInfos.set(primitiveType, this);
        return primitiveType;
    }
}

const weakFieldCache = new WeakMap<StructFieldInfo, WeakMap<StructBase, StructBase>>();

/* @internal */
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
    get type() { return this.field.type; }
    get size() { return this.field.type.SIZE; }

    coerce(value: any) {
        return this.typeInfo.coerce(value);
    }

    readFrom(owner: Struct_, view: DataView, isLittleEndian?: boolean) {
        if (this.typeInfo instanceof StructTypeInfo) {
            let cache = weakFieldCache.get(this);
            if (!cache) weakFieldCache.set(this, cache = new WeakMap());
            let value = cache.get(owner);
            if (!value) cache.set(owner, value = this.typeInfo.readFrom(view, this.byteOffset, isLittleEndian));
            return value;
        }
        return this.typeInfo.readFrom(view, this.byteOffset, isLittleEndian);
    }

    writeTo(_owner: Struct_, view: DataView, value: number | bigint | StructBase, isLittleEndian?: boolean) {
        this.typeInfo.writeTo(view, this.byteOffset, value, isLittleEndian);
    }
}

/* @internal */
export class StructTypeInfo extends TypeInfo {
    readonly fields: readonly StructFieldInfo[];
    readonly ownFields: readonly StructFieldInfo[];
    readonly fieldsByName: ReadonlyMap<string | symbol, StructFieldInfo>;
    readonly fieldsByOffset: ReadonlyMap<number, StructFieldInfo>;
    readonly baseType: StructTypeInfo | undefined;

    private _structType!: StructType;

    constructor(fields: readonly StructFieldDefinition[], baseType?: StructTypeInfo) {
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
        const fieldOffsets: number[] = [];
        let offset = baseType ? baseType.size : 0;
        let maxAlignment: Alignment = 1;
        for (const field of fields) {
            if (fieldNames.has(field.name)) {
                throw new TypeError(`Duplicate field: ${field.name.toString()}`);
            }
            const fieldTypeInfo = TypeInfo.get(field.type);
            const alignment = fieldTypeInfo.alignment;
            offset = align(offset, alignment);
            fieldOffsets.push(offset);
            fieldNames.add(field.name);
            if (maxAlignment < alignment) maxAlignment = alignment;
            offset += fieldTypeInfo.size;
        }

        super(align(offset, maxAlignment), maxAlignment);

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
    }

    get structType() {
        return this._structType;
    }

    static get(type: StructTypeLike): StructTypeInfo;
    static get(type: StructPrimitiveType): never;
    static get(type: StructPrimitiveType | StructTypeLike): StructTypeInfo;
    static get(type: StructPrimitiveType | StructTypeLike): StructTypeInfo {
        const typeInfo = this.tryGet(type);
        if (!typeInfo || !(typeInfo instanceof StructTypeInfo)) {
            throw new TypeError("Invalid struct or primitive type.");
        }
        return typeInfo;
    }

    coerce(value: any) {
        return value instanceof this._structType ? value : new this._structType(value);
    }

    readFrom(view: DataView, offset: number, isLittleEndian?: boolean) {
        return new this._structType(view.buffer, view.byteOffset + offset);
    }

    writeTo(view: DataView, offset: number, value: number | bigint | StructBase, isLittleEndian?: boolean) {
        if (!(value instanceof this._structType)) {
            throw new TypeError();
        }
        value.writeTo(view.buffer, view.byteOffset + offset);
    }

    finishType<T extends StructType>(structType: T): T;
    finishType(structType: typeof Struct_): void;
    finishType<T extends StructType>(structType: T) {
        this._structType = structType;
        Object.freeze(this.ownFields);
        Object.freeze(this.fields);
        Object.freeze(this.fieldsByName);
        Object.freeze(this.fieldsByOffset);
        Object.freeze(this);
        typeInfos.set(structType, this);
        return structType;
    }
}

function align(offset: number, alignment: Alignment) {
    return (offset + (alignment - 1)) & -alignment;
}
