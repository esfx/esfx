declare namespace module {
    const mem: WebAssembly.Memory;
    function hashBigInt64(x: bigint): number;
    function hashBigInt64Array(ptr: number, len: number): number;
}

declare const _module: typeof module | undefined;
export default _module;