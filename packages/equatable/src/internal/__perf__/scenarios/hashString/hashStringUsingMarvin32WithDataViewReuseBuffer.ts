import { hashMarvin32DataView, seed_hi, seed_lo } from "./marvin32";

const buffer4k = Buffer.allocUnsafe(4096);

export function hashStringUsingMarvin32WithDataViewReuseBuffer(x: string) {
    let buffer: ArrayBuffer;
    let byteLength: number;
    if (x.length <= 1024) {
        byteLength = buffer4k.write(x);
        buffer = buffer4k.buffer;
    }
    else {
        buffer = Buffer.from(x, "utf8").buffer;
        byteLength = buffer.byteLength;
    }
    return hashMarvin32DataView(buffer, byteLength, seed_lo, seed_hi);
}