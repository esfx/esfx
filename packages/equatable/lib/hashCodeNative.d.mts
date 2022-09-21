// These match the imports map in package.json

/* @internal */
export function hashBigInt(x: bigint): number;
/* @internal */
export function hashNumber(x: number): number;
/* @internal */
export function hashString(x: string): number;
/* @internal */
export function hashSymbol(x: symbol): number;
/* @internal */
export function hashObject(x: object): number;
/* @internal */
export function hashUnknown(x: unknown): number;
