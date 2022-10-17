const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const MAX_I32 = BigInt(2) ** BigInt(31) - BigInt(1);
const MIN_I32 = ~MAX_I32;
const SIZE_I64 = BigInt(64);

const buffer = new ArrayBuffer(8);
const bigUint64Array = new BigUint64Array(buffer);
const uint32Array = new Uint32Array(buffer);

export function hashBigIntUsingBigUint64ArrayUnlessSmall(x: bigint) {
    if (x === ZERO) return 0;
    if (x >= MIN_I32 && x <= MAX_I32) return Number(x);
    x = x < ZERO ? ~x * TWO + ONE : x * TWO;
    let hash = 0;
    while (x) {
        bigUint64Array[0] = x;
        x = x >> SIZE_I64;
        hash = ((hash << 7) | (hash >>> 25)) ^ (uint32Array[0] ^ uint32Array[1]);
    }
    return hash | 0;
}

export function hashBigIntUsingBigUint64Array(x: bigint) {
    x = x < ZERO ? ~x * TWO + ONE : x * TWO;
    let hash = 0;
    while (x) {
        bigUint64Array[0] = x;
        x = x >> SIZE_I64;
        hash = ((hash << 7) | (hash >>> 25)) ^ (uint32Array[0] ^ uint32Array[1]);
    }
    return hash | 0;
}
