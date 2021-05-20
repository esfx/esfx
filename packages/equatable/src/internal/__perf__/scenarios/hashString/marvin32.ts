import { randomInt } from "crypto";

const MAX_UINT32 = (2 ** 32) - 1;

export const seed_lo = randomInt(MAX_UINT32);
export const seed_hi = randomInt(MAX_UINT32);

const endianness = (() => {
    const buffer = new ArrayBuffer(2);
    const uint8Array = new Uint8Array(buffer);
    const uint16Array = new Uint16Array(buffer);
    uint8Array[0] = 0x01;
    uint8Array[1] = 0x02;
    return uint16Array[0] === 0x0102 ? "big-endian" : "little-endian";
})();

export function hashMarvin32DataView(data: ArrayBuffer, count: number, p0: number, p1: number) {
    const view = new DataView(data, 0, count);
    let offset = 0;
    process_uint32:
    if (count >= 4) {

        if (count >= 8) {
            // Main loop - read 8 bytes at a time.
            // The block function is unrolled 2x in this loop.

            let loopCount = Math.floor(count / 8);
            do {
                // Most x86 processors have two dispatch ports for reads, so we can read 2x 32-bit
                // values in parallel. We opt for this instead of a single 64-bit read since the
                // typical use case for Marvin32 is computing String hash codes, and the particular
                // layout of String instances means the starting data is never 8-byte aligned when
                // running in a 64-bit process.

                // One block round for each of the 32-bit integers we just read, 2x rounds total.
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

                // Bump the data reference pointer and decrement the loop count.

                offset += 8;

                // Decrementing by 1 every time and comparing against zero allows the JIT to produce
                // better codegen compared to a standard 'for' loop with an incrementing counter.
                // Requires https://github.com/dotnet/runtime/issues/6794 to be addressed first
                // before we can realize the full benefits of this.
            }
            while (--loopCount > 0);

            // n.b. We've not been updating the original 'count' parameter, so its actual value is
            // still the original data length. However, we can still rely on its least significant
            // 3 bits to tell us how much data remains (0 .. 7 bytes) after the loop above is
            // completed.

            if ((count & 0b0100) === 0) {
                break process_uint32;
            }
        }

        // If after finishing the main loop we still have 4 or more leftover bytes, or if we had
        // 4 .. 7 bytes to begin with and couldn't enter the loop in the first place, we need to
        // consume 4 bytes immediately and send them through one round of the block function.

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

    // Now that we've computed the final partial result, merge it in and run two rounds of
    // the block function to finish out the Marvin algorithm.

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

export function hashMarvin32TypedArray(data: ArrayBuffer, count: number, p0: number, p1: number) {
    const uint32ByteLength = count - count % 4;
    process_uint32:
    if (count >= 4) {
        const uint32Array = new Uint32Array(data, 0, uint32ByteLength / 4);
        let uint32Offset = 0;

        if (count >= 8) {
            // Main loop - read 8 bytes at a time.
            // The block function is unrolled 2x in this loop.

            let loopCount = Math.floor(count / 8);
            do {
                // Most x86 processors have two dispatch ports for reads, so we can read 2x 32-bit
                // values in parallel. We opt for this instead of a single 64-bit read since the
                // typical use case for Marvin32 is computing String hash codes, and the particular
                // layout of String instances means the starting data is never 8-byte aligned when
                // running in a 64-bit process.

                // One block round for each of the 32-bit integers we just read, 2x rounds total.
                p0 += uint32Array[uint32Offset++];
                p1 ^= p0;
                p0 = (p0 << 20) | (p0 >>> 12);
                p0 += p1;
                p1 = (p1 << 9) | (p1 >>> 23);
                p1 ^= p0;
                p0 = (p0 << 27) | (p0 >>> 5);
                p0 += p1;
                p1 = (p1 << 19) | (p1 >>> 13);

                p0 += uint32Array[uint32Offset++];
                p1 ^= p0;
                p0 = (p0 << 20) | (p0 >>> 12);
                p0 += p1;
                p1 = (p1 << 9) | (p1 >>> 23);
                p1 ^= p0;
                p0 = (p0 << 27) | (p0 >>> 5);
                p0 += p1;
                p1 = (p1 << 19) | (p1 >>> 13);

                // Bump the data reference pointer and decrement the loop count.

                // Decrementing by 1 every time and comparing against zero allows the JIT to produce
                // better codegen compared to a standard 'for' loop with an incrementing counter.
                // Requires https://github.com/dotnet/runtime/issues/6794 to be addressed first
                // before we can realize the full benefits of this.
            }
            while (--loopCount > 0);

            // n.b. We've not been updating the original 'count' parameter, so its actual value is
            // still the original data length. However, we can still rely on its least significant
            // 3 bits to tell us how much data remains (0 .. 7 bytes) after the loop above is
            // completed.

            if ((count & 0b0100) === 0) {
                break process_uint32;
            }
        }

        // If after finishing the main loop we still have 4 or more leftover bytes, or if we had
        // 4 .. 7 bytes to begin with and couldn't enter the loop in the first place, we need to
        // consume 4 bytes immediately and send them through one round of the block function.

        p0 += uint32Array[uint32Offset++];
        p1 ^= p0;
        p0 = (p0 << 20) | (p0 >>> 12);
        p0 += p1;
        p1 = (p1 << 9) | (p1 >>> 23);
        p1 ^= p0;
        p0 = (p0 << 27) | (p0 >>> 5);
        p0 += p1;
        p1 = (p1 << 19) | (p1 >>> 13);
    }

    let partialResult = 0;
    if (uint32ByteLength !== count) {
        const uint8Array = new Uint8Array(data, uint32ByteLength);
        if (endianness === "little-endian") {
            partialResult |= 0x80;
            for (let i = 0; i < uint8Array.byteLength; i++) {
                partialResult <<= 8;
                partialResult |= uint8Array[i];
            }
        }
        else {
            for (let i = uint8Array.byteLength - 1; i >= 0; i--) {
                partialResult |= uint8Array[i];
                partialResult <<= 8;
            }
            partialResult |= 0x80;
        }
    }
    else {
        partialResult = 0x80;
    }

    // Now that we've computed the final partial result, merge it in and run two rounds of
    // the block function to finish out the Marvin algorithm.

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
