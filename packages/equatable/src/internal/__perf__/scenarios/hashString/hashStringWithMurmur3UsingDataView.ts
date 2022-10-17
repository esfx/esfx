import { defaultSeed, hashMurmur3DataView } from "./murmur3";

const encoder = new TextEncoder();
const buffer64k = new Uint8Array(64 * 1024);

export function hashStringWithMurmur3UsingDataView(value: string) {
    const bytes = encoder.encode(value);
    return hashMurmur3DataView(bytes.buffer, bytes.byteLength, defaultSeed);
}

export function hashStringWithMurmur3UsingDataViewReuseBuffer(value: string) {
    let buffer: ArrayBuffer;
    let byteLength: number;
    if (value.length * 3 <= 64 * 1024) {
        const { written } = encoder.encodeInto(value, buffer64k);
        byteLength = written!;
        buffer = buffer64k.buffer;
    }
    else {
        const bytes = encoder.encode(value);
        buffer = bytes.buffer;
        byteLength = buffer.byteLength;
    }
    return hashMurmur3DataView(buffer, byteLength, defaultSeed);
}
