import hashCode from "./hashWasm.wat";

const { mem, hashBigInt64, hashBigInt64Array } = hashCode!;

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const SHIFT_I64 = BigInt(2) ** BigInt(64);
const MAX_I64 = BigInt(2) ** BigInt(63) - BigInt(1);
const MIN_I64 = ~MAX_I64;

let memory = new BigUint64Array(mem.buffer);

function grow(size: number) {
    if (mem.buffer.byteLength < size) {
        mem.grow(Math.ceil((size - mem.buffer.byteLength) / (64 * 1024)));
        memory = new BigUint64Array(mem.buffer);
    }
}

function encodeSignBit(x: bigint) {
    return x < ZERO ? ~x * TWO + ONE : x * TWO;
}

export function hashBigIntUsingWasmUnlessSmall(x: bigint) {
    if (x >= MIN_I64 && x <= MAX_I64) {
        return hashBigInt64(x);
    }
    x = encodeSignBit(x);
    let i = 0;
    while (x) {
        grow((i + 1) * 8);
        memory[i] = x;
        x -= memory[i];
        x /= SHIFT_I64;
        i++;
    }
    return hashBigInt64Array(0, i);
}

export function hashBigIntUsingWasm(x: bigint) {
    x = encodeSignBit(x);
    let i = 0;
    while (x) {
        grow((i + 1) * 8);
        memory[i] = x;
        x -= memory[i];
        x /= SHIFT_I64;
        i++;
    }
    return hashBigInt64Array(0, i);
}
