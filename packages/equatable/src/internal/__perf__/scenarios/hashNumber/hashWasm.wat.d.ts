declare namespace module {
    function hashFloat64(x: number): number;
    function hashNumber(x: number): number;
}

declare const _module: typeof module | undefined;
export default _module;