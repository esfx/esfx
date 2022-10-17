import { xxh64 } from "./xxhash64js";

const encoder = new TextEncoder();
const seed = BigInt(0);
let buffer = new Uint8Array(65536);

function ensureCapacity(size: number) {
    if (buffer.byteLength < size) {
        const newSize = size + (65535 - size % 65535);
        const newMem = new Uint8Array(newSize);
        newMem.set(buffer);
        buffer = newMem;
    }
}

const converterArrayBuffer = new ArrayBuffer(8);
const converterUint32Array = new Uint32Array(converterArrayBuffer);
const converterBigUint64Array = new BigUint64Array(converterArrayBuffer);

function convertHash(h: bigint) {
    converterBigUint64Array[0] = h;
    const a = converterUint32Array[0];
    const b = converterUint32Array[1];
    return (((a << 7) | (a >>> 25)) ^ b) >> 0;
}

export function hashStringWithXXHash64UsingJs(x: string) {
    ensureCapacity(x.length * 3);
    const { written = 0 } = encoder.encodeInto(x, buffer);
    return convertHash(xxh64(buffer.buffer, 0, written, seed));
}
