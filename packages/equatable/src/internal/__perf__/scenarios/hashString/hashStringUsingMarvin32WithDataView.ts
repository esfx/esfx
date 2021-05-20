import { hashMarvin32TypedArray, seed_hi, seed_lo } from "./marvin32";

export function hashStringUsingMarvin32WithDataView(value: string) {
    const buffer = Buffer.from(value, "utf8").buffer;
    return hashMarvin32TypedArray(buffer, buffer.byteLength, seed_lo, seed_hi);
}
