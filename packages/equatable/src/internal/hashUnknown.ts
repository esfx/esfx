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
*/

// Use subpath imports so that we can choose an appropriate hash implementation for each type based on the runtime.
import { hashNumber } from "#hash/number"; // prefers js. see package.json
import { hashBigInt } from "#hash/bigint"; // prefers native > wasm > js. see package.json
import { hashString } from "#hash/string"; // prefers native > wasm > js. see package.json
import { hashSymbol } from "#hash/symbol"; // prefers native > js. see package.json
import { hashObject } from "#hash/object"; // prefers native > js. see package.json

// We attach a copy of `hashUnknown` to the global object so that we can share the same hash code state across
// CommonJS/ESM/Browser without exposing other internals.

declare var global: unknown, self: unknown;

const root =
    typeof globalThis === "object" ? globalThis :
    typeof global === "object" ? global :
    typeof self === "object" ? self :
    undefined;

const kHashUnknown = Symbol.for("@esfx/equatable!~hashUnknown");

let hashUnknownCore: (value: unknown) => number;
if (root && typeof (root as any)[kHashUnknown] === "function") {
    hashUnknownCore = (root as any)[kHashUnknown];
}
else {
    hashUnknownCore = function hashUnknown(x: unknown): number {
        switch (typeof x) {
            case "boolean": return x ? 1 : 0;
            case "number": return hashNumber(x);
            case "bigint": return hashBigInt(x);
            case "string": return hashString(x);
            case "symbol": return hashSymbol(x);
            case "function": return hashObject(x);
            case "object": return x === null ? 0 : hashObject(x);
            case "undefined": return 0;
            default: throw new TypeError(`Unsupported type: ${typeof x}`);
        }
    };
    Object.defineProperty(root, kHashUnknown, { value: hashUnknownCore });
}

export function hashUnknown(x: unknown) {
    return hashUnknownCore(x);
}
