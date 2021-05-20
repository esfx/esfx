const buffer = new ArrayBuffer(8);
const float64Array = new Float64Array(buffer);
const int32Array = new Int32Array(buffer);

export function hashNumberByFloat64TypedArrayOnly(x: number) {
    float64Array[0] = x;
    return int32Array[0] ^ int32Array[1];
}
