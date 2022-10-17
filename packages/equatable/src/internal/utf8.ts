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
*/

const hasTextEncoder = typeof TextEncoder === "function";

let utf8EncodeIntoCore: (source: string, buffer: Uint8Array) => number = (source, buffer) => (utf8EncodeIntoCore = createUtf8EncodeInto())(source, buffer);

export const utf8EncodeInto: (source: string, buffer: Uint8Array) => number = (source, buffer) => utf8EncodeIntoCore(source, buffer);

function createUtf8EncodeInto() {
    function getUtf8EncodeIntoUsingTextEncoder() {
        const encoder = new TextEncoder();

        function utf8EncodeInto(source: string, buffer: Uint8Array): number {
            const { written = 0 } = encoder.encodeInto(source, buffer);
            return written;
        }

        return utf8EncodeInto;
    }

    function getUtf8EncodeIntoFallback() {
        function utf8EncodeInto(source: string, buffer: Uint8Array): number {
            const length = source.length;
            let written = 0;
            for (let i = 0; i < length; i++) {
                let ch = source.charCodeAt(i);
                // decode surrogate pairs
                if ((ch & 0xd800) !== 0 && (ch & 0xffff2400) === 0 && i < length - 1) {
                    const ch2 = source.charCodeAt(i + 1);
                    if ((ch2 & 0xfc00) === 0xdc00) {
                        ch = ((ch & 0x3ff) << 10) + (ch2 & 0x3ff) + 0x10000;
                        i++;
                    }
                }
                if ((ch & 0xffffff80) === 0) {
                    buffer[written++] = ch;
                }
                else if ((ch & 0xfffff800) === 0) {
                    buffer[written++] = (ch >> 6) | 0xc0;
                    buffer[written++] = (ch & 0x3f) | 0x80;
                }
                else if ((ch & 0xffff000) === 0) {
                    buffer[written++] = (ch >> 12) | 0xe0;
                    buffer[written++] = ((ch >> 6) & 0x3f) | 0x80;
                    buffer[written++] = (ch & 0x3f) | 0x80;
                }
                else if ((ch & 0xffe00000) === 0) {
                    buffer[written++] = (ch >> 18) | 0xf0;
                    buffer[written++] = ((ch >> 12) & 0x3f) | 0x80;
                    buffer[written++] = ((ch >> 6) & 0x3f) | 0x80;
                    buffer[written++] = (ch & 0x3f) | 0x80;
                }
                else {
                    throw new RangeError("Unsupported charCode.");
                }
            }
            return written;
        }

        return utf8EncodeInto;
    }

    return hasTextEncoder ? getUtf8EncodeIntoUsingTextEncoder() :
        getUtf8EncodeIntoFallback();
}
