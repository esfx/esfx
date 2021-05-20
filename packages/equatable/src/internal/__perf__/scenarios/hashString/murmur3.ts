import { randomInt } from "crypto";

/* @internal */
export function createSeed() {
    return randomInt(0xffffffff) >>> 0;
}

/* @internal */
export const defaultSeed = createSeed();

const c1 = 0xcc9e2d51;
const c2 = 0x1b873593;
const n = 0xe6546b64;

/* @internal */
export function hashMurmur3DataView(buffer: ArrayBuffer, byteLength: number, seed: number) {
    const view = new DataView(buffer, 0, byteLength);
    let h = seed >>> 0;
    let i = 0;
    let k: number;
    while (i < byteLength - 4) {
        k = view.getUint32(i, /*littleEndian*/ true);
        k *= c1;
        k = (k << 15) | (k >>> 17);
        k *= c2;
        h ^= k;
        h = (h << 13) | (h >>> 19);
        h = h * 5 + n;
        i += 4;
    }
    if (i < byteLength) {
        k = 0;
        switch (byteLength - i) {
            case 3: k |= view.getUint8(i + 2) << 16; // falls through
            case 2: k |= view.getUint8(i + 1) << 8; // falls through
            case 1: k |= view.getUint8(i + 0) << 0; // falls through
        }
        k *= c1;
        k = (k << 15) | (k >>> 17);
        k *= c2;
        h ^= k;
    }
    h ^= byteLength;
    h ^= h >>> 16;
    h *= 0x85ebca6b;
    h ^= h >>> 13;
    h *= 0xc2b2ae35;
    h ^= h >>> 16;
    return h;
}

/* @internal */
export function hashMurmur3TypedArray(buffer: ArrayBuffer, byteLength: number, seed: number) {
    const uint32ByteLength = (byteLength - byteLength % 4);
    const uint32Array = new Uint32Array(buffer, 0, uint32ByteLength / 4);
    let h = seed >>> 0;
    let i = 0;
    let j = 0;
    let k: number;
    while (i < uint32ByteLength) {
        k = uint32Array[j];
        k *= c1;
        k = (k << 15) | (k >>> 17);
        k *= c2;
        h ^= k;
        h = (h << 13) | (h >>> 19);
        h = h * 5 + n;
        i += 4;
        j++;
    }
    if (i < byteLength) {
        k = 0;
        const uint8Array = new Uint8Array(buffer);
        switch (byteLength - i) {
            case 3: k |= uint8Array[i + 2] << 16; // falls through
            case 2: k |= uint8Array[i + 1] << 8; // falls through
            case 1: k |= uint8Array[i + 0] << 0; // falls through
        }
        k *= c1;
        k = (k << 15) | (k >>> 17);
        k *= c2;
        h ^= k;
    }
    h ^= byteLength;
    h ^= h >>> 16;
    h *= 0x85ebca6b;
    h ^= h >>> 13;
    h *= 0xc2b2ae35;
    h ^= h >>> 16;
    return h;
}
