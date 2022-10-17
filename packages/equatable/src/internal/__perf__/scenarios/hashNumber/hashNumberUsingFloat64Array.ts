const buffer = new ArrayBuffer(8);
const float64Array = new Float64Array(buffer);
const int32Array = new Int32Array(buffer);

export function hashNumberUsingFloat64ArrayAlways(x: number) {
    float64Array[0] = x;
    return int32Array[0] ^ int32Array[1];
}

export function hashNumberUsingFloat64ArrayUnlessInt32OrUint32(x: number) {
    if ((x | 0) === x || x >>> 0 === x) return x | 0;
    float64Array[0] = x;
    return int32Array[0] ^ int32Array[1];
}
