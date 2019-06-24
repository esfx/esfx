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

import { isIterable, isObject, isDefined, isNumber } from "@esfx/internal-guards";
import { Equaler } from "@esfx/equatable";
import { ReadonlyCollection, KeyedMultiCollection } from "@esfx/collection-core";
import { HashMap } from "@esfx/collections-hashmap";
import { HashSet, ReadonlyHashSet } from "@esfx/collections-hashset";

export interface MultiMapOptions<K, V> {
    keyEqualer?: Equaler<K>;
    valueEqualer?: Equaler<V>;
}

export class MultiMap<K, V> implements KeyedMultiCollection<K, V> {
    private _map: HashMap<K, HashSet<V>>;
    private _keyEqualer: Equaler<K>;
    private _valueEqualer: Equaler<V>;
    private _size = 0;

    constructor(options?: MultiMapOptions<K, V>);
    constructor(iterable?: Iterable<[K, V]>, options?: MultiMapOptions<K, V>);
    constructor(capacity: number, options?: MultiMapOptions<K, V>);
    constructor(...args: [MultiMapOptions<K, V>?] | [number, MultiMapOptions<K, V>?] | [Iterable<[K, V]>?, MultiMapOptions<K, V>?]) {
        let capacity: number | undefined;
        let iterable: Iterable<[K, V]> | undefined;
        let options: MultiMapOptions<K, V> | undefined;
        if (isCapacityKeyEqualerValueEqualerOverload(args)) {
            [capacity, options = {}] = args;
        }
        else {
            capacity = 0;
            if (isIterableKeyEqualerValueEqualerOverload(args)) {
                [iterable, options = {}] = args;
            } else {
                options = {};
            }
        }
        const { keyEqualer = Equaler.defaultEqualer, valueEqualer = Equaler.defaultEqualer } = options;
        this._map = new HashMap<K, HashSet<V>>(capacity, keyEqualer);
        this._keyEqualer = keyEqualer;
        this._valueEqualer = valueEqualer;
        if (iterable) {
            for (const [key, value] of iterable) {
                this.add(key, value);
            }
        }
    }

    get keyEqualer() {
        return this._keyEqualer;
    }

    get valueEqualer() {
        return this._valueEqualer;
    }

    get size() {
        return this._size;
    }

    has(key: K, value: V) {
        const values = this._map.get(key);
        if (values) {
            return values.has(value);
        }
        return false;
    }

    hasKey(key: K) {
        return this._map.has(key);
    }

    get(key: K): ReadonlyHashSet<V> | undefined {
        return this._map.get(key);
    }

    add(key: K, value: V): this {
        let values = this._map.get(key);
        if (!values) {
            values = new HashSet(this._valueEqualer);
            this._map.set(key, values);
        }

        const size = values.size;
        values.add(value);

        this._size += values.size - size;
        return this;
    }

    delete(key: K, value: V) {
        const values = this._map.get(key);
        if (values) {
            const size = values.size;
            if (values.delete(value)) {
                this._size += values.size - size;
                if (values.size <= 0) {
                    this._map.delete(key);
                }
                return true;
            }
        }
        return false;
    }

    deleteKey(key: K) {
        const values = this._map.get(key);
        if (values) {
            this._size -= values.size;
            this._map.delete(key);
            return values.size;
        }
        return 0;
    }

    clear() {
        this._map.clear();
        this._size = 0;
    }

    ensureCapacity(capacity: number) {
        return this._map.ensureCapacity(capacity);
    }

    trimExcess(capacity?: number) {
        this._map.trimExcess(capacity);
    }

    keys() {
        return this._map.keys();
    }

    * values() {
        for (const values of this._map.values()) {
            yield* values;
        }
    }

    * entries() {
        for (const [key, values] of this._map) {
            for (const value of values) {
                yield [key, value] as [K, V];
            }
        }
    }

    [Symbol.iterator]() {
        return this.entries();
    }

    forEach(callback: (value: V, key: K, map: this) => void, thisArg?: any) {
        for (const [key, values] of this._map) {
            for (const value of values) {
                callback.call(thisArg, value, key, this);
            }
        }
    }

    [Symbol.toStringTag]: string;

    get [KeyedMultiCollection.size]() { return this.size; }
    [KeyedMultiCollection.hasKey](key: K) { return this.hasKey(key); }
    [KeyedMultiCollection.hasKeyValue](key: K, value: V): boolean { return this.has(key, value); }
    [KeyedMultiCollection.get](key: K) { return this.get(key) }
    [KeyedMultiCollection.keys]() { return this.keys(); }
    [KeyedMultiCollection.values]() { return this.values(); }
    [KeyedMultiCollection.add](key: K, value: V) { this.add(key, value); }
    [KeyedMultiCollection.deleteKey](key: K) { return this.deleteKey(key); }
    [KeyedMultiCollection.deleteKeyValue](key: K, value: V) { return this.delete(key, value); }
    [KeyedMultiCollection.clear]() { this.clear(); }
}

Object.defineProperty(MultiMap, Symbol.toStringTag, {
    enumerable: false,
    configurable: true,
    writable: true,
    value: "MultiMap"
});

type OptionsOverload<K, V> = [MultiMapOptions<K, V>?];
type IterableOptionsOverload<K, V> = [Iterable<[K, V]>?, MultiMapOptions<K, V>?];
type CapacityOptionsOverload<K, V> = [number, MultiMapOptions<K, V>?];
type MultiMapOverloads<K, V> =
    | OptionsOverload<K, V>
    | IterableOptionsOverload<K, V>
    | CapacityOptionsOverload<K, V>;

function isIterableKeyEqualerValueEqualerOverload<K, V>(args: MultiMapOverloads<K, V>): args is IterableOptionsOverload<K, V> {
    return (args.length < 1 || !isDefined(args[0]) || isIterable(args[0]))
        && (args.length < 2 || !isDefined(args[1]) || isObject(args[1]));
}

function isCapacityKeyEqualerValueEqualerOverload<K, V>(args: MultiMapOverloads<K, V>): args is CapacityOptionsOverload<K, V> {
    return (args.length < 1 || isNumber(args[0]))
        && (args.length < 2 || !isDefined(args[1]) || isObject(args[1]));
}

export interface ReadonlyMultiMap<K, V> extends KeyedMultiCollection<K, V> {
    readonly keyEqualer: Equaler<K>;
    readonly valueEqualer: Equaler<V>;
    readonly size: number;
    has(key: K, value: V): boolean;
    hasKey(key: K): boolean;
    get(key: K): ReadonlyHashSet<V> | undefined;
    keys(): IterableIterator<K>;
    values(): IterableIterator<V>;
    entries(): IterableIterator<[K, V]>;
    forEach(callback: (value: V, key: K, map: this) => void, thisArg?: any): void;
}
