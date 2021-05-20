const ZERO = BigInt(0);
const UINT32_MASK = BigInt(0xffffffff);
const SIZE_INT32 = BigInt(32);

export function hashBigIntUsingNumberConstructor(x: bigint) {
    if (x === ZERO) return 0;
    const negative = x < ZERO;
    if (negative) x = -x;
    let hash = negative ? -1 : 0;
    while (x > ZERO) {
        hash = ((hash << 7) | (hash >>> 25)) ^ Number(x & UINT32_MASK);
        x = x >> SIZE_INT32;
    }
    return hash;
}

export function hashBigIntUsingNumberConstructorAndAsUintN(x: bigint) {
    if (x === ZERO) return 0;
    const negative = x < ZERO;
    if (negative) x = -x;
    let hash = negative ? -1 : 0;
    while (x > ZERO) {
        hash = ((hash << 7) | (hash >>> 25)) ^ Number(BigInt.asUintN(32, x));
        x = x >> SIZE_INT32;
    }
    return hash;
}
