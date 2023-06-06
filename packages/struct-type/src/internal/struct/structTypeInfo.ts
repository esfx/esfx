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

import { Endianness } from "../../endianness.js";
import type { Struct, StructFieldDefinition, StructType } from "../../struct.js";
import type { RuntimeType, Type } from "../../type.js";
import { align, Alignment } from "../numbers.js";
import { PrimitiveTypeInfo } from "../primitive/primitiveTypeInfo.js";
import { TypeInfo, TypeLike } from "../typeInfo.js";
import { getDataView, StructImpl } from "./structImpl.js";

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

    readFrom(owner: StructImpl, view: DataView, byteOrder?: Endianness) {
        if (this.typeInfo instanceof StructTypeInfo) {
            let cache = weakFieldCache.get(this);
            if (!cache) weakFieldCache.set(this, cache = new WeakMap());
            let value = cache.get(owner);
            if (!value) cache.set(owner, value = this.typeInfo.readFrom(view, this.byteOffset, byteOrder) as Struct);
            return value;
        }
        return this.typeInfo.readFrom(view, this.byteOffset, byteOrder);
    }

    writeTo(_owner: StructImpl, view: DataView, value: RuntimeType<Type>, byteOrder?: Endianness) {
        this.typeInfo.writeTo(view, this.byteOffset, value, byteOrder);
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
        TypeInfo.set(this.runtimeType, this);
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

    readFrom(view: DataView, offset: number, byteOrder?: Endianness) {
        return new this.runtimeType(view.buffer, view.byteOffset + offset);
    }

    writeTo(view: DataView, offset: number, value: RuntimeType<Type>, byteOrder?: Endianness) {
        if (value instanceof this.runtimeType) {
            value.writeTo(view.buffer, view.byteOffset + offset);
        }
        else {
            throw new TypeError(`Expected an instance of type '${this.name}'`);
        }
    }
}
