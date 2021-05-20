import { randomUint32 } from "./randomNumbers";
import { inRange, Range } from "./range";

export const SAMPLE_SIZE = 10_000;

const MAX_BIGINT64 = (BigInt(2) ** BigInt(63)) - BigInt(1);
const MAX_BIGUINT64 = (BigInt(2) ** BigInt(64)) - BigInt(1);
const ZERO = BigInt(0);
const SIZE_INT32 = BigInt(32);
const SIZE_INT64 = BigInt(64);
const PERCENT_UINT64: Range = [0, 0.50, "[)"];
const PERCENT_INT64: Range = [0.50, 0.80, "[)"];
const PERCENT_NEGATIVE: Range = [0, 0.30, "[)"];

export function randomBigInt64() {
    const negative = inRange(Math.random(), PERCENT_NEGATIVE);
    const lo = BigInt(randomUint32());
    const hi = BigInt(randomUint32());
    let value = (hi << SIZE_INT32) | lo;
    if (negative && value > ZERO) value = -value;
    if (value < ~MAX_BIGINT64) return ~MAX_BIGINT64;
    if (value > MAX_BIGINT64) return MAX_BIGINT64;
    return value;
}

export function randomBigUint64() {
    const lo = BigInt(randomUint32());
    const hi = BigInt(randomUint32());
    let value = (hi << SIZE_INT32) | lo;
    if (value < ZERO) value = -value;
    if (value > MAX_BIGUINT64) return MAX_BIGINT64;
    return value;
}

export function randomLargeBigInt() {
    const negative = inRange(Math.random(), PERCENT_NEGATIVE);
    const lo = randomBigUint64();
    const hi = randomBigUint64();
    let value = (hi << SIZE_INT64) | lo;
    if (negative && value > ZERO) value = -value;
    return value;
}

export function generateRandomBigInts() {
    const randomNumbers = [BigInt(0)];
    for (let i = 0; i < SAMPLE_SIZE; i++) {
        const p = Math.random();
        randomNumbers[i] =
            inRange(p, PERCENT_UINT64) ? randomBigUint64() :
            inRange(p, PERCENT_INT64) ? randomBigInt64() :
            randomLargeBigInt();
    }
    return randomNumbers;
}
