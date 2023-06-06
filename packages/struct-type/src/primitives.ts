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

import type { PrimitiveType } from './index.js';
import { NumberType, NumberTypeToType } from './numbers.js';
import { PrimitiveTypeInfo } from './typeInfo.js';

function createPrimitiveType<K extends string, N extends NumberType>(name: K, nt: N): PrimitiveType<K, NumberTypeToType[N]> {
    const typeInfo = new PrimitiveTypeInfo(name, nt);
    return typeInfo.runtimeType as PrimitiveType<K, NumberTypeToType[N]>;
}

/* @internal */
export const bool8 = createPrimitiveType("bool8", NumberType.Bool8);

/* @internal */
export const bool32 = createPrimitiveType("bool32", NumberType.Bool32);

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
