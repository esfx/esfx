const buffer = new ArrayBuffer(8);
const float64Array = new Float64Array(buffer);
const int32Array = new Int32Array(buffer);

export function hashNumberByTypeExperiment1(x: number) {
    return x >> 0 === x || x >>> 0 === x ? x >> 0 : (float64Array[0] = x, int32Array[0] ^ int32Array[1]);
}

export function hashNumberByTypeExperiment2(x: number) {
    return (x | 0) === x || x >>> 0 === x ? (x | 0) : (float64Array[0] = x, int32Array[0] ^ int32Array[1]);
}

export function hashNumberByTypeExperiment3(x: number) {
    const i = x | 0;
    return i === x || x >>> 0 === x ? i : (float64Array[0] = x, int32Array[0] ^ int32Array[1]);
}