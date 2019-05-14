# `@esfx/collections-sortedset`

The `@esfx/collections-sortedset` package provides `SortedSet`, a collection class that utilizes `@esfx/collection-core` and `@esfx/equatable`.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/collections-sortedset
```

# Usage

> NOTE: The examples below use the following definition of `Person`:
> ```ts
> import { Equatable, Equaler, Comparable, Comparer } from "@esfx/equatable";
>
> class Person {
>     constructor(firstName, lastName) {
>         this.firstName = firstName;
>         this.lastName = lastName;
>     }
>
>     toString() {
>         return `${this.firstName} ${this.lastName}`;
>     }
>
>     [Equatable.equals](other) {
>         return other instanceof Person
>             && this.lastName === other.lastName
>             && this.firstName === other.firstName;
>     }
>
>     [Equatable.hash]() {
>         return Equaler.defaultEqualer.hash(this.lastName)
>              ^ Equaler.defaultEqualer.hash(this.firstName);
>     }
>
>     [Comparable.compareTo](other) {
>         if (!(other instanceof Person)) throw new TypeError();
>         return Comparer.defaultComparer.compare(this.lastName, other.lastName)
>             || Comparer.defaultComparer.compare(this.firstName, other.firstName);
>     }
> }
> ```

## SortedSet

```ts
import { SortedSet } from "@esfx/collections-sortedset";

// NOTE: see definition of Person above
const obj1 = new Person("Alice", "Johnson");
const obj2 = new Person("Bob", "Clark");

// ECMAScript native set iterates in insertion order
const set = new Set(); // native ECMAScript Set
set.add(obj1);
set.add(obj2);
[...set]; // Alice Johnson,Bob Clark

// SortedSet uses Comparable.compareTo if available
const sortedSet = new SortedSet();
sortedSet.add(obj1);
sortedSet.add(obj2);
[...sortedSet]; // Bob Clark,Alice Johnson
```

# API


```ts
import { Collection } from "@esfx/collection-core";
import { Comparison, Comparer } from "@esfx/equatable";
export declare class SortedSet<T> implements Collection<T> {
    constructor(comparer?: Comparison<T> | Comparer<T>);
    constructor(iterable?: Iterable<T>, comparer?: Comparison<T> | Comparer<T>);
    readonly size: number;
    has(value: T): boolean;
    add(value: T): this;
    delete(value: T): boolean;
    clear(): void;
    keys(): IterableIterator<T>;
    values(): IterableIterator<T>;
    entries(): IterableIterator<[T, T]>;
    [Symbol.iterator](): IterableIterator<T>;
    forEach(cb: (value: T, key: T, map: this) => void, thisArg?: unknown): void;
    [Symbol.toStringTag]: string;
    readonly [Collection.size]: number;
    [Collection.has](value: T): boolean;
    [Collection.add](value: T): void;
    [Collection.delete](value: T): boolean;
    [Collection.clear](): void;
}
```
