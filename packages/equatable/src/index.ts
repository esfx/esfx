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

import { hashUnknown, combineHashes } from '@esfx/internal-hashcode';

/**
 * Represents a value that can compare its equality with another value.
 */
export interface Equatable {
    /**
     * Determines whether this value is equal to another value.
     * @param other The other value.
     */
    [Equatable.equals](other: unknown): boolean;

    /**
     * Compute a hash code for an value.
     */
    [Equatable.hash](): number;
}

export namespace Equatable {
    /**
     * A well-known symbol used to define an equality test method on a value.
     */
    export const equals = Symbol.for("@esfx/equatable:Equatable.equals");

    /**
     * A well-known symbol used to define a hashing method on a value.
     */
    export const hash = Symbol.for("@esfx/equatable:Equatable.hash");

    /**
     * Determines whether a value is Equatable.
     */
    export function isEquatable(value: unknown): value is Equatable {
        const obj = Object(value);
        return equals in obj && typeof obj[equals] === "function"
            && hash in obj && typeof obj[hash] === "function";
    }
}

/**
 * Represents a value that can compare itself relationally with another value.
 */
export interface Comparable {
    /**
     * Compares this value with another value:
     * - A negative value indicates this value is lesser.
     * - A positive value indicates this value is greater.
     * - A zero value indicates this value is the same.
     */
    [Comparable.compareTo](other: unknown): number;
}

export namespace Comparable {
    /**
     * A well-known symbol used to define a relational comparison method on a value.
     */
    export const compareTo = Symbol.for("@esfx/equatable:Comparable.compareTo");

    /**
     * Determines whether a value is Comparable.
     */
    export function isComparable(value: unknown): value is Comparable {
        const obj = Object(value);
        return compareTo in obj && typeof obj[compareTo] === "function";
    }
}

/**
 * Represents a value that can compare its structural equality with another value.
 */
export interface StructuralEquatable {
    /**
     * Determines whether this value is structurally equal to another value using the supplied `Equaler`.
     * @param other The other value.
     * @param equaler The `Equaler` to use to test equality.
     */
    [StructuralEquatable.structuralEquals](other: unknown, equaler: Equaler<unknown>): boolean;

    /**
     * Compute a structural hash code for a value using the supplied `Equaler`.
     * @param equaler The `Equaler` to use to test equality.
     */
    [StructuralEquatable.structuralHash](equaler: Equaler<unknown>): number;
}

export namespace StructuralEquatable {
    /**
     * A well-known symbol used to define a structural equality test method on a value.
     */
    export const structuralEquals = Symbol.for("@esfx/equatable:StructualEquatable.structuralEquals");

    /**
     * A well-known symbol used to define a structural hashing method on a value.
     */
    export const structuralHash = Symbol.for("@esfx/equatable:StructuralEquatable.structuralHash");

    /**
     * Determines whether a value is StructuralEquatable.
     */
    export function isStructuralEquatable(value: unknown): value is StructuralEquatable {
        const obj = Object(value);
        return structuralEquals in obj && typeof obj[structuralEquals] === "function"
            && structuralHash in obj && typeof obj[structuralHash] === "function";
    }
}

/**
 * Represents a value that can compare its structure relationally with another value.
 */
export interface StructuralComparable {
    /**
     * Compares the structure of this value with another value using the supplied comparer:
     * - A negative value indicates this value is lesser.
     * - A positive value indicates this value is greater.
     * - A zero value indicates this value is the same.
     */
    [StructuralComparable.structuralCompareTo](other: unknown, comparer: Comparer<unknown>): number;
}

export namespace StructuralComparable {
    /**
     * A well-known symbol used to define a structural comparison method on a value.
     */
    export const structuralCompareTo = Symbol.for("@esfx/equatable:StructuralComparable.structuralCompareTo");

    /**
     * Determines whether a value is StructuralComparable.
     */
    export function isStructuralComparable(value: unknown): value is StructuralComparable {
        const obj = Object(value);
        return structuralCompareTo in obj && typeof obj[structuralCompareTo] === "function";
    }
}

/**
 * Represents an object that can be used to compare the equality of two objects.
 */
export interface Equaler<T> {
    /**
     * Tests whether two values are equal to each other.
     * @param x The first value.
     * @param y The second value.
     */
    equals(x: T, y: T): boolean;

    /**
     * Generates a hash code for a value.
     */
    hash(x: T): number;
}

export type EqualityComparison<T> = (x: T, y: T) => boolean;
export type HashGenerator<T> = (x: T) => number;

export namespace Equaler {
    /**
     * Gets the default `Equaler`.
     */
    export const defaultEqualer: Equaler<unknown> = {
        equals(x, y) {
            if (Equatable.isEquatable(x)) return x[Equatable.equals](y);
            if (Equatable.isEquatable(y)) return y[Equatable.equals](x);
            return Object.is(x, y);
        },
        hash(x) {
            if (Equatable.isEquatable(x)) return x[Equatable.hash]();
            return hashUnknown(x);
        }
    };

    /**
     * Gets a default `Equaler` that supports `StructuralEquatable` values.
     */
    export const structuralEqualer: Equaler<unknown> = {
        equals(x, y) {
            if (StructuralEquatable.isStructuralEquatable(x)) return x[StructuralEquatable.structuralEquals](y, structuralEqualer);
            if (StructuralEquatable.isStructuralEquatable(y)) return y[StructuralEquatable.structuralEquals](x, structuralEqualer);
            return defaultEqualer.equals(x, y);
        },
        hash(x) {
            if (StructuralEquatable.isStructuralEquatable(x)) return x[StructuralEquatable.structuralHash](structuralEqualer);
            return defaultEqualer.hash(x);
        }
    };

    /**
     * An `Equaler` that compares array values rather than the arrays themselves.
     */
    export const tupleEqualer: Equaler<readonly unknown[]> = {
        equals(x, y) {
            if (!Array.isArray(x) && x !== null && x !== undefined ||
                !Array.isArray(y) && y !== null && y !== undefined) throw new TypeError("Array expected");
            if (x === y) return true;
            if (!x || !y || x.length !== y.length) return false;
            for (let i = 0; i < x.length; i++) {
                if (!Equaler.defaultEqualer.equals(x[0], y[0])) return false;
            }
            return true;
        },
        hash(x) {
            if (x === null || x === undefined) return 0;
            if (!Array.isArray(x)) throw new TypeError("Array expected");
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
            if (x === y) return true;
            if (!x || !y || x.length !== y.length) return false;
            for (let i = 0; i < x.length; i++) {
                if (!Equaler.structuralEqualer.equals(x[0], y[0])) return false;
            }
            return true;
        },
        hash(x) {
            if (x === null || x === undefined) return 0;
            if (!Array.isArray(x)) throw new TypeError("Array expected");
            let hc = 0;
            for (const item of x) {
                hc = combineHashes(hc, Equaler.structuralEqualer.hash(item));
            }
            return hc;
        }
    };

    /**
     * Creates an `Equaler` from a comparison function and an optional hash generator.
     */
    export function create<T>(equalityComparison: EqualityComparison<T>, hashGenerator: HashGenerator<T> = defaultEqualer.hash): Equaler<T> {
        return { equals: equalityComparison, hash: hashGenerator };
    }
}

export type Comparison<T> = (x: T, y: T) => number;

/**
 * Represents an object that can be used to perform a relational comparison between two values.
 */
export interface Comparer<T> {
    /**
     * Compares two values:
     * - A negative value indicates `x` is lesser than `y`.
     * - A positive value indicates `x` is greater than `y`.
     * - A zero value indicates `x` and `y` are equivalent.
     */
    compare(x: T, y: T): number;
}

export namespace Comparer {
    /**
     * The default `Comparer`.
     */
    export const defaultComparer: Comparer<unknown> = {
        compare(x, y) {
            if (Comparable.isComparable(x)) return x[Comparable.compareTo](y);
            if (Comparable.isComparable(y)) return -y[Comparable.compareTo](x);
            if ((x as any) < (y as any)) return -1;
            if ((x as any) > (y as any)) return 1;
            return 0;
        }
    };

    /**
     * A default `Comparer` that supports `StructuralComparable` values.
     */
    export const structuralComparer: Comparer<unknown> = {
        compare(x, y) {
            if (StructuralComparable.isStructuralComparable(x)) return x[StructuralComparable.structuralCompareTo](y, structuralComparer);
            if (StructuralComparable.isStructuralComparable(y)) return -y[StructuralComparable.structuralCompareTo](x, structuralComparer);
            return defaultComparer.compare(x, y);
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
                if (r = defaultComparer.compare(x[0], y[0])) {
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
                if (r = structuralComparer.compare(x[0], y[0])) {
                    return r;
                }
            }
            return 0;
        }
    };

    /**
     * Creates a `Comparer` from a comparison function.
     */
    export function create<T>(comparison: Comparison<T>): Comparer<T> {
        return { compare: comparison };
    }
}