import { xxh32 } from "../../../hashers/xxhash32.js";

const encoder = new TextEncoder();
let buffer = new Uint8Array(65536);

function ensureCapacity(size: number) {
    if (buffer.byteLength < size) {
        const newSize = size + (65535 - size % 65535);
        const newMem = new Uint8Array(newSize);
        newMem.set(buffer);
        buffer = newMem;
    }
}

function getRandomUint32Seed() {
    return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

function createHashString() {
    const seed = getRandomUint32Seed();

    function hashString(s: string) {
        ensureCapacity(s.length * 3);
        const { written = 0 } = encoder.encodeInto(s, buffer);
        return xxh32(buffer.buffer, 0, written, seed) | 0;
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

export function hashSymbolWithXXHash32UsingJs(x: symbol) {
    const builtinKey = builtinSymbols.get(x);
    if (builtinKey !== undefined) return hashBuiltinSymbol(x, builtinKey);

    const globalKey = Symbol.keyFor(x);
    if (globalKey !== undefined) return hashGlobalSymbol(x, globalKey);

    return hashLocalSymbol(x);
}
