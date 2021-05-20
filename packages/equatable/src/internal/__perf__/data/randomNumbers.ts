import { randomInt } from "crypto";
import { inRange } from "./range";

export const SAMPLE_SIZE = 10_000;

const MAX_INT32 = (2 ** 31) - 1;
const MAX_UINT32 = (2 ** 32) - 1;
const PERCENT_UINT32 = [0, 0.15] as const;
const PERCENT_INT32 = [0.15, 0.30] as const;

export function randomInt32() {
    return randomInt(~MAX_INT32, MAX_INT32);
}

export function randomUint32() {
    return randomInt(0, MAX_UINT32);
}

export function randomFloat64() {
    return Math.random() * MAX_INT32;
}

export function generateRandomNumbers() {
    const randomNumbers = new Float64Array(SAMPLE_SIZE);
    for (let i = 0; i < SAMPLE_SIZE; i++) {
        const p = Math.random();
        randomNumbers[i] =
            inRange(p, PERCENT_UINT32) ? randomUint32() :
            inRange(p, PERCENT_INT32) ? randomInt32() :
            randomFloat64();
    }
    return randomNumbers;
}
