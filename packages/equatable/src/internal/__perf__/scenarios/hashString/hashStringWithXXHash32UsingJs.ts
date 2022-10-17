import { xxh32 } from "../../../hashers/xxhash32.js";

const encoder = new TextEncoder();
const seed = 0;
let buffer = new Uint8Array(65536);

function ensureCapacity(size: number) {
    if (buffer.byteLength < size) {
        const newSize = size + (65535 - size % 65535);
        const newMem = new Uint8Array(newSize);
        newMem.set(buffer);
        buffer = newMem;
    }
}

export function hashStringWithXXHash32UsingJs(x: string) {
    ensureCapacity(x.length * 3);
    const { written = 0 } = encoder.encodeInto(x, buffer);
    return xxh32(buffer.buffer, 0, written, seed) | 0;
}
