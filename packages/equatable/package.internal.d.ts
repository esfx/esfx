// These match the imports map in package.json

/* @internal */
declare module "#hash/native" {
    function hashBigInt(x: bigint): number;
    function hashNumber(x: number): number;
    function hashString(x: string): number;
    function hashSymbol(x: symbol): number;
    function hashObject(x: object): number;
}

/* @internal */ declare module "#hash/bigint" { function hashBigInt(x: bigint): number; }
/* @internal */ declare module "#hash/number" { function hashNumber(x: number): number; }
/* @internal */ declare module "#hash/string" { function hashString(x: string): number; }
/* @internal */ declare module "#hash/symbol" { function hashSymbol(x: symbol): number; }
/* @internal */ declare module "#hash/object" { function hashObject(x: object): number; }
