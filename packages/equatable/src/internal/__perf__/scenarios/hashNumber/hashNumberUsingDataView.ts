const float64View = new DataView(new ArrayBuffer(8));

export function hashNumberUsingDataViewAlways(x: number) {
    float64View.setFloat64(0, x);
    return float64View.getInt32(0) ^ float64View.getInt32(4);
}

export function hashNumberUsingDataViewUnlessInt32OrUint32(x: number) {
    if ((x | 0) === x || x >>> 0 === x) return x | 0;
    float64View.setFloat64(0, x);
    return float64View.getInt32(0) ^ float64View.getInt32(4);
}
