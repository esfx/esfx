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

import /*#__INLINE__*/ { isMissing, isNumber } from "@esfx/internal-guards";
import { hashUnknown } from './internal/hashCode';

/**
 * Represents a value that can compare its equality with another value.
 */
export interface Equatable {
    /**
     * Determines whether this value is equal to another value.
     * @param other The other value.
     * @returns `true` if this value is equal to `other`; otherwise, `false`.
     */
    [Equatable.equals](other: unknown): boolean;

    /**
     * Compute a hash code for an value.
     * @returns The numeric hash-code for the value.
     */
    [Equatable.hash](): number;
}

/**
 * Utility functions and well-known symbols used to define an `Equatable`.
 */
export namespace Equatable {
    // #region Equatable
    /**
     * A well-known symbol used to define an equality test method on a value.
     */
    export const equals = Symbol.for("@esfx/equatable:Equatable.equals");

    /**
     * A well-known symbol used to define a hashing method on a value.
     */
    export const hash = Symbol.for("@esfx/equatable:Equatable.hash");
    // #endregion Equatable

    export const name = "Equatable";

    /**
     * Determines whether a value is Equatable.
     * @param value The value to test.
     * @returns `true` if the value is an Equatable; otherwise, `false`.
     */
    export function hasInstance(value: unknown): value is Equatable {
        let obj: object;
        return !isMissing(value)
            && equals in (obj = Object(value))
            && hash in obj;
    }

    Object.defineProperty(Equatable, Symbol.hasInstance, { configurable: true, writable: true, value: hasInstance });
}

/**
 * Represents a value that can compare itself relationally with another value.
 */
export interface Comparable {
    /**
     * Compares this value with another value, returning a value indicating one of the following conditions:
     *
     * - A negative value indicates this value is lesser.
     *
     * - A positive value indicates this value is greater.
     *
     * - A zero value indicates this value is the same.
     *
     * @param other The other value to compare against.
     * @returns A number indicating the relational comparison result.
     */
    [Comparable.compareTo](other: unknown): number;
}

/**
 * Utility functions and well-known symbols used to define a `Comparable`.
 */
export namespace Comparable {
    // #region Comparable
    /**
     * A well-known symbol used to define a relational comparison method on a value.
     */
    export const compareTo = Symbol.for("@esfx/equatable:Comparable.compareTo");
    // #endregion Comparable

    export const name = "Comparable";

    /**
     * Determines whether a value is Comparable.
     * @param value The value to test.
     * @returns `true` if the value is a Comparable; otherwise, `false`.
     */
    export function hasInstance(value: unknown): value is Comparable {
        return !isMissing(value)
            && compareTo in Object(value);
    }

    Object.defineProperty(Comparable, Symbol.hasInstance, { configurable: true, writable: true, value: hasInstance });
}

/**
 * Represents a value that can compare its structural equality with another value.
 */
export interface StructuralEquatable {
    /**
     * Determines whether this value is structurally equal to another value using the supplied `Equaler`.
     * @param other The other value.
     * @param equaler The `Equaler` to use to test equality.
     * @returns `true` if this value is structurally equal to `other`; otherwise, `false`.
     */
    [StructuralEquatable.structuralEquals](other: unknown, equaler: Equaler<unknown>): boolean;

    /**
     * Compute a structural hash code for a value using the supplied `Equaler`.
     * @param equaler The `Equaler` to use to generate hashes for values in the structure.
     * @returns The numeric hash-code of the structure.
     */
    [StructuralEquatable.structuralHash](equaler: Equaler<unknown>): number;
}

/**
 * Utility functions and well-known symbols used to define a `StructuralEquatable`.
 */
export namespace StructuralEquatable {
    // #region StructuralEquatable
    /**
     * A well-known symbol used to define a structural equality test method on a value.
     */
    export const structuralEquals = Symbol.for("@esfx/equatable:StructualEquatable.structuralEquals");

    /**
     * A well-known symbol used to define a structural hashing method on a value.
     */
    export const structuralHash = Symbol.for("@esfx/equatable:StructuralEquatable.structuralHash");
    // #endregion StructuralEquatable

    export const name = "StructuralEquatable";

    /**
     * Determines whether a value is StructuralEquatable.
     * @param value The value to test.
     * @returns `true` if the value is StructuralEquatable; otherwise, `false`.
     */
    export function hasInstance(value: unknown): value is StructuralEquatable {
        let obj: object;
        return !isMissing(value)
            && structuralEquals in (obj = Object(value))
            && structuralHash in obj;
    }

    Object.defineProperty(StructuralEquatable, Symbol.hasInstance, { configurable: true, writable: true, value: hasInstance });
}

/**
 * Represents a value that can compare its structure relationally with another value.
 */
export interface StructuralComparable {
    /**
     * Compares the structure of this value with another value using the supplied comparer,
     * returning a value indicating one of the following conditions:
     * - A negative value indicates this value is lesser.
     * - A positive value indicates this value is greater.
     * - A zero value indicates this value is the same.
     * @param other The other value to compare against.
     * @param comparer The compare to use to compare values in the structure.
     * @returns A numeric value indicating the relational comparison result.
     */
    [StructuralComparable.structuralCompareTo](other: unknown, comparer: Comparer<unknown>): number;
}

/**
 * Utility functions and well-known symbols used to define a `StructuralComparable`.
 */
export namespace StructuralComparable {
    // #region StructuralComparable
    /**
     * A well-known symbol used to define a structural comparison method on a value.
     */
    export const structuralCompareTo = Symbol.for("@esfx/equatable:StructuralComparable.structuralCompareTo");
    // #endregion StructuralComparable

    export const name = "StructuralComparable";

    /**
     * Determines whether a value is StructuralComparable.
     * @param value The value to test.
     * @returns `true` if the value is StructuralComparable; otherwise, `false`.
     */
    export function hasInstance(value: unknown): value is StructuralComparable {
        return !isMissing(value)
            && structuralCompareTo in Object(value);
    }

    Object.defineProperty(StructuralComparable, Symbol.hasInstance, { configurable: true, writable: true, value: hasInstance });
}

/**
 * Describes a function that can be used to compare the equality of two values.
 * @typeParam T The type of value that can be compared.
 */
export type EqualityComparison<T> = (x: T, y: T) => boolean;

/**
 * Describes a function that can be used to compute a hash code for a value.
 * @typeParam T The type of value that can be hashed.
 */
export type HashGenerator<T> = (x: T) => number;

/**
 * Represents an object that can be used to compare the equality of two values.
 * @typeParam T The type of each value that can be compared.
 */
export interface Equaler<T> {
    /**
     * Tests whether two values are equal to each other.
     * @param x The first value.
     * @param y The second value.
     * @returns `true` if the values are equal; otherwise, `false`.
     */
    equals(x: T, y: T): boolean;

    /**
     * Generates a hash code for a value.
     * @param x The value to hash.
     * @returns The numeric hash-code for the value.
     */
    hash(x: T): number;
}

/**
 * Provides various implementations of `Equaler`.
 */
export namespace Equaler {
    const equalerPrototype = Object.defineProperty({}, Symbol.toStringTag, { configurable: true, value: "Equaler" });

    /**
     * Gets the default `Equaler`.
     */
    export const defaultEqualer: Equaler<unknown> = create(
        (x, y) => Equatable.hasInstance(x) ? x[Equatable.equals](y) :
            Equatable.hasInstance(y) ? y[Equatable.equals](x) :
            Object.is(x, y),
        (x) => Equatable.hasInstance(x) ? x[Equatable.hash]() :
            hashUnknown(x)
    );

    /**
     * Gets a default `Equaler` that supports `StructuralEquatable` values.
     */
    export const structuralEqualer: Equaler<unknown> = create(
        (x, y) => StructuralEquatable.hasInstance(x) ? x[StructuralEquatable.structuralEquals](y, structuralEqualer) :
            StructuralEquatable.hasInstance(y) ? y[StructuralEquatable.structuralEquals](x, structuralEqualer) :
            defaultEqualer.equals(x, y),
        (x) => StructuralEquatable.hasInstance(x) ? x[StructuralEquatable.structuralHash](structuralEqualer) :
            defaultEqualer.hash(x));

    /**
     * An `Equaler` that compares array values rather than the arrays themselves.
     */
    export const tupleEqualer: Equaler<readonly unknown[]> = create(
        (x, y) => {
            if (!isMissing(x) && !Array.isArray(x) ||
                !isMissing(y) && !Array.isArray(y)) {
                throw new TypeError("Array expected");
            }
            if (x === y) {
                return true;
            }
            if (!x || !y || x.length !== y.length) {
                return false;
            }
            for (let i = 0; i < x.length; i++) {
                if (!Equaler.defaultEqualer.equals(x[i], y[i])) {
                    return false;
                }
            }
            return true;
        },
        (x) => {
            if (isMissing(x)) {
                return 0;
            }
            if (!Array.isArray(x)) {
                throw new TypeError("Array expected");
            }
            let hc = 0;
            for (const item of x) {
                hc = combineHashes(hc, Equaler.defaultEqualer.hash(item));
            }
            return hc;
        });

    /**
     * An `Equaler` that compares array values that may be `StructuralEquatable` rather than the arrays themselves.
     */
    export const tupleStructuralEqualer: Equaler<readonly unknown[]> = create(
        (x, y) => {
            if (!isMissing(x) && !Array.isArray(x) ||
                !isMissing(y) && !Array.isArray(y)) {
                throw new TypeError("Array expected");
            }
            if (x === y) {
                return true;
            }
            if (!x || !y || x.length !== y.length) {
                return false;
            }
            for (let i = 0; i < x.length; i++) {
                if (!Equaler.structuralEqualer.equals(x[i], y[i])) {
                    return false;
                }
            }
            return true;
        },
        (x) => {
            if (isMissing(x)) {
                return 0;
            }
            if (!Array.isArray(x)) {
                throw new TypeError("Array expected");
            }
            let hc = 0;
            for (const item of x) {
                hc = combineHashes(hc, Equaler.structuralEqualer.hash(item));
            }
            return hc;
        });

    /**
     * Creates an `Equaler` from a comparison function and an optional hash generator.
     * @typeParam T The type of value that can be compared.
     * @param equalityComparison A callback used to compare the equality of two values.
     * @param hashGenerator A callback used to compute a numeric hash-code for a value.
     * @returns An Equaler for the provided callbacks.
     */
    export function create<T>(equalityComparison: EqualityComparison<T>, hashGenerator: HashGenerator<T> = defaultEqualer.hash): Equaler<T> {
        return Object.setPrototypeOf({ equals: equalityComparison, hash: hashGenerator }, equalerPrototype);
    }

    /**
     * Combines two hash codes.
     * @param x The first hash code.
     * @param y The second hash code.
     * @param rotate The number of bits (between 0 and 31) to left-rotate the first hash code before XOR'ing it with the second (default 7).
     */
    export function combineHashes(x: number, y: number, rotate: number = 7) {
        if (!isNumber(x)) throw new TypeError("Integer expected: x");
        if (!isNumber(y)) throw new TypeError("Integer expected: y");
        if (!isNumber(rotate)) throw new TypeError("Integer expected: rotate");
        if (isNaN(x) || !isFinite(x)) throw new RangeError("Argument must be a finite number value: x");
        if (isNaN(y) || !isFinite(y)) throw new RangeError("Argument must be a finite number value: y");
        if (isNaN(rotate) || !isFinite(rotate)) throw new RangeError("Argument must be a finite number value: rotate");
        while (rotate < 0) rotate += 32;
        while (rotate >= 32) rotate -= 32;
        return ((x << rotate) | (x >>> (32 - rotate))) ^ y;
    }

    export function hasInstance(value: unknown): value is Equaler<unknown> {
        return typeof value === "object"
            && value !== null
            && typeof (value as Equaler<unknown>).equals === "function"
            && typeof (value as Equaler<unknown>).hash === "function";
    }

    Object.defineProperty(Equaler, Symbol.hasInstance, { configurable: true, writable: true, value: hasInstance });
}

export import defaultEqualer = Equaler.defaultEqualer;
export import structuralEqualer = Equaler.structuralEqualer;
export import tupleEqualer = Equaler.tupleEqualer;
export import tupleStructuralEqualer = Equaler.tupleEqualer;
export import combineHashes = Equaler.combineHashes;

/**
 * Describes a function that can be used to compare the relational equality of two values, returning a
 * value indicating one of the following conditions:
 * - A negative value indicates `x` is lesser than `y`.
 * - A positive value indicates `x` is greater than `y`.
 * - A zero value indicates `x` and `y` are equivalent.
 * @typeParam T The type of value that can be compared.
 */
export type Comparison<T> = (x: T, y: T) => number;

/**
 * Represents an object that can be used to perform a relational comparison between two values.
 * @typeParam T The type of value that can be compared.
 */
export interface Comparer<T> {
    /**
     * Compares two values, returning a value indicating one of the following conditions:
     * - A negative value indicates `x` is lesser than `y`.
     * - A positive value indicates `x` is greater than `y`.
     * - A zero value indicates `x` and `y` are equivalent.
     * @param x The first value to compare.
     * @param y The second value to compare.
     * @returns A number indicating the relational comparison result.
     */
    compare(x: T, y: T): number;
}

/**
 * Provides various implementations of `Comparer`.
 */
export namespace Comparer {
    const comparerProtototype = Object.defineProperty({}, Symbol.toStringTag, { configurable: true, value: "Comparer" });

    /**
     * The default `Comparer`.
     */
    export const defaultComparer: Comparer<unknown> = create((x, y) => 
        Comparable.hasInstance(x) ? x[Comparable.compareTo](y) :
        Comparable.hasInstance(y) ? -y[Comparable.compareTo](x) :
        (x as any) < (y as any) ? -1 :
        (x as any) > (y as any) ? 1 :
        0);

    /**
     * A default `Comparer` that supports `StructuralComparable` values.
     */
    export const structuralComparer: Comparer<unknown> = create((x, y) => 
        StructuralComparable.hasInstance(x) ? x[StructuralComparable.structuralCompareTo](y, structuralComparer) :
        StructuralComparable.hasInstance(y) ? -y[StructuralComparable.structuralCompareTo](x, structuralComparer) :
        defaultComparer.compare(x, y));

    /**
     * A default `Comparer` that compares array values rather than the arrays themselves.
     */
    export const tupleComparer: Comparer<readonly unknown[]> = create((x, y) => {
        if (!isMissing(x) && !Array.isArray(x) ||
            !isMissing(y) && !Array.isArray(y)) {
            throw new TypeError("Array expected");
        }
        let r: number;
        if (r = defaultComparer.compare(x.length, y.length)) {
            return r;
        }
        for (let i = 0; i < x.length; i++) {
            if (r = defaultComparer.compare(x[i], y[i])) {
                return r;
            }
        }
        return 0;
    });

    /**
     * A default `Comparer` that compares array values that may be `StructuralComparable` rather than the arrays themselves.
     */
    export const tupleStructuralComparer: Comparer<readonly unknown[]> = create((x, y) => {
        if (!isMissing(x) && !Array.isArray(x) ||
            !isMissing(y) && !Array.isArray(y)) {
            throw new TypeError("Array expected");
        }
        let r: number;
        if (r = defaultComparer.compare(x.length, y.length)) {
            return r;
        }
        for (let i = 0; i < x.length; i++) {
            if (r = structuralComparer.compare(x[i], y[i])) {
                return r;
            }
        }
        return 0;
    });

    /**
     * Creates a `Comparer` from a comparison function.
     * @typeParam T The type of value that can be compared.
     * @param comparison A Comparison function used to create a Comparer.
     * @returns The Comparer for the provided comparison function.
     */
    export function create<T>(comparison: Comparison<T>): Comparer<T> {
        return Object.setPrototypeOf({ compare: comparison }, comparerProtototype);
    }

    export function hasInstance(value: unknown): value is Comparer<unknown> {
        return typeof value === "object"
            && value !== null
            && typeof (value as Comparer<unknown>).compare === "function";
    }

    Object.defineProperty(Comparer, Symbol.hasInstance, { configurable: true, writable: true, value: hasInstance });
}

export import defaultComparer = Comparer.defaultComparer;
export import structuralComparer = Comparer.structuralComparer;
export import tupleComparer = Comparer.tupleComparer;
export import tupleStructuralComparer = Comparer.tupleStructuralComparer;

/**
 * Gets the raw hashcode for a value. This bypasses any `[Equatable.hash]` properties on an object.
 * @param value Any value.
 * @returns The hashcode for the value.
 */
export function rawHash(value: unknown): number {
    return hashUnknown(value);
}
