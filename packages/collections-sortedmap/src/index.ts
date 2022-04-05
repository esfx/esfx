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

import /*#__INLINE__*/ { isFunction, isIterable, isUndefined } from '@esfx/internal-guards';
import /*#__INLINE__*/ { binarySearch } from '@esfx/internal-binarysearch';
import { KeyedCollection, ReadonlyKeyedCollection } from "@esfx/collection-core";
import { Comparer, Comparison } from "@esfx/equatable";

export class SortedMap<K, V> implements KeyedCollection<K, V> {
    private _keys: K[] = [];
    private _values: V[] = [];
    private _comparer: Comparer<K>;

    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, writable: true, value: "SortedMap" });
    }

    constructor(comparer?: Comparison<K> | Comparer<K>);
    constructor(iterable?: Iterable<[K, V]>, comparer?: Comparison<K> | Comparer<K>);
    constructor(...args: [(Comparison<K> | Comparer<K>)?] | [Iterable<[K, V]>?, (Comparison<K> | Comparer<K>)?]) {
        let iterable: Iterable<[K, V]> | undefined;
        let comparer: Comparison<K> | Comparer<K> | undefined;
        if (args.length > 0) {
            const arg0 = args[0];
            if (isUndefined(arg0) || isIterable(arg0)) {
                iterable = arg0;
                if (args.length > 1) comparer = args[1];
            }
            else {
                comparer = arg0;
            }
        }
        
        comparer ??= Comparer.defaultComparer;
        this._comparer = typeof comparer === "function" ? Comparer.create(comparer) : comparer;
        if (iterable) {
            for (const [key, value] of iterable) {
                this.set(key, value);
            }
        }
    }

    get comparer() {
        return this._comparer;
    }

    get size() {
        return this._keys.length;
    }

    has(key: K) {
        return binarySearch(this._keys, key, this._comparer) >= 0;
    }

    get(key: K) {
        const index = binarySearch(this._keys, key, this._comparer);
        return index >= 0 ? this._values[index] : undefined;
    }

    set(key: K, value: V) {
        const index = binarySearch(this._keys, key, this._comparer);
        if (index >= 0) {
            this._values[index] = value;
        }
        else {
            this._keys.splice(~index, 0, key);
            this._values.splice(~index, 0, value);
        }
        return this;
    }

    delete(key: K) {
        const index = binarySearch(this._keys, key, this._comparer);
        if (index >= 0) {
            this._keys.splice(index, 1);
            this._values.splice(index, 1);
            return true;
        }
        return false;
    }

    clear() {
        this._keys.length = 0;
        this._values.length = 0;
    }

    keys() {
        return this._keys.values();
    }

    values() {
        return this._values.values();
    }

    * entries() {
        for (let i = 0; i < this._keys.length; i++) {
            yield [this._keys[i], this._values[i]] as [K, V];
        }
    }

    [Symbol.iterator]() {
        return this.entries();
    }

    forEach(callback: (value: V, key: K, map: this) => void, thisArg?: unknown) {
        if (!isFunction(callback)) throw new TypeError("Function expected: callback");
        for (const [key, value] of this) {
            callback.call(thisArg, value, key, this);
        }
    }

    declare [Symbol.toStringTag]: string;

    get [KeyedCollection.size]() { return this.size; }
    [KeyedCollection.has](key: K) { return this.has(key); }
    [KeyedCollection.get](key: K) { return this.get(key); }
    [KeyedCollection.set](key: K, value: V) { this.set(key, value); }
    [KeyedCollection.delete](key: K) { return this.delete(key); }
    [KeyedCollection.clear]() { this.clear(); }
    [KeyedCollection.keys]() { return this.keys(); }
    [KeyedCollection.values]() { return this.values(); }
}

export interface ReadonlySortedMap<K, V> extends ReadonlyMap<K, V>, ReadonlyKeyedCollection<K, V> {
    readonly comparer: Comparer<K>;
    [Symbol.iterator](): IterableIterator<[K, V]>;
}
