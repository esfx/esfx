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

import { deprecateProperty } from "@esfx/internal-deprecate";
import { hashUnknown } from '@esfx/internal-hashcode';

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
        const obj = Object(value);
        return Equatable.equals in obj
            && Equatable.hash in obj;
    }
}

/* @internal */
export namespace Equatable {
    /**
     * Determines whether a value is Equatable.
     * @param value The value to test.
     * @returns `true` if the value is an Equatable; otherwise, `false`.
     * @deprecated Use `Equatable.hasInstance` instead.
     */
    export function isEquatable(value: unknown): value is Equatable {
        return Equatable.hasInstance(value);
    }

    deprecateProperty(Equatable, "isEquatable", "Use 'Equatable.hasInstance' instead.");
}

/**
 * Represents a value that can compare itself relationally with another value.
 */
export interface Comparable {
    /**
     * Compares this value with another value, returning a value indicating one of the following conditions:
     * - A negative value indicates this value is lesser.
     * - A positive value indicates this value is greater.
     * - A zero value indicates this value is the same.
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
        const obj = Object(value);
        return Comparable.compareTo in obj;
    }
}

/* @internal */
export namespace Comparable {
    /**
     * Determines whether a value is Comparable.
     * @param value The value to test.
     * @returns `true` if the value is a Comparable; otherwise, `false`.
     * @deprecated Use `Comparable.hasInstance` instead.
     */
    export function isComparable(value: unknown): value is Comparable {
        return Comparable.hasInstance(value);
    }

    deprecateProperty(Comparable, "isComparable", "Use 'Comparable.hasInstance' instead.");
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
        const obj = Object(value);
        return StructuralEquatable.structuralEquals in obj
            && StructuralEquatable.structuralHash in obj;
    }
}

/* @internal */
export namespace StructuralEquatable {
    /**
     * Determines whether a value is StructuralEquatable.
     * @param value The value to test.
     * @returns `true` if the value is StructuralEquatable; otherwise, `false`.
     * @deprecated Use `StructuralEquatable.hasInstance` instead.
     */
    export function isStructuralEquatable(value: unknown): value is StructuralEquatable {
        return StructuralEquatable.hasInstance(value);
    }

    deprecateProperty(StructuralEquatable, "isStructuralEquatable", "Use 'StructuralEquatable.hasInstance' instead.");
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
        const obj = Object(value);
        return StructuralComparable.structuralCompareTo in obj;
    }
}

/* @internal */
export namespace StructuralComparable {
    /**
     * Determines whether a value is StructuralComparable.
     * @param value The value to test.
     * @returns `true` if the value is StructuralComparable; otherwise, `false`.
     * @deprecated Use `StructuralComparable.hasInstance` instead.
     */
    export function isStructuralComparable(value: unknown): value is StructuralComparable {
        return StructuralComparable.hasInstance(value);
    }

    deprecateProperty(StructuralComparable, "isStructuralComparable", "Use 'StructuralComparable.hasInstance' instead.");
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
    /**
     * Gets the default `Equaler`.
     */
    export const defaultEqualer: Equaler<unknown> = {
        equals(x, y) {
            return Equatable.hasInstance(x) ? x[Equatable.equals](y) :
                Equatable.hasInstance(y) ? y[Equatable.equals](x) :
                Object.is(x, y);
        },
        hash(x) {
            return Equatable.hasInstance(x) ? x[Equatable.hash]() :
                hashUnknown(x);
        }
    };

    /**
     * Gets a default `Equaler` that supports `StructuralEquatable` values.
     */
    export const structuralEqualer: Equaler<unknown> = {
        equals(x, y) {
            return StructuralEquatable.hasInstance(x) ? x[StructuralEquatable.structuralEquals](y, structuralEqualer) :
                StructuralEquatable.hasInstance(y) ? y[StructuralEquatable.structuralEquals](x, structuralEqualer) :
                defaultEqualer.equals(x, y);
        },
        hash(x) {
            return StructuralEquatable.hasInstance(x) ? x[StructuralEquatable.structuralHash](structuralEqualer) :
                defaultEqualer.hash(x);
        }
    };

    /**
     * An `Equaler` that compares array values rather than the arrays themselves.
     */
    export const tupleEqualer: Equaler<readonly unknown[]> = {
        equals(x, y) {
            if (!Array.isArray(x) && x !== null && x !== undefined ||
                !Array.isArray(y) && y !== null && y !== undefined) {
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
        hash(x) {
            if (x === null || x === undefined) {
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
        }
    };

    /**
     * An `Equaler` that compares array values that may be `StructuralEquatable` rather than the arrays themselves.
     */
    export const tupleStructuralEqualer: Equaler<readonly unknown[]> = {
        equals(x, y) {
            if (!Array.isArray(x) && x !== null && x !== undefined ||
                !Array.isArray(y) && y !== null && y !== undefined) {
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
        hash(x) {
            if (x === null || x === undefined) {
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
        }
    };

    /**
     * Creates an `Equaler` from a comparison function and an optional hash generator.
     * @typeParam T The type of value that can be compared.
     * @param equalityComparison A callback used to compare the equality of two values.
     * @param hashGenerator A callback used to compute a numeric hash-code for a value.
     * @returns An Equaler for the provided callbacks.
     */
    export function create<T>(equalityComparison: EqualityComparison<T>, hashGenerator: HashGenerator<T> = defaultEqualer.hash): Equaler<T> {
        return { equals: equalityComparison, hash: hashGenerator };
    }

    /**
     * Combines two hash codes.
     * @param x The first hash code.
     * @param y The second hash code.
     * @param rotate The number of bits (between 0 and 31) to left-rotate the first hash code before XOR'ing it with the second (default 7).
     */
    export function combineHashes(x: number, y: number, rotate: number = 7) {
        if (typeof x !== "number") throw new TypeError("Integer expected: x");
        if (typeof y !== "number") throw new TypeError("Integer expected: y");
        if (typeof rotate !== "number") throw new TypeError("Integer expected: rotate");
        if (isNaN(x) || !isFinite(x)) throw new RangeError("Argument must be a finite number value: x");
        if (isNaN(y) || !isFinite(y)) throw new RangeError("Argument must be a finite number value: y");
        if (isNaN(rotate) || !isFinite(rotate)) throw new RangeError("Argument must be a finite number value: rotate");
        while (rotate < 0) rotate += 32;
        while (rotate >= 32) rotate -= 32;
        return ((x << rotate) | (x >>> (32 - rotate))) ^ y;
    }
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
    /**
     * The default `Comparer`.
     */
    export const defaultComparer: Comparer<unknown> = {
        compare(x, y) {
            return Comparable.hasInstance(x) ? x[Comparable.compareTo](y) :
                Comparable.hasInstance(y) ? -y[Comparable.compareTo](x) :
                (x as any) < (y as any) ? -1 :
                (x as any) > (y as any) ? 1 :
                0;
        }
    };

    /**
     * A default `Comparer` that supports `StructuralComparable` values.
     */
    export const structuralComparer: Comparer<unknown> = {
        compare(x, y) {
            return StructuralComparable.hasInstance(x) ? x[StructuralComparable.structuralCompareTo](y, structuralComparer) :
                StructuralComparable.hasInstance(y) ? -y[StructuralComparable.structuralCompareTo](x, structuralComparer) :
                defaultComparer.compare(x, y);
        }
    };

    /**
     * A default `Comparer` that compares array values rather than the arrays themselves.
     */
    export const tupleComparer: Comparer<readonly unknown[]> = {
        compare(x, y) {
            if (!Array.isArray(x) && x !== null && x !== undefined ||
                !Array.isArray(y) && y !== null && y !== undefined) {
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
        }
    };

    /**
     * A default `Comparer` that compares array values that may be `StructuralComparable` rather than the arrays themselves.
     */
    export const tupleStructuralComparer: Comparer<readonly unknown[]> = {
        compare(x, y) {
            if (!Array.isArray(x) && x !== null && x !== undefined ||
                !Array.isArray(y) && y !== null && y !== undefined) {
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
        }
    };

    /**
     * Creates a `Comparer` from a comparison function.
     * @typeParam T The type of value that can be compared.
     * @param comparison A Comparison function used to create a Comparer.
     * @returns The Comparer for the provided comparison function.
     */
    export function create<T>(comparison: Comparison<T>): Comparer<T> {
        return { compare: comparison };
    }
}

export import defaultComparer = Comparer.defaultComparer;
export import structuralComparer = Comparer.structuralComparer;
export import tupleComparer = Comparer.tupleComparer;
export import tupleStructuralComparer = Comparer.tupleStructuralComparer;
