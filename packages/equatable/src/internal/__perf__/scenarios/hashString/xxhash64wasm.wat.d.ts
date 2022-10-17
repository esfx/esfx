export declare const moduleBinary: Uint8Array;

declare namespace module {
    const mem: WebAssembly.Memory;
    function xxh64(ptr: number, len: number, seed: bigint): bigint;
}

declare const _module: typeof module | undefined;
export default _module;