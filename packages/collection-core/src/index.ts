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

import /*#__INLINE__*/ { isIterableObject, isObject } from "@esfx/internal-guards";

export interface ReadonlyContainer<T> {
    /**
     * Tests whether an element is present in the container.
     */
    [ReadonlyContainer.has](value: T): boolean;
}

export namespace ReadonlyContainer {
    // #region ReadonlyContainer<T>

    /**
     * A well-known symbol used to define the `ReadonlyContainer#[ReadonlyContainer.has]` method.
     */
    export const has = Symbol.for("@esfx/collection-core!ReadonlyCollection.has");

    // #endregion ReadonlyContainer<T>

    export const name = "ReadonlyContainer";

    /**
     * Tests whether a value supports the minimal representation of a `ReadonlyContainer`.
     */
    export function hasInstance(value: any): value is ReadonlyContainer<unknown>;
    /**
     * Tests whether a value supports the minimal representation of a `ReadonlyContainer`.
     */
    export function hasInstance(value: any): value is ReadonlyContainer<unknown> {
        return isObject(value)
            && ReadonlyContainer.has in value;
    }
}

export interface Container<T> extends ReadonlyContainer<T> {
    /**
     * Adds an element to the container.
     */
    [Container.add](value: T): void;

    /**
     * Deletes an element from the container.
     */
    [Container.delete](value: T): boolean;
}

export namespace Container {
    // #region ReadonlyContainer<T>

    export import has = ReadonlyContainer.has;

    // #endregion ReadonlyContainer<T>

    // #region Container<T>

    /**
     * A well-known symbol used to define the `Container#[Container.add]` method.
     */
    export const add = Symbol.for("@esfx/collection-core!Collection.add");

    Container.delete = Symbol.for("@esfx/collection-core!Collection.delete") as typeof Container.delete;

    // #endregion Collection<T>

    export const name = "Container";

    /**
     * Tests whether a value supports the minimal representation of a `Container`.
     */
    export function hasInstance(value: any): value is Container<unknown>;
    /**
     * Tests whether a value supports the minimal representation of a `Container`.
     */
    export function hasInstance(value: any): value is Container<unknown> {
        return ReadonlyContainer.hasInstance(value)
            && Container.add in value
            && Container.delete in value;
    }
}

export declare namespace Container {
    /**
     * A well-known symbol used to define the `Container#[Container.delete]` method.
     */
    const _delete: unique symbol;
    export { _delete as delete };
}

export interface ReadonlyCollection<T> extends Iterable<T>, ReadonlyContainer<T> {
    /**
     * Gets the number of elements in the collection.
     */
    readonly [ReadonlyCollection.size]: number;

    /**
     * Tests whether an element is present in the collection.
     */
    [ReadonlyCollection.has](value: T): boolean;
}

export namespace ReadonlyCollection {
    // #region ReadonlyContainer<T>

    export import has = ReadonlyContainer.has;

    // #endregion ReadonlyContainer<T>

    // #region ReadonlyCollection<T>

    /**
     * A well-known symbol used to define the `ReadonlyCollection#[ReadonlyCollection.size]` property.
     */
    export const size = Symbol.for("@esfx/collection-core!ReadonlyCollection.size");

    // #endregion ReadonlyCollection<T>
    
    export const name = "ReadonlyCollection";

    /**
     * Tests whether a value supports the minimal representation of a `ReadonlyCollection`.
     */
    export function hasInstance<T>(value: Iterable<T>): value is ReadonlyCollection<T>;
    /**
     * Tests whether a value supports the minimal representation of a `ReadonlyCollection`.
     */
    export function hasInstance(value: any): value is ReadonlyCollection<unknown>;
    /**
     * Tests whether a value supports the minimal representation of a `ReadonlyCollection`.
     */
    export function hasInstance(value: any): value is ReadonlyCollection<unknown> {
        return ReadonlyContainer.hasInstance(value)
            && isIterableObject(value)
            && ReadonlyCollection.size in value;
    }
}

export interface Collection<T> extends ReadonlyCollection<T>, Container<T> {
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

export namespace Collection {
    // #region ReadonlyCollection<T>

    export import size = ReadonlyCollection.size;
    export import has = ReadonlyCollection.has;

    // #endregion ReadonlyCollection<T>

    // #region Container<T>

    export import add = Container.add;
    Collection.delete = Container.delete;

    // #endregion Container<T>

    // #region Collection<T>

    /**
     * A well-known symbol used to define the `Collection#[Collection.clear]` method.
     */
    export const clear = Symbol.for("@esfx/collection-core!Collection.clear");

    // #endregion Collection<T>

    export const name = "Collection";

    /**
     * Tests whether a value supports the minimal representation of a `Collection`.
     */
    export function hasInstance<T>(value: Iterable<T>): value is Collection<T>;
    /**
     * Tests whether a value supports the minimal representation of a `Collection`.
     */
    export function hasInstance(value: any): value is Collection<unknown>;
    /**
     * Tests whether a value supports the minimal representation of a `Collection`.
     */
    export function hasInstance(value: any): value is Collection<unknown> {
        return ReadonlyCollection.hasInstance(value)
            && Container.hasInstance(value)
            && Collection.clear in value;
    }
}

export declare namespace Collection {
    /**
     * A well-known symbol used to define the `Collection#[Collection.delete]` method.
     */
    const _delete: typeof Container.delete;
    export { _delete as delete };
}

export interface ReadonlyIndexedCollection<T> extends ReadonlyCollection<T> {
    /**
     * Gets the index for a value in the collection, or `-1` if the value was not found.
     */
    [ReadonlyIndexedCollection.indexOf](value: T, fromIndex?: number): number;

    /**
     * Gets the value at the specified index in the collection, or `undefined` if the index was outside of the bounds of the collection.
     */
    [ReadonlyIndexedCollection.getAt](index: number): T | undefined;
}

export namespace ReadonlyIndexedCollection {
    // #region ReadonlyCollection<T>

    export import size = ReadonlyCollection.size;
    export import has = ReadonlyCollection.has;

    // #endregion ReadonlyCollection<T>

    // #region ReadonlyIndexedCollection<T>

    /**
     * A well-known symbol used to define the `ReadonlyIndexedCollection#[ReadonlyIndexedCollection.indexOf]` method.
     */
    export const indexOf = Symbol.for("@esfx/collection-core!ReadonlyIndexedCollection.indexOf");

    /**
     * A well-known symbol used to define the `ReadonlyIndexedCollection#[ReadonlyIndexedCollection.getAt]` method.
     */
    export const getAt = Symbol.for("@esfx/collection-core!ReadonlyIndexedCollection.getAt");

    // #endregion ReadonlyIndexedCollection<T>

    export const name = "ReadonlyIndexedCollection";

    /**
     * Tests whether a value supports the minimal representation of a `ReadonlyIndexedCollection`.
     */
    export function hasInstance<T>(value: Iterable<T>): value is ReadonlyIndexedCollection<T>;
    /**
     * Tests whether a value supports the minimal representation of a `ReadonlyIndexedCollection`.
     */
    export function hasInstance(value: unknown): value is ReadonlyIndexedCollection<unknown>;
    /**
     * Tests whether a value supports the minimal representation of a `ReadonlyIndexedCollection`.
     */
    export function hasInstance(value: unknown): value is ReadonlyIndexedCollection<unknown> {
        return ReadonlyCollection.hasInstance(value)
            && ReadonlyIndexedCollection.indexOf in value
            && ReadonlyIndexedCollection.getAt in value;
    }
}

export interface FixedSizeIndexedCollection<T> extends ReadonlyIndexedCollection<T> {
    /**
     * Sets a value at the specified index in the collection.
     * @returns `true` if the value was set at the provided index, otherwise `false`.
     */
    [FixedSizeIndexedCollection.setAt](index: number, value: T): boolean;
}

export namespace FixedSizeIndexedCollection {
    // #region ReadonlyCollection<T>

    export import size = ReadonlyCollection.size;
    export import has = ReadonlyCollection.has;

    // #endregion ReadonlyCollection<T>

    // #region ReadonlyIndexedCollection<T>

    export import indexOf = ReadonlyIndexedCollection.indexOf;
    export import getAt = ReadonlyIndexedCollection.getAt;

    // #endregion ReadonlyIndexedCollection<T>

    // #region FixedSizeIndexedCollection<T>

    /**
     * A well-known symbol used to define the `FixedSizeIndexedCollection#[FixedSizeIndexedCollection.setAt]` method.
     */
    export const setAt = Symbol.for("@esfx/collection-core!FixedSizeIndexedCollection.setAt");

    // #endregion FixedSizeIndexedCollection<T>

    export const name = "FixedSizeIndexedCollection";

    /**
     * Tests whether a value supports the minimal representation of a `FixedSizeIndexedCollection`.
     */
    export function hasInstance<T>(value: Iterable<T>): value is FixedSizeIndexedCollection<T>;
    /**
     * Tests whether a value supports the minimal representation of a `FixedSizeIndexedCollection`.
     */
    export function hasInstance(value: unknown): value is FixedSizeIndexedCollection<unknown>;
    /**
     * Tests whether a value supports the minimal representation of a `FixedSizeIndexedCollection`.
     */
    export function hasInstance(value: unknown): value is FixedSizeIndexedCollection<unknown> {
        return ReadonlyIndexedCollection.hasInstance(value)
            && FixedSizeIndexedCollection.setAt in value;
    }
}

export interface IndexedCollection<T> extends FixedSizeIndexedCollection<T>, Collection<T> {
    /**
     * Inserts a value at the specified index in the collection, shifting any following elements to the right one position.
     */
    [IndexedCollection.insertAt](index: number, value: T): void;

    /**
     * Removes the value at the specified index in the collection, shifting any following elements to the left one position.
     */
    [IndexedCollection.removeAt](index: number): void;
}

export namespace IndexedCollection {
    // #region ReadonlyCollection<T>

    export import size = ReadonlyCollection.size;
    export import has = ReadonlyCollection.has;

    // #endregion ReadonlyCollection<T>

    // #region ReadonlyIndexedCollection<T>

    export import indexOf = ReadonlyIndexedCollection.indexOf;
    export import getAt = ReadonlyIndexedCollection.getAt;

    // #endregion ReadonlyIndexedCollection<T>

    // #region FixedSizeIndexedCollection<T>

    export import setAt = FixedSizeIndexedCollection.setAt;

    // #endregion FixedSizeIndexedCollection<T>

    // #region Collection<T>

    export import add = Collection.add;
    IndexedCollection.delete = Collection.delete;
    export import clear = Collection.clear;

    // #endregion Collection<T>

    // #region IndexedCollection<T>

    /**
     * A well-known symbol used to define the `IndexedCollection#[IndexedCollection.insertAt]` method.
     */
    export const insertAt = Symbol.for("@esfx/collection-core!IndexedCollection.insertAt");
    
    /**
     * A well-known symbol used to define the `IndexedCollection#[IndexedCollection.removeAt]` method.
     */
    export const removeAt = Symbol.for("@esfx/collection-core!IndexedCollection.removeAt");

    // #endregion IndexedCollection<T>

    export const name = "IndexedCollection";

    /**
     * Tests whether a value supports the minimal representation of an `IndexedCollection`.
     */
    export function hasInstance<T>(value: Iterable<T>): value is IndexedCollection<T>;
    /**
     * Tests whether a value supports the minimal representation of an `IndexedCollection`.
     */
    export function hasInstance(value: unknown): value is IndexedCollection<unknown>;
    /**
     * Tests whether a value supports the minimal representation of an `IndexedCollection`.
     */
    export function hasInstance(value: unknown): value is IndexedCollection<unknown> {
        return FixedSizeIndexedCollection.hasInstance(value)
            && IndexedCollection.insertAt in value
            && IndexedCollection.removeAt in value;
    }
}

export declare namespace IndexedCollection {
    const _delete: typeof Collection.delete;
    export { _delete as delete };
}

export interface ReadonlyKeyedContainer<K, V> {
    /**
     * Tests whether a key is present in the container.
     */
    [ReadonlyKeyedContainer.has](key: K): boolean;

    /**
     * Gets the value in the container associated with the provided key, if it exists.
     */
    [ReadonlyKeyedContainer.get](key: K): V | undefined;
}

export namespace ReadonlyKeyedContainer {
    // #region ReadonlyKeyedContainer<K, V>

    /**
     * A well-known symbol used to define the `ReadonlyKeyedContainer#[ReadonlyKeyedContainer.has]` method.
     */
    export const has = Symbol.for("@esfx/collection-core!ReadonlyKeyedContainer.has");

    /**
     * A well-known symbol used to define the `ReadonlyKeyedContainer#[ReadonlyKeyedContainer.get]` method.
     */
    export const get = Symbol.for("@esfx/collection-core!ReadonlyKeyedContainer.get");

    // #endregion ReadonlyKeyedContainer<K, V>

    export const name = "ReadonlyKeyedContainer";

    /**
     * Tests whether a value supports the minimal representation of a `ReadonlyKeyedContainer`.
     */
    export function hasInstance(value: unknown): value is ReadonlyKeyedContainer<unknown, unknown>;
    /**
     * Tests whether a value supports the minimal representation of a `ReadonlyKeyedCollection`.
     */
    export function hasInstance(value: unknown): value is ReadonlyKeyedContainer<unknown, unknown> {
        return isObject(value)
            && ReadonlyKeyedContainer.has in value
            && ReadonlyKeyedContainer.get in value;
    }
}

export interface KeyedContainer<K, V> extends ReadonlyKeyedContainer<K, V> {
    /**
     * Sets a value in the container for the provided key.
     */
    [KeyedContainer.set](key: K, value: V): void;

    /**
     * Deletes a key and its associated value from the container.
     * @returns `true` if the key was found and removed; otherwise, `false`.
     */
    [KeyedContainer.delete](key: K): boolean;
}

export namespace KeyedContainer {
    // #region ReadonlyKeyedContainer<K, V>

    export import has = ReadonlyKeyedContainer.has;
    export import get = ReadonlyKeyedContainer.get;

    // #endregion ReadonlyKeyedContainer<K, V>

    // #region KeyedContainer<K, V>

    /**
     * A well-known symbol used to define the `KeyedContainer#[KeyedContainer.set]` method.
     */
    export const set = Symbol.for("@esfx/collection-core!KeyedCollection.set");
    
    KeyedContainer.delete = Symbol.for("@esfx/collection-core!KeyedCollection.delete") as typeof KeyedCollection.delete;
    
    // #endregion KeyedContainer<K, V>

    export const name = "KeyedContainer";

    /**
     * Tests whether a value supports the minimal representation of a `KeyedContainer`.
     */
    export function hasInstance(value: unknown): value is KeyedContainer<unknown, unknown>;
    /**
     * Tests whether a value supports the minimal representation of a `KeyedContainer`.
     */
    export function hasInstance(value: unknown): value is KeyedContainer<unknown, unknown> {
        return ReadonlyKeyedContainer.hasInstance(value)
            && KeyedContainer.set in value
            && KeyedContainer.delete in value;
    }
}

export declare namespace KeyedContainer {
    /**
     * A well-known symbol used to define the `KeyedContainer#[KeyedContainer.delete]` method.
     */
    const _delete: unique symbol;
    export { _delete as delete };
}

export interface ReadonlyKeyedCollection<K, V> extends ReadonlyKeyedContainer<K, V>, Iterable<[K, V]> {
    /**
     * Gets the number of elements in the collection.
     */
    readonly [ReadonlyKeyedCollection.size]: number;

    /**
     * Gets an `IterableIterator` for the keys present in the collection.
     */
    [ReadonlyKeyedCollection.keys](): IterableIterator<K>;

    /**
     * Gets an `IterableIterator` for the values present in the collection.
     */
    [ReadonlyKeyedCollection.values](): IterableIterator<V>;
}

export namespace ReadonlyKeyedCollection {
    // #region ReadonlyKeyedContainer<K, V>

    export import has = ReadonlyKeyedContainer.has;
    export import get = ReadonlyKeyedContainer.get;

    // #endregion ReadonlyKeyedContainer<K, V>

    // #region ReadonlyKeyedCollection<K, V>

    /**
     * A well-known symbol used to define the `ReadonlyKeyedCollection#[ReadonlyKeyedCollection.size]` property.
     */
    export const size = Symbol.for("@esfx/collection-core!ReadonlyKeyedCollection.size");

    /**
     * A well-known symbol used to define the `ReadonlyKeyedCollection#[ReadonlyKeyedCollection.keys]` method.
     */
    export const keys = Symbol.for("@esfx/collection-core!ReadonlyKeyedCollection.keys");

    /**
     * A well-known symbol used to define the `ReadonlyKeyedCollection#[ReadonlyKeyedCollection.values]` method.
     */
    export const values = Symbol.for("@esfx/collection-core!ReadonlyKeyedCollection.values");

    // #endregion ReadonlyKeyedCollection<K, V>

    export const name = "ReadonlyKeyedCollection";

    /**
     * Tests whether a value supports the minimal representation of a `ReadonlyKeyedCollection`.
     */
    export function hasInstance<K, V>(value: Iterable<[K, V]>): value is ReadonlyKeyedCollection<K, V>;
    /**
     * Tests whether a value supports the minimal representation of a `ReadonlyKeyedCollection`.
     */
    export function hasInstance(value: unknown): value is ReadonlyKeyedCollection<unknown, unknown>;
    /**
     * Tests whether a value supports the minimal representation of a `ReadonlyKeyedCollection`.
     */
    export function hasInstance(value: unknown): value is ReadonlyKeyedCollection<unknown, unknown> {
        return isIterableObject(value)
            && ReadonlyKeyedContainer.hasInstance(value)
            && ReadonlyKeyedCollection.size in value
            && ReadonlyKeyedCollection.keys in value
            && ReadonlyKeyedCollection.values in value;
    }
}

export interface KeyedCollection<K, V> extends ReadonlyKeyedCollection<K, V>, KeyedContainer<K, V> {
    /**
     * Clears the collection.
     */
    [KeyedCollection.clear](): void;
}

export namespace KeyedCollection {
    // #region ReadonlyKeyedCollection<K, V>

    export import size = ReadonlyKeyedCollection.size;
    export import has = ReadonlyKeyedCollection.has;
    export import get = ReadonlyKeyedCollection.get;
    export import keys = ReadonlyKeyedCollection.keys;
    export import values = ReadonlyKeyedCollection.values;

    // #endregion ReadonlyKeyedCollection<K, V>

    // #region KeyedContainer<K, V>
    
    export import set = KeyedContainer.set;
    KeyedCollection.delete = KeyedContainer.delete;

    // #endregion KeyedContainer<K, V>

    // #region KeyedCollection<K, V>

    /**
     * A well-known symbol used to define the `KeyedCollection#[KeyedCollection.clear]` method.
     */
    export const clear = Symbol.for("@esfx/collection-core!KeyedCollection.clear");

    // #endregion KeyedCollection<K, V>

    export const name = "KeyedCollection";

    /**
     * Tests whether a value supports the minimal representation of a `KeyedCollection`.
     */
    export function hasInstance<K, V>(value: Iterable<[K, V]>): value is KeyedCollection<K, V>;
    /**
     * Tests whether a value supports the minimal representation of a `KeyedCollection`.
     */
    export function hasInstance(value: unknown): value is KeyedCollection<unknown, unknown>;
    /**
     * Tests whether a value supports the minimal representation of a `KeyedCollection`.
     */
    export function hasInstance(value: unknown): value is KeyedCollection<unknown, unknown> {
        return ReadonlyKeyedCollection.hasInstance(value)
            && KeyedContainer.hasInstance(value)
            && KeyedCollection.clear in value;
    }
}

export declare namespace KeyedCollection {
    /**
     * A well-known symbol used to define the `KeyedCollection#[KeyedCollection.delete]` method.
     */
    const _delete: typeof KeyedContainer.delete;
    export { _delete as delete };
}

export interface ReadonlyKeyedMultiCollection<K, V> extends Iterable<[K, V]> {
    /**
     * Gets the number of elements in the collection.
     */
    readonly [ReadonlyKeyedMultiCollection.size]: number;

    /**
     * Tests whether a key is present in the collection.
     */
    [ReadonlyKeyedMultiCollection.has](key: K): boolean;

    /**
     * Tests whether a key and value is present in the collection.
     */
    [ReadonlyKeyedMultiCollection.hasValue](key: K, value: V): boolean;

    /**
     * Gets the value in the collection associated with the provided key, if it exists.
     */
    [ReadonlyKeyedMultiCollection.get](key: K): Iterable<V> | undefined;

    /**
     * Gets an `IterableIterator` for the keys present in the collection.
     */
    [ReadonlyKeyedMultiCollection.keys](): IterableIterator<K>;

    /**
     * Gets an `IterableIterator` for the values present in the collection.
     */
    [ReadonlyKeyedMultiCollection.values](): IterableIterator<V>;
}

export namespace ReadonlyKeyedMultiCollection {
    // #region ReadonlyKeyedMultiCollection<K, V>

    /**
     * A well-known symbol used to define the `ReadonlyKeyedMultiCollection#[ReadonlyKeyedMultiCollection.size]` property.
     */
    export const size = Symbol.for("@esfx/collection-core!ReadonlyKeyedMultiCollection.size");
    
    /**
     * A well-known symbol used to define the `ReadonlyKeyedMultiCollection#[ReadonlyKeyedMultiCollection.has]` method.
     */
    export const has = Symbol.for("@esfx/collection-core!ReadonlyKeyedMultiCollection.has");
    
    /**
     * A well-known symbol used to define the `ReadonlyKeyedMultiCollection#[ReadonlyKeyedMultiCollection.hasValue]` method.
     */
    export const hasValue = Symbol.for("@esfx/collection-core!ReadonlyKeyedMultiCollection.hasValue");
    
    /**
     * A well-known symbol used to define the `ReadonlyKeyedMultiCollection#[ReadonlyKeyedMultiCollection.get]` method.
     */
    export const get = Symbol.for("@esfx/collection-core!ReadonlyKeyedMultiCollection.get");
    
    /**
     * A well-known symbol used to define the `ReadonlyKeyedMultiCollection#[ReadonlyKeyedMultiCollection.keys]` method.
     */
    export const keys = Symbol.for("@esfx/collection-core!ReadonlyKeyedMultiCollection.keys");
    
    /**
     * A well-known symbol used to define the `ReadonlyKeyedMultiCollection#[ReadonlyKeyedMultiCollection.values]` method.
     */
    export const values = Symbol.for("@esfx/collection-core!ReadonlyKeyedMultiCollection.values");

    // #endregion ReadonlyKeyedMultiCollection<K, V>

    export const name = "ReadonlyKeyedMultiCollection";

    /**
     * Tests whether a value supports the minimal representation of a `ReadonlyKeyedMultiCollection`.
     */
    export function hasInstance<K, V>(value: Iterable<[K, V]>): value is ReadonlyKeyedMultiCollection<K, V>;
    /**
     * Tests whether a value supports the minimal representation of a `ReadonlyKeyedMultiCollection`.
     */
    export function hasInstance(value: unknown): value is ReadonlyKeyedMultiCollection<unknown, unknown>;
    /**
     * Tests whether a value supports the minimal representation of a `ReadonlyKeyedMultiCollection`.
     */
    export function hasInstance(value: unknown): value is ReadonlyKeyedMultiCollection<unknown, unknown> {
        return isIterableObject(value)
            && ReadonlyKeyedMultiCollection.size in value
            && ReadonlyKeyedMultiCollection.has in value
            && ReadonlyKeyedMultiCollection.hasValue in value
            && ReadonlyKeyedMultiCollection.get in value
            && ReadonlyKeyedMultiCollection.keys in value
            && ReadonlyKeyedMultiCollection.values in value;
    }
}

export interface KeyedMultiCollection<K, V> extends ReadonlyKeyedMultiCollection<K, V> {
    /**
     * Adds a value to the collection for the provided key.
     */
    [KeyedMultiCollection.add](key: K, value: V): void;

    /**
     * Deletes a key and its associated values from the collection.
     * @returns The number of values removed when the key was deleted.
     */
    [KeyedMultiCollection.delete](key: K): number;

    /**
     * Deletes a key and its associated value from the collection.
     * @returns `true` if the key and value were found and removed; otherwise, `false`.
     */
    [KeyedMultiCollection.deleteValue](key: K, value: V): boolean;

    /**
     * Clears the collection.
     */
    [KeyedMultiCollection.clear](): void;
}

export namespace KeyedMultiCollection {
    // #region ReadonlyKeyedMultiCollection<K, V>

    export import size = ReadonlyKeyedMultiCollection.size;
    export import has = ReadonlyKeyedMultiCollection.has;
    export import hasValue = ReadonlyKeyedMultiCollection.hasValue;
    export import get = ReadonlyKeyedMultiCollection.get;
    export import keys = ReadonlyKeyedMultiCollection.keys;
    export import values = ReadonlyKeyedMultiCollection.values;

    // #endregion ReadonlyKeyedMultiCollection<K, V>

    // #region KeyedMultiCollection<K, V>

    /**
     * A well-known symbol used to define the `KeyedMultiCollection#[KeyedMultiCollection.add]` method.
     */
    export const add = Symbol.for("@esfx/collection-core!KeyedMultiCollection.add");
    
    KeyedMultiCollection.delete = Symbol.for("@esfx/collection-core!KeyedMultiCollection.delete") as typeof KeyedMultiCollection.delete;
    
    /**
     * A well-known symbol used to define the `KeyedMultiCollection#[KeyedMultiCollection.deleteValue]` method.
     */
    export const deleteValue = Symbol.for("@esfx/collection-core!KeyedMultiCollection.deleteValue");
    
    /**
     * A well-known symbol used to define the `KeyedMultiCollection#[KeyedMultiCollection.clear]` method.
     */
    export const clear = Symbol.for("@esfx/collection-core!KeyedMultiCollection.clear");

    // #endregion KeyedMultiCollection<K, V>

    export const name = "KeyedMultiCollection";

    /**
     * Tests whether a value supports the minimal representation of a `KeyedMultiCollection`.
     */
    export function hasInstance<K, V>(value: Iterable<[K, V]>): value is KeyedMultiCollection<K, V>;
    /**
     * Tests whether a value supports the minimal representation of a `KeyedMultiCollection`.
     */
    export function hasInstance(value: unknown): value is KeyedMultiCollection<unknown, unknown>;
    /**
     * Tests whether a value supports the minimal representation of a `KeyedMultiCollection`.
     */
    export function hasInstance(value: unknown): value is KeyedMultiCollection<unknown, unknown> {
        return ReadonlyKeyedMultiCollection.hasInstance(value)
            && KeyedMultiCollection.add in value
            && KeyedMultiCollection.delete in value
            && KeyedMultiCollection.deleteValue in value
            && KeyedMultiCollection.clear in value;
    }
}

export declare namespace KeyedMultiCollection {
    /**
     * A well-known symbol used to define the `KeyedMultiCollection#[KeyedMultiCollection.delete]` method.
     */
    const _delete: unique symbol;
    export { _delete as delete };
}
