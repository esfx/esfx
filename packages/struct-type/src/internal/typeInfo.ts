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

import { ArrayType, FixedLengthArrayType, TypedArray } from "../array.js";
import { Endianness } from "../endianness.js";
import { PrimitiveType } from "../primitive.js";
import { Struct, StructType } from "../struct.js";
import type { RuntimeType, Type } from "../type.js";
import { TypedArrayImpl } from "./array/arrayImpl.js";
import type { BaseArrayTypeInfo, FixedLengthArrayTypeInfo } from "./array/arrayTypeInfo.js";
import { Alignment } from "./numbers.js";
import type { PrimitiveTypeInfo } from "./primitive/primitiveTypeInfo.js";
import { StructImpl } from "./struct/structImpl.js";
import type { StructTypeInfo } from "./struct/structTypeInfo.js";

type StructTypeLike =
    | StructType<any>
    | typeof StructImpl;

type ArrayTypeLike =
    | ArrayType<any>
    | typeof TypedArrayImpl;

type FixedLengthArrayTypeLike =
    | FixedLengthArrayType<any, any>
    | typeof TypedArrayImpl;

/* @internal */
export type TypeLike =
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

    protected static set(type: TypeLike, typeInfo: TypeInfo) {
        typeInfos.set(type, typeInfo);
    }

    abstract isCompatibleWith(other: TypeInfo): boolean;
    abstract coerce(value: any): RuntimeType<Type>;
    abstract readFrom(view: DataView, offset: number, byteOrder?: Endianness): RuntimeType<Type>;
    abstract writeTo(view: DataView, offset: number, value: RuntimeType<Type>, byteOrder?: Endianness): void;
}
