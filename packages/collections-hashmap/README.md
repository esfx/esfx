# `@esfx/collections-hashmap`

The `@esfx/collections-hashmap` package provides `HashMap`, a collection class that utilizes `@esfx/collection-core` and `@esfx/equatable`.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/collections-hashmap
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

## HashMap

```ts
import { HashMap } from "@esfx/collections-hashmap";

// NOTE: see definition of Person above
const obj1 = new Person("Bob", "Clark");
const obj2 = new Person("Bob", "Clark");

const set = new Map(); // native ECMAScript Map
set.set(obj1, "obj1");
set.set(obj2, "obj2");
set.size; // 2

const hashMap = new HashMap();
hashMap.set(obj1, "obj1");
hashMap.set(obj2, "obj2");
hashMap.size; // 1
```

# API

```ts
import { KeyedCollection } from "@esfx/collection-core";
import { Equaler } from "@esfx/equatable";
export declare class HashMap<K, V> implements KeyedCollection<K, V> {
    constructor(equaler?: Equaler<K>);
    constructor(iterable?: Iterable<[K, V]>, equaler?: Equaler<K>);
    constructor(capacity: number, equaler?: Equaler<K>);
    readonly equaler: Equaler<K>;
    readonly size: number;
    has(key: K): boolean;
    get(key: K): V | undefined;
    set(key: K, value: V): this;
    delete(key: K): boolean;
    clear(): void;
    ensureCapacity(capacity: number): number | undefined;
    trimExcess(capacity?: number): void;
    keys(): IterableIterator<K>;
    values(): IterableIterator<V>;
    entries(): IterableIterator<[K, V]>;
    [Symbol.iterator](): IterableIterator<[K, V]>;
    forEach(callback: (value: V, key: K, map: this) => void, thisArg?: any): void;
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
