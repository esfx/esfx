import { defaultSeed, hashMurmur3DataView } from "./murmur3";

const buffer4k = Buffer.allocUnsafe(4096);

export function hashStringUsingMurmur3WithDataViewReuseBuffer(value: string) {
    let buffer: ArrayBuffer;
    let byteLength: number;
    if (value.length <= 1024) {
        byteLength = buffer4k.write(value, "utf8");
        buffer = buffer4k.buffer;
    }
    else {
        buffer = Buffer.from(value, "utf8").buffer;
        byteLength = buffer.byteLength;
    }
    return hashMurmur3DataView(buffer, byteLength, defaultSeed);
}
