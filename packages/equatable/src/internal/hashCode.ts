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

import { xxh32 } from "./hashers/xxhash32.js";
import { xxh64, mem } from "./hashers/xxhash64.js";
import { utf8EncodeInto } from "./utf8.js";

const hasNativeBigInt = typeof BigInt === "function" && typeof BigInt(0) === "bigint";
const hasBigUint64Array = typeof BigUint64Array === "function";
const hasXXHash64 = typeof mem === "object" && typeof xxh64 === "function";
const converterBuffer = new ArrayBuffer(8);
const converterFloat64Array = new Float64Array(converterBuffer);
const converterUint32Array = new Uint32Array(converterBuffer);

let createHashString: () => (x: string) => number = () => (createHashString = createCreateHashString())();
let hashNumberCore: (x: number) => number = x => (hashNumberCore = createHashNumber())(x);
let hashBigIntCore: (x: bigint) => number = x => (hashBigIntCore = createHashBigInt())(x);
let hashStringCore: (x: string) => number = x => (hashStringCore = createHashString())(x);
let hashSymbolCore: (x: symbol) => number = x => (hashSymbolCore = createHashSymbol())(x);
let hashObjectCore: (x: object) => number = x => (hashObjectCore = createHashObject())(x);

export const hashNumber: (x: number) => number = x => hashNumberCore(x);
export const hashBigInt: (x: bigint) => number = x => hashBigIntCore(x);
export const hashString: (x: string) => number = x => hashStringCore(x);
export const hashSymbol: (x: symbol) => number = x => hashSymbolCore(x);
export const hashObject: (x: object) => number = x => hashObjectCore(x);

function createCreateHashString() {
    function createCreateSeededHashStringUsingXXHash64() {
        const converterBigUint64Array = new BigUint64Array(converterUint32Array.buffer);
        let memory = new Uint8Array(mem!.buffer);

        function ensureCapacity(size: number) {
            if (mem!.buffer.byteLength < size) {
                mem!.grow(Math.ceil((size - mem!.buffer.byteLength) / 65536));
                memory = new Uint8Array(mem!.buffer);
            }
        }

        function convertBigUint64Hash(h: bigint) {
            converterBigUint64Array[0] = h;
            const a = converterUint32Array[0];
            const b = converterUint32Array[1];
            return ((a << 7) | (a >>> 25)) ^ b;
        }

        function getRandomBigUint64Seed() {
            converterUint32Array[0] = getRandomUint32Seed();
            converterUint32Array[1] = getRandomUint32Seed();
            return converterBigUint64Array[0];
        }

        function hashStringSeeded(x: string, seed: bigint) {
            ensureCapacity(x.length * 3);
            const written = utf8EncodeInto(x, memory);
            return convertBigUint64Hash(xxh64!(0, written, seed));
        }

        function createSeededHashString() {
            const seed = getRandomBigUint64Seed();

            function hashString(x: string) {
                return hashStringSeeded(x, seed);
            }

            return hashString;
        }

        return createSeededHashString;
    }

    function createCreateSeededHashStringUsingXXHash32() {
        let memory = new Uint8Array(65536);

        function ensureCapacity(size: number) {
            if (memory.byteLength < size) {
                memory = new Uint8Array(size + (65536 - size % 65536));
            }
        }

        function hashStringSeeded(x: string, seed: number) {
            ensureCapacity(x.length * 3);
            const written = utf8EncodeInto(x, memory);
            return xxh32(memory.buffer, 0, written, seed) >> 0;
        }

        function createSeededHashString() {
            const seed = getRandomUint32Seed();

            function hashString(x: string) {
                return hashStringSeeded(x, seed);
            }

            return hashString;
        }

        return createSeededHashString;
    }

    return hasNativeBigInt && hasBigUint64Array && hasXXHash64 ? createCreateSeededHashStringUsingXXHash64() :
        createCreateSeededHashStringUsingXXHash32();
}

function createHashNumber() {
    function hashFloat64(x: number) {
        converterFloat64Array[0] = x;
        const a = converterUint32Array[0];
        const b = converterUint32Array[1];
        return (((a << 7) | (a >>> 25)) ^ b) | 0;
    }

    function hashNumber(x: number) {
        return x >> 0 === x ? x | 0 : hashFloat64(x);
    }

    return hashNumber;
}

function createHashBigInt() {
    function createHashBigIntUsingBigUint64Array() {
        const converterBigUint64Array = new BigUint64Array(converterBuffer);
        const ZERO = BigInt(0);
        const ONE = BigInt(1);
        const TWO = BigInt(2);
        const MAX_I32 = BigInt(2) ** BigInt(31) - BigInt(1);
        const MIN_I32 = ~MAX_I32;
        const SIZE_U64 = BigInt(64);

        function hashBigInt(x: bigint) {
            if (x === ZERO) return 0;
            if (x >= MIN_I32 && x <= MAX_I32) return Number(x);
            x = x < ZERO ? ~x * TWO + ONE : x * TWO;
            let hash = 0;
            while (x) {
                converterBigUint64Array[0] = x;
                hash = ((hash << 7) | (hash >>> 25)) ^ converterUint32Array[0];
                hash = ((hash << 7) | (hash >>> 25)) ^ converterUint32Array[1];
                x = x >> SIZE_U64;
            }
            return hash | 0;
        }

        return hashBigInt;
    }

    function createHashBigIntUsingNumberConstructor() {
        const ZERO = BigInt(0);
        const ONE = BigInt(1);
        const TWO = BigInt(2);
        const MAX_I32 = BigInt(2) ** BigInt(31) - BigInt(1);
        const MIN_I32 = ~MAX_I32;
        const SIZE_U32 = BigInt(32);
        const U32_MASK = BigInt("0xFFFFFFFF");

        function hashBigInt(x: bigint) {
            if (x === ZERO) return 0;
            if (x >= MIN_I32 && x <= MAX_I32) return Number(x);
            x = x < ZERO ? ~x * TWO + ONE : x * TWO;
            let hash = 0;
            while (x !== ZERO) {
                hash = ((hash << 7) | (hash >>> 25)) ^ Number(x & U32_MASK);
                x >>= SIZE_U32;
                hash = ((hash << 7) | (hash >>> 25)) ^ Number(x & U32_MASK);
                x >>= SIZE_U32;
            }
            return hash | 0;
        }

        return hashBigInt;
    }

    function createHashBigIntUsingToString() {
        const hashBigIntString = createHashString();

        function hashBigInt(x: bigint) {
            return hashBigIntString(x.toString());
        }

        return hashBigInt;
    }

    return hasNativeBigInt && hasBigUint64Array ? createHashBigIntUsingBigUint64Array() :
        hasNativeBigInt ? createHashBigIntUsingNumberConstructor() :
        createHashBigIntUsingToString();
}

function createHashSymbol() {
    interface MapLike<K, V> {
        has(key: K): boolean;
        get(key: K): V | undefined;
        set(key: K, value: V): void;
    }

    const getDescription = "description" in Symbol.prototype ? (symbol: symbol) => symbol.description :
        (symbol: symbol) => {
            const s = symbol.toString();
            return s.length >= 8 && s.slice(0, 7) === "Symbol(" && s.slice(-1) === ")" ? s.slice(7, -1) : s;
        };

    const builtinSymbolHasher = createHashString();
    let builtinSymbolHashes: MapLike<symbol, number>;
    let builtinSymbols: MapLike<symbol, string>;
    try {
        new WeakMap().set(Symbol.iterator as any, null);
        builtinSymbolHashes = new WeakMap<any, number>();
        builtinSymbols = new WeakMap<any, string>();
    }
    catch {
        builtinSymbolHashes = new Map();
        builtinSymbols = new Map();
    }

    for (const key of Object.getOwnPropertyNames(Symbol)) {
        if (typeof key === "string") {
            const value = (Symbol as any)[key];
            if (typeof value === "symbol") {
                builtinSymbols.set(value, `Symbol.${key}`);
            }
        }
    }

    const registeredSymbolHasher = createHashString();
    let registeredSymbolHashes: MapLike<symbol, number>;
    try {
        new WeakMap().set(Symbol.for("@esfx/equatable!~globalSymbolTest") as any, null);
        registeredSymbolHashes = new WeakMap<any, number>();
    } catch {
        registeredSymbolHashes = new Map();
    }

    const localSymbolHasher = createHashString();
    let localSymbolHashes: MapLike<symbol, number>;
    let localSymbolCounter = 1;
    try {
        new WeakMap().set(Symbol() as any, null);
        localSymbolHashes = new WeakMap<any, number>();
    }
    catch {
        localSymbolHashes = new Map();
    }

    function hashGlobalSymbol(symbol: symbol, key: string) {
        let hash = registeredSymbolHashes.get(symbol);
        if (hash === undefined) {
            hash = registeredSymbolHasher(key);
            registeredSymbolHashes.set(symbol, hash);
        }
        return hash;
    }

    function hashBuiltinSymbol(symbol: symbol, key: string) {
        let hash = builtinSymbolHashes.get(symbol);
        if (hash === undefined) {
            hash = builtinSymbolHasher(key);
            builtinSymbolHashes.set(symbol, hash);
        }
        return hash;
    }

    function hashLocalSymbol(symbol: symbol) {
        let hash = localSymbolHashes.get(symbol);
        if (hash === undefined) {
            hash = localSymbolHasher(`${localSymbolCounter++}#${getDescription(symbol)}`);
            localSymbolHashes.set(symbol, hash);
        }
        return hash;
    }

    function hashSymbol(x: symbol) {
        const builtinKey = builtinSymbols.get(x);
        if (builtinKey !== undefined) return hashBuiltinSymbol(x, builtinKey);

        const globalKey = Symbol.keyFor(x);
        if (globalKey !== undefined) return hashGlobalSymbol(x, globalKey);

        return hashLocalSymbol(x);
    }

    return hashSymbol;
}

function createHashObject() {
    const objectHashes = new WeakMap<object, number>();
    const objectSeed = getRandomUint32Seed();
    let objectCounter = 1;

    // Thomas Wang, Integer Hash Functions.
    // http://web.archive.org/web/20071223173210/http://www.concentric.net/~Ttwang/tech/inthash.htm
    function hashUint32(key: number) {
        key = ~key + (key << 15); // key = (key << 15) - key - 1;
        key = key ^ (key >> 12);
        key = key + (key << 2);
        key = key ^ (key >> 4);
        key = key * 2057; // key = (key + (key << 3)) + (key << 11);
        key = key ^ (key >> 16);
        return key >>> 0;
    }

    function hashObject(x: object) {
        let hash = objectHashes.get(x);
        if (hash === undefined) {
            hash = hashUint32(objectCounter++ ^ objectSeed) ^ objectSeed;
            objectHashes.set(x, hash);
        }
        return hash;
    }

    return hashObject;
}

function getRandomUint32Seed() {
    return Math.floor(Math.random() * 0xffffffff) >>> 0;
}
