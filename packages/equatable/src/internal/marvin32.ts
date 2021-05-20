const MAX_UINT32 = (2 ** 32) - 1;

const endianness = (new Uint16Array(new Uint8Array([0x01, 0x02]).buffer))[0] == 0x0102 ? "big-endian" : "little-endian";

export const DEFAULT_SEED = createSeed();

export function createSeed() {
    const lo = (Math.random() * MAX_UINT32) >>> 0;
    const hi = (Math.random() * MAX_UINT32) >>> 0;
    return [lo, hi] as const;
}

export function hash(data: ArrayBuffer, count: number, p0: number, p1: number) {
    const view = new DataView(data, 0, count);
    let offset = 0;

    process_uint32:
    if (count >= 4) {
        if (count >= 8) {
            let loopCount = Math.floor(count / 8);
            do {
                p0 += view.getUint32(offset);
                const next = view.getUint32(offset + 4);
                p1 ^= p0;
                p0 = (p0 << 20) | (p0 >>> 12);
                p0 += p1;
                p1 = (p1 << 9) | (p1 >>> 23);
                p1 ^= p0;
                p0 = (p0 << 27) | (p0 >>> 5);
                p0 += p1;
                p1 = (p1 << 19) | (p1 >>> 13);
                p0 += next;
                p1 ^= p0;
                p0 = (p0 << 20) | (p0 >>> 12);
                p0 += p1;
                p1 = (p1 << 9) | (p1 >>> 23);
                p1 ^= p0;
                p0 = (p0 << 27) | (p0 >>> 5);
                p0 += p1;
                p1 = (p1 << 19) | (p1 >>> 13);
                offset += 8;
            }
            while (--loopCount > 0);
            if ((count & 0b0100) === 0) {
                break process_uint32;
            }
        }
        p0 += view.getUint32(offset);
        p1 ^= p0;
        p0 = (p0 << 20) | (p0 >>> 12);
        p0 += p1;
        p1 = (p1 << 9) | (p1 >>> 23);
        p1 ^= p0;
        p0 = (p0 << 27) | (p0 >>> 5);
        p0 += p1;
        p1 = (p1 << 19) | (p1 >>> 13);
        offset += 4;
    }
    let partialResult = 0;
    if (offset !== count) {
        if (endianness === "little-endian") {
            partialResult |= 0x80;
            for (let i = offset; i < count; i++) {
                partialResult <<= 8;
                partialResult |= view.getUint8(i);
            }
        }
        else {
            for (let i = count - 1; i >= offset; i--) {
                partialResult |= view.getUint8(i);
                partialResult <<= 8;
            }
            partialResult |= 0x80;
        }
    }
    else {
        partialResult = 0x80;
    }
    p0 += partialResult;
    p1 ^= p0;
    p0 = (p0 << 20) | (p0 >>> 12);
    p0 += p1;
    p1 = (p1 << 9) | (p1 >>> 23);
    p1 ^= p0;
    p0 = (p0 << 27) | (p0 >>> 5);
    p0 += p1;
    p1 = (p1 << 19) | (p1 >>> 13);
    p1 ^= p0;
    p0 = (p0 << 20) | (p0 >>> 12);
    p0 += p1;
    p1 = (p1 << 9) | (p1 >>> 23);
    p1 ^= p0;
    p0 = (p0 << 27) | (p0 >>> 5);
    p0 += p1;
    p1 = (p1 << 19) | (p1 >>> 13);
    return (p1 ^ p0) >> 0;
}
