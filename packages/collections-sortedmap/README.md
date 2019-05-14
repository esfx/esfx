# `@esfx/collections-sortedmap`

The `@esfx/collections-sortedmap` package provides `SortedMap`, a collection class that utilizes `@esfx/collection-core` and `@esfx/equatable`.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/collections-sortedmap
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

## SortedMap

```ts
import { SortedMap } from "@esfx/collections-sortedmap";

// NOTE: see definition of Person above
const obj1 = new Person("Alice", "Johnson");
const obj2 = new Person("Bob", "Clark");

// ECMAScript native map iterates in insertion order
const map = new Map(); // native ECMAScript Map
set.set(obj1, "obj1");
set.set(obj2, "obj2");
[...set.keys()]; // Alice Johnson,Bob Clark

// SortedMap uses Comparable.compareTo if available
const sortedMap = new SortedMap();
sortedMap.set(obj1, "obj1");
sortedMap.set(obj2, "obj2");
[...sortedMap.keys()]; // Bob Clark,Alice Johnson
```

# API

```ts
import { KeyedCollection } from "@esfx/collection-core";
import { Comparison, Comparer } from "@esfx/equatable";
export declare class SortedMap<K, V> implements KeyedCollection<K, V> {
    constructor(comparer?: Comparison<K> | Comparer<K>);
    constructor(iterable?: Iterable<[K, V]>, comparer?: Comparison<K> | Comparer<K>);
    readonly size: number;
    has(key: K): boolean;
    get(key: K): V | undefined;
    set(key: K, value: V): this;
    delete(key: K): boolean;
    clear(): void;
    keys(): IterableIterator<K>;
    values(): IterableIterator<V>;
    entries(): IterableIterator<[K, V]>;
    [Symbol.iterator](): IterableIterator<[K, V]>;
    forEach(cb: (value: V, key: K, map: this) => void, thisArg?: unknown): void;
    [Symbol.toStringTag]: string;
    readonly [KeyedCollection.size]: number;
    [KeyedCollection.has](key: K): boolean;
    [KeyedCollection.get](key: K): V | undefined;
    [KeyedCollection.set](key: K, value: V): void;
    [KeyedCollection.delete](key: K): boolean;
    [KeyedCollection.clear](): void;
    [KeyedCollection.keys](): IterableIterator<K>;
    [KeyedCollection.values](): IterableIterator<V>;
}
```
