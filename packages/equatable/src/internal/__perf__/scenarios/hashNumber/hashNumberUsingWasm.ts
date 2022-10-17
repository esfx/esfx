import hash from "./hashWasm.wat";

const { hashFloat64, hashNumber } = hash!;

export function hashNumberUsingWasm(x: number) {
    return hashNumber(x);
}

export function hashNumberUsingWasmAsFloat(x: number) {
    return hashFloat64(x);
}

export function hashNumberUsingWasmUnlessInt32(x: number) {
    return (x | 0) === x || x >>> 0 === x ? x | 0 : hashFloat64(x);
}
