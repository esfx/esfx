/*!
   Copyright 2019 Ron Buckton

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import { Comparer } from '@esfx/equatable';

const binaryOperators = {
    "+": add,
    "-": sub,
    "*": mul,
    "**": pow,
    "/": div,
    "%": mod,
    "<<": shl,
    ">>": sar,
    ">>>": shr,
    "&": bitand,
    "|": bitor,
    "^": bitxor,
    "&&": and,
    "||": or,
    "??": coalesce,
    "<": lt,
    "<=": le,
    ">": gt,
    ">=": ge,
    "==": weq,
    "!=": wne,
    "===": eq,
    "!==": ne,
};

const unaryOperators = {
    "+": plus,
    "-": neg,
    "~": bitnot,
    "!": not,
};

const unspecifiedOperators = {
    ...binaryOperators,
    ...unaryOperators,
    "+": addOrPlus,
    "-": subOrNeg,
};

export type BinaryOperators = typeof binaryOperators;
export type UnaryOperators = typeof unaryOperators;
export type Operators = typeof unspecifiedOperators;

export function operator<K extends keyof Operators>(op: K): Operators[K];
export function operator<K extends keyof UnaryOperators>(op: K, arity: 1): UnaryOperators[K];
export function operator<K extends keyof BinaryOperators>(op: K, arity: 2): BinaryOperators[K];
export function operator<K extends keyof Operators>(op: K, arity?: 1 | 2) {
    const f =
        arity === 1 ? unaryOperators[op as keyof UnaryOperators] :
        arity === 2 ? binaryOperators[op as keyof BinaryOperators] :
        unspecifiedOperators[op];
    if (!f) throw new TypeError("Invalid operator");
    return f;
}

function addOrPlus(x: number, y: number): number;
function addOrPlus(x: bigint, y: bigint): bigint;
function addOrPlus(x: string, y: string | number | boolean | object | null | undefined): string;
function addOrPlus(x: string | number | boolean | object | null | undefined, y: string): string;
function addOrPlus(x: number): number;
function addOrPlus(x: any, y?: any): number | string | bigint {
    return arguments.length === 1 ? plus(x) : add(x, y);
}

/**
 * Add/concat (i.e. `x + y`).
 */
export function add(x: number, y: number): number;
export function add(x: bigint, y: bigint): bigint;
export function add(x: string, y: string | number | boolean | object | null | undefined): string;
export function add(x: string | number | boolean | object | null | undefined, y: string): string;
export function add(x: any, y: any) {
    return x + y;
}

function subOrNeg(x: number, y: number): number;
function subOrNeg(x: bigint, y: bigint): bigint;
function subOrNeg(x: number): number;
function subOrNeg(x: bigint): bigint;
function subOrNeg(x: any, y?: any): any {
    return arguments.length === 1 ? neg(x) : sub(x, y);
}

/**
 * Subtract (i.e. `x - y`).
 */
export function sub(x: number, y: number): number;
export function sub(x: bigint, y: bigint): bigint;
export function sub(x: any, y: any): number | bigint {
    return x - y;
}

/**
 * Multiply (i.e. `x * y`).
 */
export function mul(x: number, y: number): number;
export function mul(x: bigint, y: bigint): bigint;
export function mul(x: any, y: any): any {
    return x * y;
}

/**
 * Exponentiate (i.e. `x ** y`).
 */
export function pow(x: number, y: number): number;
export function pow(x: bigint, y: bigint): bigint;
export function pow(x: any, y: any): any {
    return x ** y;
}

/**
 * Divide (i.e. `x / y`).
 */
export function div(x: number, y: number): number;
export function div(x: bigint, y: bigint): bigint;
export function div(x: any, y: any): any {
    return x / y;
}

/**
 * Modulo (i.e. `x % y`).
 */
export function mod(x: number, y: number): number;
export function mod(x: bigint, y: bigint): bigint;
export function mod(x: any, y: any): any {
    return x % y;
}

/**
 * Left shift (i.e. `x << n`).
 */
export function shl(x: number, n: number): number;
export function shl(x: bigint, n: bigint): bigint;
export function shl(x: any, n: any): any {
    return x << n;
}

export { shl as sal };

/**
 * Signed right shift (i.e. `x >> n`).
 */
export function sar(x: number, n: number): number;
export function sar(x: bigint, n: bigint): bigint;
export function sar(x: any, n: any): any {
    return x >> n;
}

/**
 * Unsigned right shift (i.e. `x >>> n`).
 */
export function shr(x: number, n: number): number;
export function shr(x: bigint, n: bigint): bigint;
export function shr(x: any, n: any): any {
    return x >>> n;
}

/**
 * Negate (i.e. `-x`).
 */
export function neg(x: number): number;
export function neg(x: bigint): bigint;
export function neg(x: any): any {
    return -x;
}

/**
 * Unary plus (i.e. `+x`).
 */
export function plus(x: number) {
    return +x;
}

/**
 * Bitwise AND (i.e. `x & y`).
 */
export function bitand(x: number, y: number): number;
export function bitand(x: bigint, y: bigint): bigint;
export function bitand(x: any, y: any): any {
    return x & y;
}

/**
 * Bitwise OR (i.e. `x | y`).
 */
export function bitor(x: number, y: number): number;
export function bitor(x: bigint, y: bigint): bigint;
export function bitor(x: any, y: any): any {
    return x | y;
}

/**
 * Bitwise XOR (i.e. `x ^ y`).
 */
export function bitxor(x: number, y: number): number;
export function bitxor(x: bigint, y: bigint): bigint;
export function bitxor(x: any, y: any): any {
    return x ^ y;
}

/**
 * Bitwise NOT (i.e. `~x`).
 */
export function bitnot(x: number): number;
export function bitnot(x: bigint): bigint;
export function bitnot(x: any): any {
    return ~x;
}

/**
 * Logical AND (i.e. `x && y`).
 */
export function and(x: boolean, y: boolean) {
    return x && y;
}

/**
 * Logical OR (i.e. `x || y`).
 */
export function or(x: boolean, y: boolean) {
    return x || y;
}

/**
 * Logical XOR (i.e. `x ? !y : y`).
 */
export function xor(x: boolean, y: boolean) {
    return x ? !y : y;
}

/**
 * Logical NOT (i.e. `!x`).
 */
export function not(x: boolean) {
    return !x;
}

/**
 * Nullish Coalesce (i.e. `x ?? y `).
 */
export function coalesce<T, U>(x: T, y: U): NonNullable<T> | U {
    // TODO: Not supported by jest/ts-jest?
    // return x ?? y;
    return x !== undefined && x !== null ? x! : y;
}

/**
 * Relational greater-than (i.e. `x > y`).
 */
export function gt<T>(x: T, y: T) {
    return Comparer.defaultComparer.compare(x, y) > 0;
}

/**
 * Creates a copy of `gt` for a specific `Comparer`.
 */
gt.withComparer = <T>(comparer: Comparer<T>): (x: T, y: T) => boolean => (x, y) => comparer.compare(x, y) > 0;

/**
 * Relational greater-than-equals (i.e. `x >= y`).
 */
export function ge<T>(x: T, y: T) {
    return Comparer.defaultComparer.compare(x, y) >= 0;
}

/**
 * Creates a copy of `ge` for a specific `Comparer`.
 */
ge.withComparer = <T>(comparer: Comparer<T>): (x: T, y: T) => boolean => (x, y) => comparer.compare(x, y) >= 0;


/**
 * Relational less-than (i.e. `x < y`).
 */
export function lt<T>(x: T, y: T) {
    return Comparer.defaultComparer.compare(x, y) < 0;
}

/**
 * Creates a copy of `lt` for a specific `Comparer`.
 */
lt.withComparer = <T>(comparer: Comparer<T>): (x: T, y: T) => boolean => (x, y) => comparer.compare(x, y) < 0;


/**
 * Relational less-than-equals (i.e. `x <= y`).
 */
export function le<T>(x: T, y: T) {
    return Comparer.defaultComparer.compare(x, y) <= 0;
}

/**
 * Creates a copy of `le` for a specific `Comparer`.
 */
le.withComparer = <T>(comparer: Comparer<T>): (x: T, y: T) => boolean => (x, y) => comparer.compare(x, y) <= 0;

/**
 * Relational equals (i.e. `x >= y && x <= y`).
 */
export function req<T>(x: T, y: T) {
    return Comparer.defaultComparer.compare(x, y) === 0;
}

/**
 * Creates a copy of `eq` for a specific `Comparer`.
 */
req.withComparer = <T>(comparer: Comparer<T>): (x: T, y: T) => boolean => (x, y) => comparer.compare(x, y) === 0;

/**
 * Weak equality (i.e. `x == y`).
 */
export function weq<T>(x: T, y: T) {
    return x == y;
}

/**
 * Strict equality (i.e. `x === y`).
 */
export function eq<T>(x: T, y: T) {
    return x === y;
}

/**
 * Relational not-equals (i.e. `x < y || x > y`).
 */
export function rne<T>(x: T, y: T) {
    return Comparer.defaultComparer.compare(x, y) !== 0;
}

/**
 * Creates a copy of `ne` for a specific `Comparer`.
 */
rne.withComparer = <T>(comparer: Comparer<T>): (x: T, y: T) => boolean => (x, y) => comparer.compare(x, y) !== 0;

/**
 * Weak inequality (i.e. `x != y`).
 */
export function wne<T>(x: T, y: T) {
    return x != y;
}

/**
 * Strict equality (i.e. `x !== y`).
 */
export function ne<T>(x: T, y: T) {
    return x !== y;
}

/**
 * Relational minimum (i.e. `x <= y ? x : y`).
 */
export function min<T>(x: T, y: T) {
    return Comparer.defaultComparer.compare(x, y) <= 0 ? x : y;
}

/**
 * Creates a copy of `min` for a specific `Comparer`.
 */
min.withComparer = <T>(comparer: Comparer<T>): (x: T, y: T) => T => (x, y) => comparer.compare(x, y) <= 0 ? x : y;

/**
 * Relational minimum using a provided selector (i.e. `f(x) <= f(y) ? x : y`).
 */
export function minBy<T, K>(x: T, y: T, f: (v: T) => K) {
    return Comparer.defaultComparer.compare(f(x), f(y)) <= 0 ? x : y;
}

/**
 * Creates a copy of `minBy` for a specific `Comparer`.
 */
minBy.withComparer = <K>(comparer: Comparer<K>): <T>(x: T, y: T, f: (v: T) => K) => T => (x, y, f) => comparer.compare(f(x), f(y)) <= 0 ? x : y;

/**
 * Relational maximum (i.e. `x >= y ? x : y`).
 */
export function max<T>(x: T, y: T) {
    return Comparer.defaultComparer.compare(x, y) >= 0 ? x : y;
}

/**
 * Creates a copy of `min` for a specific `Comparer`.
 */
max.withComparer = <K>(comparer: Comparer<K>): (x: K, y: K) => K => (x, y) => comparer.compare(x, y) >= 0 ? x : y;

/**
 * Relational maximum using a provided selector (i.e. `f(x) <= f(y) ? x : y`).
 */
export function maxBy<T, K>(x: T, y: T, f: (v: T) => K) {
    return Comparer.defaultComparer.compare(f(x), f(y)) >= 0 ? x : y;
}

/**
 * Creates a copy of `maxBy` for a specific `Comparer`.
 */
maxBy.withComparer = <K>(comparer: Comparer<K>): <T>(x: T, y: T, f: (v: T) => K) => T => (x, y, f) => comparer.compare(f(x), f(y)) >= 0 ? x : y;
