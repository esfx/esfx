/*!
   Copyright 2021 Ron Buckton

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

   NOTE: The `murmur3` algorithm is public domain.
*/

/* @internal */
export function createSeed() {
    return (Math.random() * 0xffffffff) >>> 0;
}

/* @internal */
export const defaultSeed = createSeed();

const c1 = 0xcc9e2d51;
const c2 = 0x1b873593;
const n = 0xe6546b64;

/* @internal */
export function hash(buffer: ArrayBuffer, seed: number) {
    const view = new DataView(buffer);
    let h = seed >>> 0;
    let i = 0;
    let k: number;
    while (i < view.byteLength - 4) {
        k = view.getUint32(i, /*littleEndian*/ true);
        k *= c1;
        k = (k << 15) | (k >>> 17);
        k *= c2;
        h ^= k;
        h = (h << 13) | (h >>> 19);
        h = h * 5 + n;
        i += 4;
    }
    if (i < view.byteLength) {
        k = 0;
        switch (view.byteLength - i) {
            case 3: k |= view.getUint8(i + 2) << 16; // falls through
            case 2: k |= view.getUint8(i + 1) << 8; // falls through
            case 1: k |= view.getUint8(i + 0) << 0; // falls through
        }
        k *= c1;
        k = (k << 15) | (k >>> 17);
        k *= c2;
        h ^= k;
    }
    h ^= view.byteLength;
    h ^= h >>> 16;
    h *= 0x85ebca6b;
    h ^= h >>> 13;
    h *= 0xc2b2ae35;
    h ^= h >>> 16;
    return h;
}