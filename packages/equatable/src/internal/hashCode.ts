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

import { createSeed, hash } from './marvin32';

// TODO: See if we can use native apis to compute hashes in NodeJS

class Counter { next = 1; }

export function createHashUnknown() {
    const defaultStringSeed = createSeed();
    const defaultGlobalSymbolSeed = createSeed();
    const defaultLocalSymbolSeed = createSeed();
    const defaultBigIntSeed = createSeed();
    const [defaultObjectSeed] = createSeed();

    let objectSeed = defaultObjectSeed;
    let stringSeed = defaultStringSeed;
    let bigIntSeed = defaultBigIntSeed;
    let localSymbolSeed = defaultLocalSymbolSeed;
    let globalSymbolSeed = defaultGlobalSymbolSeed;

    const endianness = (new Uint16Array(new Uint8Array([0x01, 0x02]).buffer))[0] == 0x0102 ? "big-endian" : "little-endian";
    const [lo, hi] = endianness === "little-endian" ? [0, 1] : [1, 0];

    let objectCounter: Counter | undefined;
    let localSymbolCounter: Counter | undefined;
    let weakObjectHashes: WeakMap<object, number> | undefined;
    let globalSymbolHashes: Map<symbol, number> | undefined;
    let localSymbolHashes: Map<symbol, number> | undefined;
    let buffer4k: Buffer | undefined;

    const buffer64 = new ArrayBuffer(8);
    const float64Array = new Float64Array(buffer64);
    const uint32Array = new Uint32Array(buffer64);

    // see __perf__/hashNumber.ts for microbenchmarks
    // current winner: hashNumberByFloat64TypedArrayOnly
    // however, we are using hashNumberByTypeUsingTypedArray for consistency with integers
    function hashNumber(x: number) {
        const i = x >> 0;
        return i === x ? x : x >>> 0 === x ? i : (float64Array[0] = x, uint32Array[lo] ^ uint32Array[hi]);
    }

    // see __perf__/hashBigInt.ts for microbenchmarks
    // current winner: hashBigIntUsingBigUint64Array
    const hashBigInt = (typeof BigInt === "function" && typeof BigInt(0) === "bigint" ? typeof BigUint64Array === "function" ?
        () => {
            // Native BigInt and BigUint64Array
            const ZERO = BigInt(0);
            const UINT32_MASK = BigInt(0xffffffff);
            const SIZEOF_UINT32 = BigInt(32);
            const bigUint64Array = new BigUint64Array(buffer64);
            return function hashBigInt(x: bigint) {
                if (x === ZERO) return 0;
                const negative = x < ZERO;
                if (negative) x = -x;
                let hash = negative ? -1 : 0;
                while (x > ZERO) {
                    bigUint64Array[0] = x & UINT32_MASK;
                    hash = ((hash << 7) | (hash >>> 25)) ^ uint32Array[lo];
                    x = x >> SIZEOF_UINT32;
                }
                return hash;
            };
        } :
        () => {
            // Native BigInt
            const ZERO = BigInt(0);
            const UINT32_MASK = BigInt(0xffffffff);
            const SIZEOF_UINT32 = BigInt(32);
            return function hashBigInt(x: bigint) {
                if (x === ZERO) return 0;
                const negative = x < ZERO;
                if (negative) x = -x;
                let hash = negative ? -1 : 0;
                while (x > ZERO) {
                    hash = ((hash << 7) | (hash >>> 25)) ^ Number(x & UINT32_MASK);
                    x = x >> SIZEOF_UINT32;
                }
                return hash;
            };
        } :
        () => {
            // Pseudo-BigInt
            return function hashBigInt(x: bigint) {
                return hashStringWithSeed(x.toString(), "ascii", bigIntSeed);
            };
        })();

    // see __perf__/hashString.ts for microbenchmarks
    // current winner: hashStringUsingMarvin32WithDataViewReuseBuffer
    function hashStringWithSeed(x: string, encoding: BufferEncoding, [hi, lo]: readonly [number, number]) {
        let buffer: ArrayBuffer;
        let byteLength: number;
        if (x.length < 1024) {
            buffer4k ??= Buffer.alloc(4096);
            byteLength = buffer4k.write(x, 0, encoding);
            buffer = buffer4k.buffer;
        }
        else {
            buffer = Buffer.from(x, "utf8").buffer;
            byteLength = buffer.byteLength;
        }
        return hash(buffer, byteLength, lo, hi);
    }

    function hashString(x: string) {
        return hashStringWithSeed(x, "utf8", stringSeed);
    }

    function hashGlobalSymbol(symbol: symbol, key: string) {
        let hash = globalSymbolHashes?.get(symbol);
        if (hash === undefined) {
            hash = hashStringWithSeed(key, "utf8", globalSymbolSeed);
            globalSymbolHashes ??= new Map();
            globalSymbolHashes.set(symbol, hash);
        }
        return hash;
    }

    const getDescription = "description" in Symbol.prototype ?
        (symbol: symbol) => symbol.description :
        (symbol: symbol) => {
            const s = symbol.toString();
            if (s.startsWith("Symbol(") && s.endsWith(")")) {
                return s.slice(7, -1);
            }
            return s;
        };

    function hashLocalSymbol(symbol: symbol) {
        let hash = localSymbolHashes?.get(symbol);
        if (hash === undefined) {
            localSymbolCounter ??= new Counter();
            const description = getDescription(symbol);
            hash = hashStringWithSeed(`${localSymbolCounter.next++}#${description}`, "utf8", localSymbolSeed);
            localSymbolHashes ??= new Map();
            localSymbolHashes.set(symbol, hash);
        }
        return hash;
    }

    function hashSymbol(x: symbol) {
        const key = Symbol.keyFor(x);
        return key !== undefined ? hashGlobalSymbol(x, key) : hashLocalSymbol(x);
    }

    function hashObject(x: object) {
        let hash = weakObjectHashes?.get(x);
        if (hash === undefined) {
            weakObjectHashes ??= new WeakMap();
            objectCounter ??= new Counter();
            hash = objectCounter.next++;
            hash = ((hash << 7) | (hash >>> 25)) ^ objectSeed;
            weakObjectHashes.set(x, hash);
        }
        return hash;
    }

    function hashUnknown(x: unknown) {
        switch (typeof x) {
            case "boolean":
                return x ? 1 : 0;
            case "number":
                return hashNumber(x);
            case "bigint":
                return hashBigInt(x);
            case "string":
                return hashString(x);
            case "symbol":
                return hashSymbol(x);
            case "function":
                return hashObject(x);
            case "object":
                return x === null ? 0 : hashObject(x);
            // case "undefined":
            default:
                return 0;
        }
    }

    // Test hooks
    function getState() {
        return {
            nullPrototypeCounter: objectCounter,
            localSymbolCounter,
            weakObjectHashes,
            globalSymbolHashes,
            localSymbolHashes,
            objectSeed,
            stringSeed,
            bigIntSeed,
            localSymbolSeed,
            globalSymbolSeed
        };
    };

    function setState(state: Partial<ReturnType<typeof getState>>) {
        ({
            nullPrototypeCounter: objectCounter,
            localSymbolCounter,
            weakObjectHashes,
            globalSymbolHashes,
            localSymbolHashes,
            objectSeed = defaultObjectSeed,
            stringSeed = defaultStringSeed,
            bigIntSeed = defaultBigIntSeed,
            localSymbolSeed = defaultLocalSymbolSeed,
            globalSymbolSeed = defaultGlobalSymbolSeed
        } = state);
    };

    return { hashUnknown, getState, setState };
}

// We attach a copy of `hashUnknown` to the global object so that we can share the same hash code
// state across CommonJS/ESM/Browser without exposing other internals.

declare var global: unknown, self: unknown;

const kHashUnknown = Symbol.for("@esfx/equatable!~hashUnknown");

const root = typeof globalThis === "object" ? globalThis :
    typeof global === "object" ? global :
    typeof self === "object" ? self :
    undefined;

let hashUnknownCore: ReturnType<typeof createHashUnknown>["hashUnknown"];
if (root && kHashUnknown in root) {
    hashUnknownCore = (root as any)[kHashUnknown];
}
else {
    const { hashUnknown } = createHashUnknown();
    hashUnknownCore = hashUnknown;
    Object.defineProperty(root, kHashUnknown, { value: hashUnknownCore });
}

export function hashUnknown(x: unknown) {
    return hashUnknownCore(x);
}
