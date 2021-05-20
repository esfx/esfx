const float64View = new DataView(new ArrayBuffer(8));

export function hashNumberByFloat64DataViewOnly(x: number) {
    float64View.setFloat64(0, x);
    return float64View.getInt32(0, /*littleEndian*/ true) ^ float64View.getInt32(4, /*littleEndian*/ true);
}