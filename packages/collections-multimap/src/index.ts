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

import { Equaler } from "@esfx/equatable";
import { KeyedMultiCollection, ReadonlyKeyedMultiCollection } from "@esfx/collection-core";
import { HashMap } from "@esfx/collections-hashmap";
import { HashSet, ReadonlyHashSet } from "@esfx/collections-hashset";
import /*#__INLINE__*/ { isFunction, isIterable, isNumber, isObject, isUndefined } from "@esfx/internal-guards";

export interface MultiMapOptions<K, V> {
    keyEqualer?: Equaler<K>;
    valueEqualer?: Equaler<V>;
}

export class MultiMap<K, V> implements KeyedMultiCollection<K, V> {
    private _map: HashMap<K, HashSet<V>>;
    private _keyEqualer: Equaler<K>;
    private _valueEqualer: Equaler<V>;
    private _size = 0;

    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, writable: true, value: "MultiMap" });
    }

    constructor(options?: MultiMapOptions<K, V>);
    constructor(iterable?: Iterable<[K, V]>, options?: MultiMapOptions<K, V>);
    constructor(capacity: number, options?: MultiMapOptions<K, V>);
    constructor(...args: MultiMapOverloads<K, V>) {
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
            }
            else {
                options = {};
            }
        }

        const keyEqualer = options?.keyEqualer ?? Equaler.defaultEqualer;
        const valueEqualer = options?.valueEqualer ?? Equaler.defaultEqualer;
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

    has(key: K) {
        return this._map.has(key);
    }

    hasValue(key: K, value: V) {
        const values = this._map.get(key);
        if (values) {
            return values.has(value);
        }
        return false;
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

    delete(key: K) {
        const values = this._map.get(key);
        if (values) {
            this._size -= values.size;
            this._map.delete(key);
            return values.size;
        }
        return 0;
    }

    deleteValue(key: K, value: V) {
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
        if (!isFunction(callback)) throw new TypeError("Function expected: callback");
        for (const [key, values] of this._map) {
            for (const value of values) {
                callback.call(thisArg, value, key, this);
            }
        }
    }

    declare [Symbol.toStringTag]: string;

    // #region ReadonlyKeyedMultiCollection
    get [ReadonlyKeyedMultiCollection.size]() { return this.size; }
    [ReadonlyKeyedMultiCollection.has](key: K) { return this.has(key); }
    [ReadonlyKeyedMultiCollection.hasValue](key: K, value: V): boolean { return this.hasValue(key, value); }
    [ReadonlyKeyedMultiCollection.get](key: K) { return this.get(key) }
    [ReadonlyKeyedMultiCollection.keys]() { return this.keys(); }
    [ReadonlyKeyedMultiCollection.values]() { return this.values(); }
    // #endregion ReadonlyKeyedMultiCollection

    // #region KeyedMultiCollection
    [KeyedMultiCollection.add](key: K, value: V) { this.add(key, value); }
    [KeyedMultiCollection.delete](key: K) { return this.delete(key); }
    [KeyedMultiCollection.deleteValue](key: K, value: V) { return this.deleteValue(key, value); }
    [KeyedMultiCollection.clear]() { this.clear(); }
    // #endergion KeyedMultiCollection
}

type OptionsOverload<K, V> = [options?: MultiMapOptions<K, V>];
type IterableOptionsOverload<K, V> = [iterable?: Iterable<[K, V]>, options?: MultiMapOptions<K, V>];
type CapacityOptionsOverload<K, V> = [capacity: number, options?: MultiMapOptions<K, V>];
type MultiMapOverloads<K, V> =
    | OptionsOverload<K, V>
    | IterableOptionsOverload<K, V>
    | CapacityOptionsOverload<K, V>;

function isIterableKeyEqualerValueEqualerOverload<K, V>(args: MultiMapOverloads<K, V>): args is IterableOptionsOverload<K, V> {
    const [arg0, arg1] = args;
    return (isUndefined(arg0) || isIterable(arg0))
        && (isUndefined(arg1) || isObject(arg1));
}

function isCapacityKeyEqualerValueEqualerOverload<K, V>(args: MultiMapOverloads<K, V>): args is CapacityOptionsOverload<K, V> {
    const [arg0, arg1] = args;
    return isNumber(arg0)
        && (isUndefined(arg1) || isObject(arg1));
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
