/*!
   Copyright 2020 Ron Buckton

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

import { Comparer, Equaler } from "@esfx/equatable";
import /*#__INLINE__*/ { isMissing } from "@esfx/internal-guards";

/**
 * Throws the provided value.
 */
export function fail(value: unknown): never {
    throw value;
}

/**
 * Does nothing.
 */
export function noop(...args: any[]): unknown;
export function noop() {
}

/**
 * Returns the provided value.
 */
export function identity<T>(value: T) {
    return value;
}

/**
 * A function that always returns `true`.
 */
export function alwaysTrue(): true {
    return true;
}

export { alwaysTrue as T };
export { alwaysFalse as F };

/**
 * A function that always returns `false`.
 */
export function alwaysFalse(): false {
    return false;
}


/**
 * Returns a function that always throws the provided error.
 */
export function alwaysFail(error: unknown) {
    return () => fail(error);
}

/**
 * Returns a function that returns the provided value.
 */
export function always<T>(value: T) {
    return () => value;
}

export declare namespace always {
    export { alwaysTrue as true, alwaysFalse as false, alwaysFail as fail };
}

/** @internal */
export namespace always {
    always.true = alwaysTrue;
    always.false = alwaysFalse;
    always.fail = alwaysFail;
}

/**
 * Returns a function that produces a monotonically increasing number value each time it is called.
 */
export function incrementer(start = 0) {
    return () => start++;
}

export namespace incrementer {
    /**
     * Returns a function that produces a monotonically increasing number value each time it is called.
     */
    export function step(count: number, start = 0) {
        return count > 0 ? (() => { const x = start; return start += count, x; }) :
            fail(new Error("Count must be a positive number"));
    }
}

/**
 * Returns a function that produces a monotonically increasing number value each time it is called.
 */
export function decrementer(start = 0) {
    return () => start--;
}

export namespace decrementer {
    /**
     * Returns a function that produces a monotonically decreasing number value each time it is called.
     */
    export function step(count: number, start = 0) {
        return count > 0 ? (() => { const x = start; return start -= count, x; }) :
            fail(new Error("Count must be a positive number"));
    }
}

/**
 * Makes a "tuple" from the provided arguments.
 */
export function tuple<A extends readonly unknown[]>(...args: A): A {
    return args;
}

/**
 * Truncates a function's arguments to a fixed length.
 */
export function nAry<T, R>(f: (this: T) => R, length: 0): (this: T) => R;
export function nAry<T, A, R>(f: (this: T, a: A) => R, length: 1): (this: T, a: A) => R;
export function nAry<T, A, B, R>(f: (this: T, a: A, b: B) => R, length: 2): (this: T, a: A, b: B) => R;
export function nAry<T, A, B, C, R>(f: (this: T, a: A, b: B, c: C) => R, length: 3): (this: T, a: A, b: B, c: C) => R;
export function nAry<T, A, B, C, D, R>(f: (this: T, a: A, b: B, c: C, d: D) => R, length: 4): (this: T, a: A, b: B, c: C, d: D) => R;
export function nAry<T, A, R>(f: (this: T, ...args: A[]) => R, length: number): (this: T, ...args: A[]) => R {
    return Object.defineProperty(function(...args) { return f.call(this, ...args.slice(0, length)); }, "length", { configurable: true, value: length });
}

/**
 * Right-to-left composition of functions (i.e. `compose(g, f)` is `x => g(f(x))`).
 */
export function compose<A extends unknown[], B, C>(fb: (b: B) => C, fa: (...a: A) => B): (...a: A) => C;
export function compose<A extends unknown[], B, C, D>(fc: (c: C) => D, fb: (b: B) => C, fa: (...a: A) => B): (...a: A) => D;
export function compose<A extends unknown[], B, C, D, E>(fd: (d: D) => E, fc: (c: C) => D, fb: (b: B) => C, fa: (...a: A) => B): (...a: A) => E;
export function compose<A extends unknown[], B, C, D, E, F>(fe: (e: E) => F, fd: (d: D) => E, fc: (c: C) => D, fb: (b: B) => C, fa: (...a: A) => B): (...a: A) => F;
export function compose<T>(...rest: ((t: T) => T)[]): (t: T) => T;
export function compose<T>(...rest: ((t: T) => T)[]): (t: T) => T {
    const last = rest.pop()!;
    return (...args) => rest.reduceRight((a, f) => f(a), last(...args));
}

/**
 * Left-to-right composition of functions (i.e. `pipe(g, f)` is `x => f(g(x))`).
 */
export function pipe<A extends unknown[], B, C>(fa: (...a: A) => B, fb: (b: B) => C): (...a: A) => C;
export function pipe<A extends unknown[], B, C, D>(fa: (...a: A) => B, fb: (b: B) => C, fc: (c: C) => D): (...a: A) => D;
export function pipe<A extends unknown[], B, C, D, E>(fa: (...a: A) => B, fb: (b: B) => C, fc: (c: C) => D, fd: (d: D) => E): (...a: A) => E;
export function pipe<A extends unknown[], B, C, D, E, F>(fa: (...a: A) => B, fb: (b: B) => C, fc: (c: C) => D, fd: (d: D) => E, fe: (e: E) => F): (...a: A) => F;
export function pipe<A extends unknown[], B>(first: (...a: A) => B, ...rest: ((b: B) => B)[]): (...a: A) => B;
export function pipe<A extends unknown[], B>(first: (...a: A) => B, ...rest: ((b: B) => B)[]): (...a: A) => B {
    return (...args) => rest.reduce((a, f) => f(a), first(...args));
}

/**
 * Returns a function that reads the value of a property from an object provided as the function's first argument.
 * @param key The key for the property.
 */
export function property<K extends PropertyKey>(key: K): <T extends Record<K, T[K]>>(object: T) => T[K] {
    return object => object[key];
}

/**
 * Returns a function that writes a value to a property on an object provided as the function's first argument.
 * @param key The key for the property.
 */
export function propertyWriter<K extends PropertyKey>(key: K): <T extends Record<K, T[K]>>(object: T, value: T[K]) => void {
    return (object, value) => { object[key] = value; };
}

/**
 * Returns a function that invokes a method on the object provided as the function's first argument.
 *
 * ```ts
 * const fn = invoker("sayHello", "Bob");
 * fn({ sayHello(name) { console.log(`Hello, ${name}!`); } }); // prints: "Hello, Bob!"
 * ```
 */
export function invoker<K extends PropertyKey>(key: K): <T extends Record<K, (...args: A) => ReturnType<T[K]>>, A extends unknown[]>(object: T, ...args: A) => ReturnType<T[K]>;
export function invoker<K extends PropertyKey, A0>(key: K, a0: A0): <T extends Record<K, (a0: A0, ...args: A) => ReturnType<T[K]>>, A extends unknown[]>(object: T, ...args: A) => ReturnType<T[K]>;
export function invoker<K extends PropertyKey, A0, A1>(key: K, a0: A0, a1: A1): <T extends Record<K, (a0: A0, a1: A1, ...args: A) => ReturnType<T[K]>>, A extends unknown[]>(object: T, ...args: A) => ReturnType<T[K]>;
export function invoker<K extends PropertyKey, A0, A1, A2>(key: K, a0: A0, a1: A1, a2: A2): <T extends Record<K, (a0: A0, a1: A1, a2: A2, ...args: A) => ReturnType<T[K]>>, A extends unknown[]>(object: T, ...args: A) => ReturnType<T[K]>;
export function invoker<K extends PropertyKey, A0, A1, A2, A3>(key: K, a0: A0, a1: A1, a2: A2, a3: A3): <T extends Record<K, (a0: A0, a1: A1, a2: A2, a3: A3, ...args: A) => ReturnType<T[K]>>, A extends unknown[]>(object: T, ...args: A) => ReturnType<T[K]>;
export function invoker<K extends PropertyKey, A extends unknown[]>(key: K, ...args: A): <T extends Record<K, (...args: A) => ReturnType<T[K]>>>(object: T) => ReturnType<T[K]>;
export function invoker<K extends PropertyKey, AX>(key: K, ...args: AX[]): <T extends Record<K, (...args: AX[]) => ReturnType<T[K]>>>(object: T, ...args: AX[]) => ReturnType<T[K]>;
export function invoker<K extends PropertyKey, AX>(key: K, ...args: AX[]): <T extends Record<K, (...args: AX[]) => ReturnType<T[K]>>>(object: T, ...args: AX[]) => ReturnType<T[K]> {
    return (object, ...rest) => object[key](...args, ...rest);
}

/**
 * Returns a function that calls the function provided as its first argument.
 *
 * ```ts
 * const fn = caller(1, 2);
 * fn((a, b) => a + b); // 3
 * ```
 */
export function caller(): <R, A extends unknown[]>(func: (...args: A) => R, ...args: A) => R;
export function caller<A0>(a0: A0): <R, A extends unknown[]>(func: (a0: A0, ...args: A) => R, ...args: A) => R;
export function caller<A0, A1>(a0: A0, a1: A1): <R, A extends unknown[]>(func: (a0: A0, a1: A1, ...args: A) => R, ...args: A) => R;
export function caller<A0, A1, A2>(a0: A0, a1: A1, a2: A2): <R, A extends unknown[]>(func: (a0: A0, a1: A1, a2: A2, ...args: A) => R, ...args: A) => R;
export function caller<A0, A1, A2, A3>(a0: A0, a1: A1, a2: A2, a3: A3): <R, A extends unknown[]>(func: (a0: A0, a1: A1, a2: A2, a3: A3, ...args: A) => R, ...args: A) => R;
export function caller<A extends unknown[]>(...args: A): <R>(func: (...args: A) => R) => R;
export function caller<AX>(...args: AX[]): <R>(func: (...args: AX[]) => R, ...args: AX[]) => R;
export function caller<AX>(...args: AX[]): <R>(func: (...args: AX[]) => R, ...args: AX[]) => R {
    return (func, ...rest) => func(...args, ...rest);
}

/**
 * Returns a function that constructs an instance from a constructor provided as its first argument.
 *
 * ```ts
 * const fn = allocator("Bob");
 * class Person {
 *   constructor(name) { this.name = name; }
 * }
 * class Dog {
 *   constructor(owner) { this.owner = owner; }
 * }
 * fn(Person).name; // "Bob"
 * fn(Dog).owner; // "Bob"
 * ```
 */
export function allocator(): <R, A extends unknown[]>(ctor: new (...args: A) => R, ...args: A) => R;
export function allocator<A0>(a0: A0): <R, A extends unknown[]>(ctor: new (a0: A0, ...args: A) => R, ...args: A) => R;
export function allocator<A0, A1>(a0: A0, a1: A1): <R, A extends unknown[]>(ctor: new (a0: A0, a1: A1, ...args: A) => R, ...args: A) => R;
export function allocator<A0, A1, A2>(a0: A0, a1: A1, a2: A2): <R, A extends unknown[]>(ctor: new (a0: A0, a1: A1, a2: A2, ...args: A) => R, ...args: A) => R;
export function allocator<A0, A1, A2, A3>(a0: A0, a1: A1, a2: A2, a3: A3): <R, A extends unknown[]>(ctor: new (a0: A0, a1: A1, a2: A2, a3: A3, ...args: A) => R, ...args: A) => R;
export function allocator<A extends unknown[]>(...args: A): <R>(ctor: new (...args: A) => R) => R;
export function allocator<AX>(...args: AX[]): <R>(ctor: new (...args: AX[]) => R, ...args: AX[]) => R;
export function allocator<AX>(...args: AX[]): <R>(ctor: new (...args: AX[]) => R, ...args: AX[]) => R {
    return (ctor, ...rest) => new ctor(...args, ...rest);
}

/**
 * Returns a function that constructs an instance of the provided constructor.
 *
 * ```ts
 * class Point {
 *   constructor(x, y) {
 *     this.x = x;
 *     this.y = y;
 *   }
 * }
 * const fn = factory(Point);
 * fn(1, 2); // Point { x: 1, y: 2 }
 * fn(3, 4); // Point { x: 3, y: 4 }
 * ```
 */
export function factory<A extends unknown[], R>(ctor: new (...args: A) => R): (...args: A) => R;
export function factory<A0, A extends unknown[], R>(ctor: new (a0: A0, ...args: A) => R, a0: A0): (...args: A) => R;
export function factory<A0, A1, A extends unknown[], R>(ctor: new (a0: A0, a1: A1, ...args: A) => R, a0: A0, a1: A1): (...args: A) => R;
export function factory<A0, A1, A2, A extends unknown[], R>(ctor: new (a0: A0, a1: A1, a2: A2, ...args: A) => R, a0: A0, a1: A1, a2: A2): (...args: A) => R;
export function factory<A0, A1, A2, A3, A extends unknown[], R>(ctor: new (a0: A0, a1: A1, a2: A2, a3: A3, ...args: A) => R, a0: A0, a1: A1, a2: A2, a3: A3): (...args: A) => R;
export function factory<A extends unknown[], R>(ctor: new (...args: A) => R, ...args: A): () => R;
export function factory<AX, R>(ctor: new (...args: AX[]) => R, ...args: AX[]): (...args: AX[]) => R;
export function factory<AX, R>(ctor: new (...args: AX[]) => R, ...args: AX[]): (...args: AX[]) => R {
    return (...rest) => new ctor(...args, ...rest);
}

/**
 * Returns a function that calls the provided function, but swaps the first and second arguments.
 *
 * ```ts
 * function compareNumbers(a, b) { return a - b };
 * [3, 1, 2].sort(compareNumbers); // [1, 2, 3]
 * [3, 1, 2].sort(flip(compareNumbers)); // [3, 2, 1]
 * ```
 */
export function flip<A, B, C extends unknown[], R>(f: (a: A, b: B, ...c: C) => R): (b: B, a: A, ...c: C) => R {
    return (b, a, ...c) => f(a, b, ...c);
}

function recursiveLazy(): never {
    throw new Error("Lazy factory recursively references itself during its own evaluation.");
}

/**
 * Returns a function that will evaluate once when called and will subsequently always return the same result.
 *
 * ```ts
 * let count = 0;
 * const fn = lazy(() => count++);
 * fn(); // 0
 * fn(); // 0
 * count; // 1
 * ```
 */
export function lazy<A extends unknown[], T>(factory: (...args: A) => T, ...args: A) {
    let f = (): T => {
        f = recursiveLazy;
        try {
            f = always(factory(...args));
        }
        catch (e) {
            f = alwaysFail(e);
        }
        factory = undefined!;
        return f();
    };
    return () => f();
}

const uncurryThis_ = Function.prototype.bind.bind(Function.prototype.call);

/**
 * Returns a function whose first argument is passed as the `this` receiver to the provided function when called.
 *
 * ```ts
 * const hasOwn = uncurryThis(Object.prototype.hasOwnProperty);
 * const obj = { x: 1 };
 * hasOwn(obj, "x"); // true
 * hasOwn(obj, "y"); // false
 * ```
 */
export function uncurryThis<T, A extends unknown[], R>(f: (this: T, ...args: A) => R): (this_: T, ...args: A) => R {
    return uncurryThis_(f);
}

/**
 * Equates two values using the default `Equaler`.
 * @see {@link @esfx/equatable#Equaler.defaultEqualer}
 */
export function equate<T>(a: T, b: T) {
    return Equaler.defaultEqualer.equals(a, b);
}

export namespace equate {
    /**
     * Creates a copy of `equate` for a specific `Equaler`.
     */
    export function withEqualer<T>(equaler: Equaler<T>, allowNullishValues: true): (a: T | null | undefined, b: T | null | undefined) => boolean;
    /**
     * Creates a copy of `equate` for a specific `Equaler`.
     */
    export function withEqualer<T>(equaler: Equaler<T>, allowNullishValues?: boolean): (a: T, b: T) => boolean;
    export function withEqualer<T>(equaler: Equaler<T>, allowNullishValues?: boolean): (a: T, b: T) => boolean {
        return allowNullishValues ?
            (a, b) => isMissing(a) ? isMissing(b) : !isMissing(b) || equaler.equals(a, b) :
            (a, b) => equaler.equals(a, b);
    }
}

/**
 * Generates a hashcode from a value.
 */
export function hash(value: unknown): number {
    return Equaler.defaultEqualer.hash(value);
}

export namespace hash {
    /**
     * Creates a copy of `hash` for a specific `Equaler`.
     */
    export function withEqualer<T>(equaler: Equaler<T>, allowNullishValues: true): (value: T | null | undefined) => number;
    /**
     * Creates a copy of `hash` for a specific `Equaler`.
     */
    export function withEqualer<T>(equaler: Equaler<T>, allowNullishValues?: boolean): (value: T) => number;
    export function withEqualer<T>(equaler: Equaler<T>, allowNullishValues?: boolean): (value: T) => number {
        return allowNullishValues ?
            value => isMissing(value) ? 0 : equaler.hash(value) :
            value => equaler.hash(value);
    }
}

/**
 * Compares two values using the default `Comparer`.
 * @see {@link @esfx/equatable#Comparer.defaultComparer}
 */
export function compare<T>(a: T, b: T) {
    return Comparer.defaultComparer.compare(a, b);
}

export namespace compare {
    /**
     * Creates a copy of `compare` for a specific `Comparer`.
     */
    export function withComparer<T>(comparer: Comparer<T>, allowNullishValues: true): (a: T | null | undefined, b: T | null | undefined) => number;
    /**
     * Creates a copy of `compare` for a specific `Comparer`.
     */
    export function withComparer<T>(comparer: Comparer<T>, allowNullishValues?: boolean): (a: T, b: T) => number;
    export function withComparer<T>(comparer: Comparer<T>, allowNullishValues?: boolean): (a: T, b: T) => number {
        return allowNullishValues ?
            (a, b) => isMissing(a) ? isMissing(b) ? 0 : -1 : isMissing(b) ? +1 : comparer.compare(a, b) :
            (a, b) => comparer.compare(a, b);
    }
}

/**
 * Clamps a value to a set range using the default `Comparer`.
 *
 * ```ts
 * const fn = clamp(0, 10);
 * fn(-1); // 0
 * fn(15); // 10
 * fn(7); // 7
 * ```
 */
export function clamp<T>(min: T, max: T): (value: T) => T {
    return value => Comparer.defaultComparer.compare(value, min) < 0 ? min :
                    Comparer.defaultComparer.compare(value, max) > 0 ? max :
                    value;
}

export namespace clamp {
    /**
     * Creates a copy of `clamp` for a specific `Comparer`.
     */
    export function withComparer<T>(comparer: Comparer<T>, allowNullishValues: true): (min: T, max: T) => (value: T) => T;
    /**
     * Creates a copy of `clamp` for a specific `Comparer`.
     */
    export function withComparer<T>(comparer: Comparer<T>, allowNullishValues?: boolean): (min: T, max: T) => (value: T) => T;
    export function withComparer<T>(comparer: Comparer<T>, allowNullishValues?: boolean): (min: T, max: T) => (value: T) => T {
        const comparefn = compare.withComparer(comparer, allowNullishValues);
        return (min, max) => (value) => comparefn(value, min) < 0 ? min :
                                        comparefn(value, max) > 0 ? max :
                                        value;
    }
}

/**
 * Returns a function that returns the complement of calling `f`.
 *
 * ```ts
 * alwaysTrue(); // true
 * complement(alwaysTrue)(); // false
 *
 * alwaysFalse(); // false
 * complement(alwaysFalse)(); // true
 * ```
 */
export function complement<A extends unknown[]>(f: (...args: A) => boolean): (...args: A) => boolean {
    return (...args) => !f(...args);
}

/**
 * Returns a function that returns the result of calling its first argument if that result is "falsy", otherwise returning the result of calling its second argument.
 * NOTE: This performs the same shortcutting as a logical AND (i.e. `a() && b()`)
 */
export function both<T, U extends T, V extends T>(a: (t: T) => t is U, b: (t: T) => t is V): (t: T) => t is U & V;
export function both<A extends unknown[], R1, R2>(a: (...args: A) => R1, b: (...args: A) => R2): (...args: A) => R1 extends (null | undefined | false | 0 | 0n | '') ? R1 : R2 extends (null | undefined | false | 0 | 0n | '') ? R2 : R1 | R2;
export function both<A extends unknown[], R1, R2>(a: (...args: A) => R1, b: (...args: A) => R2): (...args: A) => R1 | R2 {
    return (...args) => a(...args) && b(...args);
}

/**
 * Returns a function that returns the result of calling its first argument if that result is "truthy", otherwise returning the result of calling its second argument.
 * NOTE: This performs the same shortcutting as a logical OR (i.e. `a() || b()`).
 */
export function either<T, U extends T, V extends T>(a: (t: T) => t is U, b: (t: T) => t is V): (t: T) => t is U | V;
export function either<A extends unknown[], R1, R2>(a: (...args: A) => R1, b: (...args: A) => R2): (...args: A) => R1 extends (null | undefined | false | 0 | 0n | '') ? R2 : R1;
export function either<A extends unknown[], R1, R2>(a: (...args: A) => R1, b: (...args: A) => R2): (...args: A) => R1 | R2 {
    return (...args) => a(...args) || b(...args);
}

/**
 * Returns a function that returns the result of calling the first callback, if that result is neither `null` nor `undefined`; otherwise, returns the result of calling the second callback with the same arguments.
 * NOTE: This performs the same shortcutting as nullish-coalesce (i.e. `a() ?? b()`).
 */
export function fallback<A extends unknown[], T, U>(a: (...args: A) => T, b: (...args: A) => U): (...args: A) => NonNullable<T> | U {
    return (...args) => {
        const result = a(...args);
        return isDefined(result) ? result : b(...args);
    };
}

/**
 * Returns `true` if a value is neither `null` nor `undefined`.
 */
export function isDefined<T>(value: T): value is NonNullable<T> {
    return !isMissing(value);
}
