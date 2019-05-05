# `@esfx/equatable`

The `@esfx/equatable` package provides a low level API for defining equality.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/equatable
```

# Usage

```ts
import { Equatable, Equaler, Comparable, Comparer } from "@esfx/equatable"; 

class Person {
    constructor(firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }

    toString() {
        return `${this.firstName} ${this.lastName}`;
    }

    [Equatable.equals](other) {
        return other instanceof Person
            && this.lastName === other.lastName
            && this.firstName === other.firstName;
    }

    [Equatable.hash]() {
        return Equaler.defaultEqualer.hash(this.lastName)
             ^ Equaler.defaultEqualer.hash(this.firstName);
    }

    [Comparable.compareTo](other) {
        if (!(other instanceof Person)) throw new TypeError();
        return Comparer.defaultComparer.compare(this.lastName, other.lastName)
            || Comparer.defaultComparer.compare(this.firstName, other.firstName);
    }
}

const people = [
    new Person("Alice", "Johnson")
    new Person("Bob", "Clark"),
];
people.sort(Comparer.defaultComparer.compare);
console.log(people); // Bob Clark,Alice Johnson

const obj1 = new Person("Bob", "Clark");
const obj2 = new Person("Bob", "Clark");
obj1 === obj2; // false
Equaler.defaultEqualer.equals(obj1, obj2); // true
```

# API

```ts
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
export declare namespace Equatable {
    /**
     * A well-known symbol used to define an equality test method on a value.
     */
    const equals: unique symbol;
    /**
     * A well-known symbol used to define a hashing method on a value.
     */
    const hash: unique symbol;
    /**
     * Determines whether an value is Equatable.
     */
    function isEquatable(value: unknown): value is Equatable;
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
export declare namespace Comparable {
    /**
     * A well-known symbol used to define a relational comparison method on a value.
     */
    const compareTo: unique symbol;
    /**
     * Determines whether a value is Comparable.
     */
    function isComparable(value: unknown): value is Comparable;
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
export declare namespace StructuralEquatable {
    /**
     * A well-known symbol used to define a structural equality test method on a value.
     */
    const structuralEquals: unique symbol;
    /**
     * A well-known symbol used to define a structural hashing method on a value.
     */
    const structuralHash: unique symbol;
    /**
     * Determines whether a value is StructuralEquatable.
     */
    function isStructuralEquatable(value: unknown): value is StructuralEquatable;
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
export declare namespace StructuralComparable {
    /**
     * A well-known symbol used to define a structural comparison method on a value.
     */
    const structuralCompareTo: unique symbol;
    /**
     * Determines whether a value is StructuralComparable.
     */
    function isStructuralComparable(value: unknown): value is StructuralComparable;
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
export declare type EqualityComparison<T> = (x: T, y: T) => boolean;
export declare type HashGenerator<T> = (x: T) => number;
export declare namespace Equaler {
    /**
     * Gets the default `Equaler`.
     */
    const defaultEqualer: Equaler<unknown>;
    /**
     * Gets a default `Equaler` that supports `StructuralEquatable` values.
     */
    const structuralEqualer: Equaler<unknown>;
    /**
     * An `Equaler` that compares array values rather than the arrays themselves.
     */
    const tupleEqualer: Equaler<unknown[]>;
    /**
     * An `Equaler` that compares array values that may be `StructuralEquatable` rather than the arrays themselves.
     */
    const tupleStructuralEqualer: Equaler<unknown[]>;
    /**
     * Creates an `Equaler` from a comparison function and an optional hash generator.
     */
    function create<T>(equalityComparison: EqualityComparison<T>, hashGenerator?: HashGenerator<T>): Equaler<T>;
}
export declare type Comparison<T> = (x: T, y: T) => number;
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
export declare namespace Comparer {
    /**
     * The default `Comparer`.
     */
    const defaultComparer: Comparer<unknown>;
    /**
     * A default `Comparer` that supports `StructuralComparable` values.
     */
    const structuralComparer: Comparer<unknown>;
    /**
     * A default `Comparer` that compares array values rather than the arrays themselves.
     */
    const tupleComparer: Comparer<unknown[]>;
    /**
     * A default `Comparer` that compares array values that may be `StructuralComparable` rather than the arrays themselves.
     */
    const tupleStructuralComparer: Comparer<unknown[]>;
    /**
     * Creates a `Comparer` from a comparison function.
     */
    function create<T>(comparison: Comparison<T>): Comparer<T>;
}
```