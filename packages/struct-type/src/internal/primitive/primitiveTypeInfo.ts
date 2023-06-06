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
import type { PrimitiveType } from "../../primitive.js";
import { coerceValue, getValueFromView, NumberType, putValueInView, sizeOf } from "../numbers.js";
import { TypeInfo, TypeLike } from "../typeInfo.js";

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
        this.runtimeType = Object.defineProperties(function (value: number | bigint | boolean) { return coerceValue(numberType, value); } as PrimitiveType, {
            name: { value: name },
            SIZE: { value: size },
        });
        TypeInfo.set(this.runtimeType, this);
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

    readFrom(view: DataView, offset: number, byteOrder?: Endianness) {
        return getValueFromView(view, this.#numberType, offset, byteOrder);
    }

    writeTo(view: DataView, offset: number, value: number | bigint | boolean, byteOrder?: Endianness) {
        putValueInView(view, this.#numberType, offset, value, byteOrder);
    }

    static get(type: TypeLike): PrimitiveTypeInfo {
        const typeInfo = super.tryGet(type);
        if (typeInfo instanceof PrimitiveTypeInfo) {
            return typeInfo;
        }
        throw new TypeError("Invalid primitive type.");
    }
}
