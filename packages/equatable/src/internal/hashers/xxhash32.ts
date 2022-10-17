/*!
   Copyright 2022 Ron Buckton

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

   THIRD PARTY LICENSE NOTICE:

   xxHash Library
   Copyright (c) 2012-2021 Yann Collet
   All rights reserved.

   BSD 2-Clause License (https://www.opensource.org/licenses/bsd-license.php)

   Redistribution and use in source and binary forms, with or without modification,
   are permitted provided that the following conditions are met:

   * Redistributions of source code must retain the above copyright notice, this
     list of conditions and the following disclaimer.

   * Redistributions in binary form must reproduce the above copyright notice, this
     list of conditions and the following disclaimer in the documentation and/or
     other materials provided with the distribution.

   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
   ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
   (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
   LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
   ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
   (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const PRIME32_1 = 0x9e3779b1;
const PRIME32_2 = 0x85ebca77;
const PRIME32_3 = 0xc2b2ae3d;
const PRIME32_4 = 0x27d4eb2f;
const PRIME32_5 = 0x165667b1;

export function xxh32(buffer: ArrayBuffer, input_ptr: number, inputLength: number, seed: number): number {
    if (input_ptr % 4) throw new TypeError("Pointer not aligned");
    const buffer_u32 = new Uint32Array(buffer);
    let acc: number;
    let end: number;
    let limit: number;
    let v1: number;
    let v2: number;
    let v3: number;
    let v4: number;
    end = input_ptr + inputLength;
    // translate ptr to u32 offset
    input_ptr >>= 2;
    if (inputLength >= 16) {
        limit = (end - 16) >> 2;
        v1 = (((seed + PRIME32_1) | 0) + PRIME32_2) | 0;
        v2 = (seed + PRIME32_2) | 0;
        v3 = (seed + 0) | 0;
        v4 = (seed + PRIME32_1) | 0;
        do {
            v1 = (v1 + (buffer_u32[input_ptr++] * PRIME32_2) | 0) | 0;
            v1 = (((v1 << 13) | (v1 >>> 19)) * PRIME32_1) | 0;
            v2 = (v2 + (buffer_u32[input_ptr++] * PRIME32_2) | 0) | 0;
            v2 = (((v2 << 13) | (v2 >>> 19)) * PRIME32_1) | 0;
            v3 = (v3 + (buffer_u32[input_ptr++] * PRIME32_2) | 0) | 0;
            v3 = (((v3 << 13) | (v3 >>> 19)) * PRIME32_1) | 0;
            v4 = (v4 + (buffer_u32[input_ptr++] * PRIME32_2) | 0) | 0;
            v4 = (((v4 << 13) | (v4 >>> 19)) * PRIME32_1) | 0;
        }
        while (input_ptr <= limit);
        acc = (v1 << 1 | v1 >>> 31) + (v2 << 7 | v2 >>> 25) | (v3 << 12 | v3 >>> 20) | (v4 << 18 | v4 >>> 14);
    }
    else {
        acc = (seed + PRIME32_5) | 0;
    }
    acc = (acc + inputLength) | 0;
    limit = (end - 4) >> 2;
    while (input_ptr <= limit) {
        acc = (acc + (buffer_u32[input_ptr++] * PRIME32_3) | 0) | 0;
        acc = ((acc << 17 | acc >>> 15) * PRIME32_4) | 0;
    }
    // translate ptr to byte offset
    input_ptr = input_ptr << 2;
    if (input_ptr < end) {
        const buffer_u8 = new Uint8Array(buffer_u32.buffer);
        do {
            acc = (acc + (buffer_u8[input_ptr++] * PRIME32_5) | 0) | 0;
            acc = ((acc << 11 | acc >>> 21) * PRIME32_1) | 0;
        }
        while (input_ptr < end);
    }
    acc = ((acc ^ (acc >>> 15)) * PRIME32_2) | 0;
    acc = ((acc ^ (acc >>> 13)) * PRIME32_3) | 0;
    acc = acc ^ (acc >>> 16);
    return acc >>> 0;
}
