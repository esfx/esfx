const MAX_INT32 = (2 ** 31) - 1;
const MIN_INT32 = ~MAX_INT32;
const MAX_UINT32 = (2 ** 32) - 1;
const MIN_UINT32 = 0;
const buffer = new ArrayBuffer(8);
const float64Array = new Float64Array(buffer);
const int32Array = new Int32Array(buffer);

function isInt32(x: number) {
    return Number.isInteger(x)
        && x >= MIN_INT32
        && x <= MAX_INT32;
}

function hashInt32(x: number) {
    return x;
}

function isUint32(x: number) {
    return Number.isInteger(x)
        && x >= MIN_UINT32
        && x <= MAX_UINT32;
}

function hashUint32(x: number) {
    return x >> 0;
}

function hashFloat64(x: number) {
    float64Array[0] = x;
    return int32Array[0] ^ int32Array[1];
}

export function hashNumberByTypeUsingTypedArray(x: number) {
    return isInt32(x) ? hashInt32(x) :
        isUint32(x) ? hashUint32(x) :
        hashFloat64(x);
}