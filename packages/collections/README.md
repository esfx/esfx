# `@esfx/collections`

The `@esfx/collections` package provides a number of common collection classes that utilize `@esfx/collection-core` and `@esfx/equatable`.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/collections
```

# Usage

## HashSet/HashMap

```ts
import { HashSet } from "equatable/collections";

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

## SortedSet/SortedMap

```ts
import { SortedSet } from "equatable/collections";

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

* [HashMap](#hashmap)
* [HashSet](#hashset)
* [SortedMap](#sortedmap)
* [SortedSet](#sortedset)

## HashMap

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

## HashSet

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

## SortedMap

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

## SortedSet

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