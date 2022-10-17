const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const MAX_I32 = BigInt(2) ** BigInt(31) - BigInt(1);
const MIN_I32 = ~MAX_I32;
const UINT32_MASK = BigInt(0xffffffff);
const SIZE_INT32 = BigInt(32);

export function hashBigIntUsingNumberConstructor(x: bigint) {
    if (x === ZERO) return 0;
    if (x >= MIN_I32 && x <= MAX_I32) return Number(x);
    x = x < ZERO ? ~x * TWO + ONE : x * TWO;
    let hash = 0;
    while (x > ZERO) {
        const lo = Number(x & UINT32_MASK);
        x = x >> SIZE_INT32;

        const hi = Number(x & UINT32_MASK);
        x = x >> SIZE_INT32;

        hash = ((hash << 7) | (hash >>> 25)) ^ (lo ^ hi);
    }
    return hash;
}

export function hashBigIntUsingNumberConstructorAndAsUintN(x: bigint) {
    if (x === ZERO) return 0;
    if (x >= MIN_I32 && x <= MAX_I32) return Number(x);
    x = x < ZERO ? ~x * TWO + ONE : x * TWO;
    let hash = 0;
    while (x > ZERO) {
        const lo = Number(BigInt.asUintN(32, x));
        x = x >> SIZE_INT32;

        const hi = Number(BigInt.asUintN(32, x));
        x = x >> SIZE_INT32;

        hash = ((hash << 7) | (hash >>> 25)) ^ (lo ^ hi);
    }
    return hash;
}
