# `@esfx/collection-core`

The `@esfx/collection-core` package provides a low-level Symbol-based API for defining common collection behaviors.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/collection-core
```

# Usage

```ts
import { Collection } from "@esfx/collection-core";

class MyCollection {
    constructor() {
        this._items = new Set();
    }

    // Your implementation
    get count() { return this._items.size; }
    contains(value) { return this._items.has(value); }
    add(value) { this._items.add(value); }
    remove(value) { return this._items.delete(value); }
    clear() { this._items.clear(); }

    // Implement the `Collection` interface for cross-library consistency
    get [Collection.size]() { return this.count; }
    [Collection.has](value) { return this.contains(value); }
    [Collection.add](value) { this.add(value); }
    [Collection.delete](value) { return this.remove(value); }
    [Collection.clear]() { this.clear(); }
    [Symbol.iterator]() { return this._items.values(); }
}
```

# API

* [ReadonlyCollection](#readonlycollection) - The minimal set of operations needed to read from a collection.
* [Collection](#collection) - The minimal set of operations needed to read from and write to a collection.
* [ReadonlyIndexedCollection](#readonlyindexedcollection) - The minimal set of operations needed to read from an integer-indexed collection.
* [FixedSizeIndexedCollection](#fixedsizeindexedcollection) - The minimal set of operations needed to read from or write to an integer-indexed collection where the size may be fixed (such as with Typed Arrays).
* [IndexedCollection](#indexedcollection) - The minimal set of operations needed to read from or write to an integer-indexed collection.
* [ReadonlyKeyedCollection](#readonlykeyedcollection) - The minimal set of operations needed to read from a keyed collection.
* [KeyedCollection](#keyedcollection) - The minimal set of operations needed to read from or write to a keyed collection.

### ReadonlyCollection
```ts
export interface ReadonlyCollection<T> extends Iterable<T> {
  /**
   * Gets the number of elements in the collection.
   */
  readonly [ReadonlyCollection.size]: number;

  /**
   * Tests whether an element is present in the collection.
   */
  [ReadonlyCollection.has](value: T): boolean;
}

export declare namespace ReadonlyCollection {
  /**
   * A well-known symbol used to define the `ReadonlyCollection#[ReadonlyCollection.size]` property.
   */
  export const size: unique symbol;

  /**
   * A well-known symbol used to define the `ReadonlyCollection#[ReadonlyCollection.has]` method.
   */
  export const has: unique symbol;

  /**
   * Tests whether a value supports the minimal representation of a `ReadonlyCollection`.
   */
  export function isReadonlyCollection<T>(value: Iterable<T>): value is ReadonlyCollection<T>;
  /**
   * Tests whether a value supports the minimal representation of a `ReadonlyCollection`.
   */
  export function isReadonlyCollection(value: any): value is ReadonlyCollection<unknown>;
}
```

### Collection
```ts
export interface Collection<T> extends ReadonlyCollection<T> {
  /**
   * Adds an element to the collection.
   */
  [Collection.add](value: T): void;

  /**
   * Deletes an element from the collection.
   */
  [Collection.delete](value: T): boolean;

  /**
   * Clears the collection.
   */
  [Collection.clear](): void;
}

export declare namespace Collection {
  // from ReadonlyCollection<T>
  export import size = ReadonlyCollection.size;
  export import has = ReadonlyCollection.has;
  export import isReadonlyCollection = ReadonlyCollection.isReadonlyCollection;

  /**
   * A well-known symbol used to define the `Collection#[Collection.add]` method.
   */
  export const add: unique symbol;

  /**
   * A well-known symbol used to define the `Collection#[Collection.clear]` method.
   */
  export const clear: unique symbol;

  /**
   * A well-known symbol used to define the `Collection#[Collection.delete]` method.
   */
  const _delete: unique symbol;
  export { _delete as delete };

  /**
   * Tests whether a value supports the minimal representation of a `Collection`.
   */
  export function isCollection<T>(value: Iterable<T>): value is Collection<T>;
  /**
   * Tests whether a value supports the minimal representation of a `Collection`.
   */
  export function isCollection(value: any): value is Collection<unknown>;
}
```

### ReadonlyIndexedCollection
```ts
export interface ReadonlyIndexedCollection<T> extends ReadonlyCollection<T> {
  /**
   * Gets the index for a value in the collection, or `-1` if the value was not found.
   */
  [ReadonlyIndexedCollection.indexOf](value: T, fromIndex?: number): number;

  /**
   * Gets the value at the specified index in the collection, or `undefined` if the index was outside
   * of the bounds of the collection.
   */
  [ReadonlyIndexedCollection.getAt](index: number): T | undefined;
}

export declare namespace ReadonlyIndexedCollection {
  // from ReadonlyCollection<T>
  export import size = ReadonlyCollection.size;
  export import has = ReadonlyCollection.has;
  export import isReadonlyCollection = ReadonlyCollection.isReadonlyCollection;

  /**
   * A well-known symbol used to define the `ReadonlyIndexedCollection#[ReadonlyIndexedCollection.indexOf]`
   * method.
   */
  export const indexOf: unique symbol;

  /**
   * A well-known symbol used to define the `ReadonlyIndexedCollection#[ReadonlyIndexedCollection.getAt]`
   * method.
   */
  export const getAt: unique symbol;

  /**
   * Tests whether a value supports the minimal representation of a `ReadonlyIndexedCollection`.
   */
  export function isReadonlyIndexedCollection<T>(value: Iterable<T>): value is ReadonlyIndexedCollection<T>;
  /**
   * Tests whether a value supports the minimal representation of a `ReadonlyIndexedCollection`.
   */
  export function isReadonlyIndexedCollection(value: unknown): value is ReadonlyIndexedCollection<unknown>;
}
```

### FixedSizeIndexedCollection
```ts
export interface FixedSizeIndexedCollection<T> extends ReadonlyIndexedCollection<T> {
  /**
   * Sets a value at the specified index in the collection.
   * @returns `true` if the value was set at the provided index, otherwise `false`.
   */
  [FixedSizeIndexedCollection.setAt](index: number, value: T): boolean;
}

export declare namespace FixedSizeIndexedCollection {
  // from ReadonlyCollection<T>
  export import size = ReadonlyCollection.size;
  export import has = ReadonlyCollection.has;
  export import isReadonlyCollection = ReadonlyCollection.isReadonlyCollection;

  // from ReadonlyIndexedCollection<T>
  export import indexOf = ReadonlyIndexedCollection.indexOf;
  export import getAt = ReadonlyIndexedCollection.getAt;
  export import isReadonlyIndexedCollection = ReadonlyIndexedCollection.isReadonlyIndexedCollection;

  /**
   * A well-known symbol used to define the `FixedSizeIndexedCollection#[FixedSizeIndexedCollection.setAt]`
   * method.
   */
  export const setAt: unique symbol;

  /**
   * Tests whether a value supports the minimal representation of a `FixedSizeIndexedCollection`.
   */
  export function isFixedSizeIndexedCollection<T>(value: Iterable<T>): value is FixedSizeIndexedCollection<T>;
  /**
   * Tests whether a value supports the minimal representation of a `FixedSizeIndexedCollection`.
   */
  export function isFixedSizeIndexedCollection(value: unknown): value is FixedSizeIndexedCollection<unknown>;
}
```

### IndexedCollection
```ts
export interface IndexedCollection<T> extends FixedSizeIndexedCollection<T>, Collection<T> {
  /**
   * Inserts a value at the specified index in the collection, shifting any following elements to the right
   * one position.
   */
  [IndexedCollection.insertAt](index: number, value: T): void;

  /**
   * Removes the value at the specified index in the collection, shifting any following elements to the left
   * one position.
   */
  [IndexedCollection.removeAt](index: number): void;
}

export declare namespace IndexedCollection {
  // from ReadonlyCollection<T>
  export import size = ReadonlyCollection.size;
  export import has = ReadonlyCollection.has;
  export import isReadonlyCollection = ReadonlyCollection.isReadonlyCollection;

  // from ReadonlyIndexedCollection<T>
  export import indexOf = ReadonlyIndexedCollection.indexOf;
  export import getAt = ReadonlyIndexedCollection.getAt;
  export import isReadonlyIndexedCollection = ReadonlyIndexedCollection.isReadonlyIndexedCollection;

  // from FixedSizeIndexedCollection<T>
  export import setAt = FixedSizeIndexedCollection.setAt;
  export import isFixedSizeIndexedCollection = FixedSizeIndexedCollection.isFixedSizeIndexedCollection;

  // from Collection<T>
  export import add = Collection.add;
  export import clear = Collection.clear;
  export import isCollection = Collection.isCollection;
  const _delete: typeof Collection.delete;
  export { _delete as delete };

  /**
   * A well-known symbol used to define the `IndexedCollection#[IndexedCollection.insertAt]` method.
   */
  export const insertAt: unique symbol;

  /**
   * A well-known symbol used to define the `IndexedCollection#[IndexedCollection.removeAt]` method.
   */
  export const removeAt: unique symbol;

  /**
   * Tests whether a value supports the minimal representation of an `IndexedCollection`.
   */
  export function isIndexedCollection<T>(value: Iterable<T>): value is IndexedCollection<T>;
  /**
   * Tests whether a value supports the minimal representation of an `IndexedCollection`.
   */
  export function isIndexedCollection(value: unknown): value is IndexedCollection<unknown>;
}
```

### ReadonlyKeyedCollection
```ts
export interface ReadonlyKeyedCollection<K, V> extends Iterable<[K, V]> {
  /**
   * Gets the number of elements in the collection.
   */
  readonly [ReadonlyKeyedCollection.size]: number;

  /**
   * Tests whether a key is present in the collection.
   */
  [ReadonlyKeyedCollection.has](key: K): boolean;

  /**
   * Gets the value in the collection associated with the provided key, if it exists.
   */
  [ReadonlyKeyedCollection.get](key: K): V | undefined;

  /**
   * Gets an `IterableIterator` for the keys present in the collection.
   */
  [ReadonlyKeyedCollection.keys](): IterableIterator<K>;

  /**
   * Gets an `IterableIterator` for the values present in the collection.
   */
  [ReadonlyKeyedCollection.values](): IterableIterator<V>;
}

export declare namespace ReadonlyKeyedCollection {
  /**
   * A well-known symbol used to define the `ReadonlyKeyedCollection#[ReadonlyKeyedCollection.size]` property.
   */
  export const size: unique symbol;

  /**
   * A well-known symbol used to define the `ReadonlyKeyedCollection#[ReadonlyKeyedCollection.has]` method.
   */
  export const has: unique symbol;

  /**
   * A well-known symbol used to define the `ReadonlyKeyedCollection#[ReadonlyKeyedCollection.get]` method.
   */
  export const get: unique symbol;

  /**
   * A well-known symbol used to define the `ReadonlyKeyedCollection#[ReadonlyKeyedCollection.keys]` method.
   */
  export const keys: unique symbol;

  /**
   * A well-known symbol used to define the `ReadonlyKeyedCollection#[ReadonlyKeyedCollection.values]` method.
   */
  export const values: unique symbol;

  /**
   * Tests whether a value supports the minimal representation of a `ReadonlyKeyedCollection`.
   */
  export function isReadonlyKeyedCollection<K, V>(value: Iterable<[K, V]>): value is ReadonlyKeyedCollection<K, V>;
  /**
   * Tests whether a value supports the minimal representation of a `ReadonlyKeyedCollection`.
   */
  export function isReadonlyKeyedCollection(value: unknown): value is ReadonlyKeyedCollection<unknown, unknown>;
}
```

### KeyedCollection
```ts
export interface KeyedCollection<K, V> extends ReadonlyKeyedCollection<K, V> {
  /**
   * Sets a value in the collection for the provided key.
   */
  [KeyedCollection.set](key: K, value: V): void;

  /**
   * Deletes a key and its associated value from the collection.
   * @returns `true` if the key was found and removed; otherwise, `false`.
   */
  [KeyedCollection.delete](key: K): boolean;

  /**
   * Clears the collection.
   */
  [KeyedCollection.clear](): void;
}

export declare namespace KeyedCollection {
  // from ReadonlyKeyedCollection<K, V>
  export import size = ReadonlyKeyedCollection.size;
  export import has = ReadonlyKeyedCollection.has;
  export import get = ReadonlyKeyedCollection.get;
  export import keys = ReadonlyKeyedCollection.keys;
  export import values = ReadonlyKeyedCollection.values;
  export import isReadonlyKeyedCollection = ReadonlyKeyedCollection.isReadonlyKeyedCollection;

  /**
   * A well-known symbol used to define the `KeyedCollection#[KeyedCollection.set]` method.
   */
  export const set: unique symbol;

  /**
   * A well-known symbol used to define the `KeyedCollection#[KeyedCollection.delete]` method.
   */
  const _delete: unique symbol;
  export { _delete as delete };

  /**
   * A well-known symbol used to define the `KeyedCollection#[KeyedCollection.clear]` method.
   */
  export const clear: unique symbol;

  /**
   * Tests whether a value supports the minimal representation of a `KeyedCollection`.
   */
  export function isKeyedCollection<K, V>(value: Iterable<[K, V]>): value is KeyedCollection<K, V>;
  /**
   * Tests whether a value supports the minimal representation of a `KeyedCollection`.
   */
  export function isKeyedCollection(value: unknown): value is KeyedCollection<unknown, unknown>;
}
```
