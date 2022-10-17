import xxhash64 from "./xxhash64wasm.wat";

const converterArrayBuffer = new ArrayBuffer(8);
const converterUint32Array = new Uint32Array(converterArrayBuffer);
const converterBigUint64Array = new BigUint64Array(converterArrayBuffer);
const encoder = new TextEncoder();
const seed = BigInt(0);

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

export function hashStringWithXXHash64UsingWasm(str: string) {
    ensureCapacity(str.length * 3);
    const { written = 0 } = encoder.encodeInto(str, memory);
    return convertBigIntHashToInt32(xxhash64!.xxh64(0, written, seed));
}
