import xxhash64 from "../hashString/xxhash64wasm.wat";

const converterArrayBuffer = new ArrayBuffer(8);
const converterUint32Array = new Uint32Array(converterArrayBuffer);
const converterBigUint64Array = new BigUint64Array(converterArrayBuffer);
const encoder = new TextEncoder();

function convertBigIntHashToInt32(h: bigint) {
    converterBigUint64Array[0] = h;
    const a = converterUint32Array[0];
    const b = converterUint32Array[1];
    return (((a << 7) | (a >>> 25)) ^ b) >> 0;
}

let memory = new Uint8Array(xxhash64!.mem.buffer);

function ensureCapacity(length: number) {
    if (xxhash64!.mem.buffer.byteLength < length) {
        const extraPages = Math.ceil((length - xxhash64!.mem.buffer.byteLength) / 65535);
        xxhash64!.mem.grow(extraPages);
        memory = new Uint8Array(xxhash64!.mem.buffer);
    }
}

function getRandomUint32Seed() {
    return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

function getRandomBigUint64Seed() {
    converterUint32Array[0] = getRandomUint32Seed();
    converterUint32Array[1] = getRandomUint32Seed();
    return converterBigUint64Array[0];
}

function createHashString() {
    const seed = getRandomBigUint64Seed();

    function hashString(s: string) {
        ensureCapacity(s.length * 3);
        const { written = 0 } = encoder.encodeInto(s, memory);
        return convertBigIntHashToInt32(xxhash64!.xxh64(0, written, seed));
    }

    return hashString;
}

const builtinSymbolHasher = createHashString();
const builtinSymbolHashes = new Map<symbol, number>();
const builtinSymbols = new Map<symbol, string>();
for (const [key, value] of Object.entries(Symbol)) {
    if (typeof key === "string" && typeof value === "symbol") {
        builtinSymbols.set(value, `Symbol.${key}`);
    }
}

const registeredSymbolHasher = createHashString();
const registeredSymbolHashes = new Map<symbol, number>();
const localSymbolHasher = createHashString();
const localSymbolHashes = new Map<symbol, number>();
let localSymbolCounter = 1;

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
        hash = localSymbolHasher(`${localSymbolCounter++}#${symbol.description}`);
        localSymbolHashes.set(symbol, hash);
    }
    return hash;
}

export function hashSymbolWithXXHash64UsingWasm(x: symbol) {
    const builtinKey = builtinSymbols.get(x);
    if (builtinKey !== undefined) return hashBuiltinSymbol(x, builtinKey);

    const globalKey = Symbol.keyFor(x);
    if (globalKey !== undefined) return hashGlobalSymbol(x, globalKey);

    return hashLocalSymbol(x);
}
