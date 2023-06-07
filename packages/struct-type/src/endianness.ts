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

/**
 * Indicates whether the current system is little endian.
 */
export const isLittleEndian = new Int32Array(new Uint8Array([0x12, 0x34, 0x56, 0x78]).buffer)[0] !== 0x12345678;

/**
 * Indicats the endianess of the system.
 */
export const endianness: Endianness = isLittleEndian ? "LE" : "BE";

/**
 * Indicates whether the byte representation for an integer is either big-endian (`"BE"`) or little-endian (`"LE"`).
 */
export type Endianness = "BE" | "LE";
