/*!
   Copyright 2023 Ron Buckton

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

import { TypedArrayImpl } from "./array.js";
import type { ArrayType as IArrayType, FixedLengthArrayType as IFixedLengthArrayType, Type } from "./index.js";
import { BaseArrayTypeInfo, FixedLengthArrayTypeInfo } from "./typeInfo.js";

/* @internal */
export function ArrayType<TType extends Type, TFixedLength extends number>(type: TType, fixedLength?: TFixedLength): IArrayType<TType> | IFixedLengthArrayType<TType, TFixedLength> {
    return fixedLength === undefined ?
        new BaseArrayTypeInfo(type).runtimeType as IArrayType<TType> :
        new FixedLengthArrayTypeInfo(new BaseArrayTypeInfo(type), fixedLength).runtimeType as IFixedLengthArrayType<TType, TFixedLength>;
}

(ArrayType as any).prototype = TypedArrayImpl;
