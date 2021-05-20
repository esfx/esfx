import { defaultSeed, hashMurmur3DataView } from "./murmur3";

export function hashStringUsingMurmur3WithDataView(value: string) {
    const buffer = Buffer.from(value, "utf8").buffer;
    return hashMurmur3DataView(buffer, buffer.byteLength, defaultSeed);
}
