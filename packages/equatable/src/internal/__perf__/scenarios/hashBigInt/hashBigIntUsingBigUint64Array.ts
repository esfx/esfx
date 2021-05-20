const ZERO = BigInt(0);
const UINT32_MASK = BigInt(0xffffffff);
const SIZE_INT32 = BigInt(32);

const buffer = new ArrayBuffer(8);
const bigUint64Array = new BigUint64Array(buffer);
const uint32Array = new Uint32Array(buffer);

const endianness = (() => {
    const buffer = new ArrayBuffer(2);
    const uint8Array = new Uint8Array(buffer);
    const uint16Array = new Uint16Array(buffer);
    uint8Array[0] = 0x01;
    uint8Array[1] = 0x02;
    return uint16Array[0] === 0x0102 ? "big-endian" : "little-endian";
})();

const lo = endianness === "little-endian" ? 0 : 1;

export function hashBigIntUsingBigUint64Array(x: bigint) {
    if (x === ZERO) return 0;
    const negative = x < ZERO;
    if (negative) x = -x;
    let hash = negative ? -1 : 0;
    while (x > ZERO) {
        bigUint64Array[0] = x & UINT32_MASK;
        hash = ((hash << 7) | (hash >>> 25)) ^ uint32Array[lo];
        x = x >> SIZE_INT32;
    }
    return hash;
}

export function hashBigIntUsingBigUint64ArrayAndAsUintN(x: bigint) {
    if (x === ZERO) return 0;
    const negative = x < ZERO;
    if (negative) x = -x;
    let hash = negative ? -1 : 0;
    while (x > ZERO) {
        bigUint64Array[0] = BigInt.asUintN(32, x);
        hash = ((hash << 7) | (hash >>> 25)) ^ uint32Array[lo];
        x = x >> SIZE_INT32;
    }
    return hash;
}
