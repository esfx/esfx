import { NumberType, NumberTypeToType, coerceValue } from './numbers';
import { StructPrimitiveType } from '.';
import { PrimitiveTypeInfo } from './typeInfo';

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

/* @internal */
export const int8 = createPrimitiveType("int8", NumberType.Int8);
/* @internal */
export const int16 = createPrimitiveType("int16", NumberType.Int16);
/* @internal */
export const int32 = createPrimitiveType("int32", NumberType.Int32);
/* @internal */
export const uint8 = createPrimitiveType("uint8", NumberType.Uint8);
/* @internal */
export const uint16 = createPrimitiveType("uint16", NumberType.Uint16);
/* @internal */
export const uint32 = createPrimitiveType("uint32", NumberType.Uint32);
/* @internal */
export const bigint64 = createPrimitiveType("bigint64", NumberType.BigInt64);
/* @internal */
export const biguint64 = createPrimitiveType("biguint64", NumberType.BigUint64);
/* @internal */
export const float32 = createPrimitiveType("float32", NumberType.Float32);
/* @internal */
export const float64 = createPrimitiveType("float64", NumberType.Float64);