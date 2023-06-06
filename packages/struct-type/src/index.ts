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

import { littleEndian } from "./internal/numbers.js";

export * from "./array.js";
export * from "./primitive.js";
export * from "./struct.js";
export type { InitType, RuntimeType, Type } from "./type.js";
export * from "./wasm.js";

/**
 * Indicates whether the current host is little endian.
 */
export const isLittleEndian = littleEndian;
