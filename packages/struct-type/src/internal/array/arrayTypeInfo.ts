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

import type { ArrayType, FixedLengthArrayType } from "../../array.js";
import { Endianness } from "../../endianness.js";
import type { RuntimeType, Type } from "../../type.js";
import { align } from "../numbers.js";
import { TypeInfo, TypeLike } from "../typeInfo.js";
import { TypedArrayImpl } from "./arrayImpl.js";

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

    readElementFrom(view: DataView, index: number, byteOrder?: Endianness) {
        return this.elementTypeInfo.readFrom(view, index * this.bytesPerElement, byteOrder);
    }

    writeElementTo(view: DataView, index: number, value: RuntimeType<Type>, byteOrder?: Endianness): void {
        this.elementTypeInfo.writeTo(view, index * this.bytesPerElement, value, byteOrder);
    }

    readFrom(view: DataView, offset: number, byteOrder?: Endianness) {
        return new this.runtimeType(view.buffer, view.byteOffset + offset);
    }

    writeTo(view: DataView, offset: number, value: RuntimeType<Type>, byteOrder?: Endianness): void {
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
        TypeInfo.set(this.runtimeType, this);
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
        TypeInfo.set(this.runtimeType, this);
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
