const MAX_INT32 = (2 ** 31) - 1;
const MIN_INT32 = ~MAX_INT32;
const MAX_UINT32 = (2 ** 32) - 1;
const MIN_UINT32 = 0;
const float64View = new DataView(new ArrayBuffer(8));

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
    float64View.setFloat64(0, x);
    return float64View.getInt32(0, /*littleEndian*/ true) ^ float64View.getInt32(4, /*littleEndian*/ true);
}

export function hashNumberByTypeUsingDataView(x: number) {
    return isInt32(x) ? hashInt32(x) :
        isUint32(x) ? hashUint32(x) :
        hashFloat64(x);
}