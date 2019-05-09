"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const Murmur3 = tslib_1.__importStar(require("@esfx/internal-murmur3"));
let weakPrototypeCounters;
let nullPrototypeCounter;
let localSymbolCounter;
let weakObjectHashes;
let globalSymbolHashes;
let localSymbolHashes;
const maxInt32 = (2 ** 31) - 1;
const minInt32 = ~maxInt32;
const maxUint32 = (2 ** 32) - 1;
const minUint32 = 0;
const float64View = new DataView(new ArrayBuffer(8));
const defaultObjectSeed = Murmur3.createSeed();
const defaultStringSeed = Murmur3.createSeed();
const defaultLocalSymbolSeed = Murmur3.createSeed();
const defaultGlobalSymbolSeed = Murmur3.createSeed();
const defaultBigIntSeed = Murmur3.createSeed();
let objectSeed = defaultObjectSeed;
let stringSeed = defaultStringSeed;
let bigIntSeed = defaultBigIntSeed;
let localSymbolSeed = defaultLocalSymbolSeed;
let globalSymbolSeed = defaultGlobalSymbolSeed;
/*@internal*/
function hashBoolean(x) {
    return x ? 1 : 0;
}
exports.hashBoolean = hashBoolean;
function isInt32(x) {
    return Number.isInteger(x)
        && x >= minInt32
        && x <= maxInt32;
}
function hashInt32(x) {
    return x;
}
function isUint32(x) {
    return Number.isInteger(x)
        && x >= minUint32
        && x <= maxUint32;
}
function hashUint32(x) {
    return x >> 0;
}
function hashFloat64(x) {
    float64View.setFloat64(0, x);
    return float64View.getInt32(0, /*littleEndian*/ true) ^ float64View.getInt32(4, /*littleEndian*/ true);
}
/*@internal*/
function hashNumber(x) {
    return isInt32(x) ? hashInt32(x) :
        isUint32(x) ? hashUint32(x) :
            hashFloat64(x);
}
exports.hashNumber = hashNumber;
function hashBuffer(buffer, seed) {
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    return Murmur3.hash(arrayBuffer, seed);
}
function hashStringWithSeed(x, encoding, seed) {
    return hashBuffer(Buffer.from(x, encoding), seed);
}
/*@internal*/
function combineHashes(x, y) {
    return ((x << 7) | (x >>> 25)) ^ y;
}
exports.combineHashes = combineHashes;
function getRealBigIntHasher() {
    const ZERO = BigInt(0);
    const UINT32_MASK = BigInt(0xffffffff);
    const SIZEOF_UINT32 = BigInt(32);
    function hashBigInt(x) {
        if (x === ZERO)
            return 0;
        let hash = x < ZERO ? -1 : x > ZERO ? 1 : 0;
        if (x < ZERO)
            x = -x;
        while (x !== ZERO) {
            hash = combineHashes(hash, Number(x & UINT32_MASK));
            x = x >> SIZEOF_UINT32;
        }
        return hash;
    }
    return hashBigInt;
}
function getPseudoBigIntHasher() {
    function hashBigInt(x) {
        return hashStringWithSeed(x.toString(), "ascii", bigIntSeed);
    }
    return hashBigInt;
}
/*@internal*/
exports.hashBigInt = typeof BigInt === "function" ? getRealBigIntHasher() : getPseudoBigIntHasher();
/*@internal*/
function hashString(x) {
    return hashStringWithSeed(x, "utf8", stringSeed);
}
exports.hashString = hashString;
function hashGlobalSymbol(symbol, key) {
    let hash = globalSymbolHashes && globalSymbolHashes.get(symbol);
    if (hash === undefined) {
        hash = hashStringWithSeed(key, "utf8", globalSymbolSeed);
        if (!globalSymbolHashes)
            globalSymbolHashes = new Map();
        globalSymbolHashes.set(symbol, hash);
    }
    return hash;
}
const getDescription = "description" in Symbol.prototype ? (symbol) => symbol.description :
    (symbol) => {
        const s = symbol.toString();
        if (s.startsWith("Symbol(") && s.endsWith(")")) {
            return s.slice(7, -1);
        }
        return s;
    };
function hashLocalSymbol(symbol) {
    let hash = localSymbolHashes && localSymbolHashes.get(symbol);
    if (hash === undefined) {
        if (!localSymbolCounter)
            localSymbolCounter = { next: 1 };
        hash = combineHashes(localSymbolSeed, localSymbolCounter.next++);
        if (symbol.description)
            hash = hashStringWithSeed(getDescription(symbol), "utf8", hash);
        if (!localSymbolHashes)
            localSymbolHashes = new Map();
        localSymbolHashes.set(symbol, hash);
    }
    return hash;
}
/*@internal*/
function hashSymbol(x) {
    const key = Symbol.keyFor(x);
    return key !== undefined ? hashGlobalSymbol(x, key) : hashLocalSymbol(x);
}
exports.hashSymbol = hashSymbol;
function getPrototypeCounter(prototype) {
    let counter;
    if (prototype === null) {
        counter = nullPrototypeCounter || (nullPrototypeCounter = { next: 1 });
    }
    else {
        counter = weakPrototypeCounters && weakPrototypeCounters.get(prototype);
        if (!counter) {
            if (!weakPrototypeCounters)
                weakPrototypeCounters = new WeakMap();
            weakPrototypeCounters.set(prototype, counter = { next: 1 });
        }
    }
    return counter;
}
/*@internal*/
function hashObject(x) {
    let hash = weakObjectHashes && weakObjectHashes.get(x);
    if (hash === undefined) {
        if (!weakObjectHashes)
            weakObjectHashes = new WeakMap();
        hash = getPrototypeCounter(Object.getPrototypeOf(x)).next++;
        hash = combineHashes(objectSeed, hash);
        weakObjectHashes.set(x, hash);
    }
    return hash;
}
exports.hashObject = hashObject;
/*@internal*/
function hashUnknown(x) {
    switch (typeof x) {
        case "boolean": return hashBoolean(x);
        case "number": return hashNumber(x);
        case "bigint": return exports.hashBigInt(x);
        case "string": return hashString(x);
        case "symbol": return hashSymbol(x);
        case "function": return hashObject(x);
        case "object":
            if (x !== null)
                return hashObject(x);
        // fall through
        case "undefined":
        default:
            return 0;
    }
}
exports.hashUnknown = hashUnknown;
// Test hooks
hashUnknown.getState = () => ({
    weakPrototypeCounters,
    nullPrototypeCounter,
    localSymbolCounter,
    weakObjectHashes,
    globalSymbolHashes,
    localSymbolHashes,
    objectSeed,
    stringSeed,
    bigIntSeed,
    localSymbolSeed,
    globalSymbolSeed
});
hashUnknown.setState = (state) => ({
    weakPrototypeCounters,
    nullPrototypeCounter,
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
//# sourceMappingURL=index.js.map