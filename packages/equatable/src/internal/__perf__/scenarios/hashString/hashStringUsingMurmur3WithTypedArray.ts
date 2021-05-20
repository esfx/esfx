import { defaultSeed, hashMurmur3TypedArray } from "./murmur3";

export function hashStringUsingMurmur3WithTypedArray(value: string) {
    const buffer = Buffer.from(value, "utf8").buffer;
    return hashMurmur3TypedArray(buffer, buffer.byteLength, defaultSeed);
}
