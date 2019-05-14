# `@esfx/collections-hashset`

The `@esfx/collections-hashset` package provides `HashSet`, a collection class that utilizes `@esfx/collection-core` and `@esfx/equatable`.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/collections-hashset
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

## HashSet

```ts
import { HashSet } from "@esfx/collections-hashset";

// NOTE: see definition of Person above
const obj1 = new Person("Bob", "Clark");
const obj2 = new Person("Bob", "Clark");

const set = new Set(); // native ECMAScript Set
set.add(obj1);
set.add(obj2);
set.length; // 2

const hashSet = new HashSet();
hashSet.add(obj1);
hashSet.add(obj2);
hashSet.length; // 1
```

# API

```ts
import { Collection } from "@esfx/collection-core";
import { Equaler } from "@esfx/equatable";
export declare class HashSet<T> implements Collection<T> {
    constructor(equaler?: Equaler<T>);
    constructor(iterable?: Iterable<T>, equaler?: Equaler<T>);
    constructor(capacity: number, equaler?: Equaler<T>);
    readonly equaler: Equaler<T>;
    readonly size: number;
    has(value: T): boolean;
    add(value: T): this;
    delete(value: T): boolean;
    clear(): void;
    ensureCapacity(capacity: number): number | undefined;
    trimExcess(capacity?: number): void;
    keys(): IterableIterator<T>;
    values(): IterableIterator<T>;
    entries(): IterableIterator<[T, T]>;
    [Symbol.iterator](): IterableIterator<T>;
    forEach(callback: (value: T, key: T, map: this) => void, thisArg?: any): void;
    [Symbol.toStringTag]: string;
    readonly [Collection.size]: number;
    [Collection.has](value: T): boolean;
    [Collection.add](value: T): void;
    [Collection.delete](value: T): boolean;
    [Collection.clear](): void;
}
```
