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

import { ArrayType, FixedLengthArrayType } from "./array.js";
import type { PrimitiveType } from "./primitive.js";
import { StructType } from "./struct.js";

export type Type =
    | PrimitiveType
    | StructType<any>
    | FixedLengthArrayType<any>
    | ArrayType<any>
    ;


// NOTE: We use a non-existent, unreachable, unique symbol to store related type information on
//       some definitions to avoid hitting the recursive instantiation limit, which we would hit
//       much faster were we to use multiple conditional types and `infer` to do the same thing.

/**
 * Gets the runtime type from a type definition.
 */
export type RuntimeType<TType extends Type> = TType[typeof RuntimeType];
export declare const RuntimeType: unique symbol;

/**
 * Gets a runtime type from a type definition that can be used to initialize a value of that type.
 */
export type InitType<TType extends Type> = TType[typeof InitType];
export declare const InitType: unique symbol;
