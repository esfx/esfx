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

import { KeyedCollection, ReadonlyKeyedCollection } from "@esfx/collection-core";
import { Equaler } from "@esfx/equatable";
import /*#__INLINE__*/ { clearEntries, createHashData, deleteEntry, ensureCapacity, findEntryIndex, findEntryValue, forEachEntry, HashData, insertEntry, iterateEntries, selectEntryEntry, selectEntryKey, selectEntryValue, trimExcessEntries } from '@esfx/internal-collections-hash';
import /*#__INLINE__*/ { isFunction, isIterable, isNumber, isPositiveInteger, isUndefined } from "@esfx/internal-guards";

export class HashMap<K, V> implements KeyedCollection<K, V>, ReadonlyHashMap<K, V> {
    private _hashData: HashData<K, V>;

    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, writable: true, value: "HashMap" });
    }

    constructor(equaler?: Equaler<K>);
    constructor(iterable?: Iterable<[K, V]>, equaler?: Equaler<K>);
    constructor(capacity: number, equaler?: Equaler<K>);
    constructor(...args: [Equaler<K>?] | [number, Equaler<K>?] | [Iterable<[K, V]>?, Equaler<K>?]) {
        let capacity: number | undefined;
        let iterable: Iterable<[K, V]> | undefined;
        let equaler: Equaler<K> | undefined;
        if (args.length > 0) {
            const arg0 = args[0];
            if (isNumber(arg0)) {
                if (!isPositiveInteger(arg0)) throw new RangeError("Argument out of range: capacity");
                capacity = arg0;
                if (args.length > 1) equaler = args[1];
            }
            else if (isUndefined(arg0) || isIterable(arg0)) {
                iterable = arg0;
                if (args.length > 1) equaler = args[1];
            }
            else {
                equaler = arg0;
            }
        }

        capacity ??= 0;
        equaler ??= Equaler.defaultEqualer;
        this._hashData = createHashData(equaler, capacity);
        if (iterable) {
            for (const [key, value] of iterable) {
                this.set(key, value);
            }
        }
    }

    get equaler() {
        return this._hashData.equaler;
    }

    get size() {
        return this._hashData.size - this._hashData.freeSize;
    }

    has(key: K) {
        return findEntryIndex(this._hashData, key) >= 0;
    }

    get(key: K) {
        return findEntryValue(this._hashData, key);
    }

    set(key: K, value: V) {
        insertEntry(this._hashData, key, value);
        return this;
    }

    delete(key: K) {
        return deleteEntry(this._hashData, key);
    }

    clear() {
        clearEntries(this._hashData);
    }

    ensureCapacity(capacity: number) {
        if (!isNumber(capacity)) throw new TypeError("Number expected: capacity");
        if (!isPositiveInteger(capacity)) throw new RangeError("Argument out of range: capacity");
        return ensureCapacity(this._hashData, capacity);
    }

    trimExcess(capacity?: number) {
        if (!isUndefined(capacity)) {
            if (!isNumber(capacity)) throw new TypeError("Number expected: capacity");
            if (!isPositiveInteger(capacity)) throw new RangeError("Argument out of range: capacity");
        }
        trimExcessEntries(this._hashData, capacity);
    }

    keys() {
        return iterateEntries(this._hashData.head, selectEntryKey);
    }

    values() {
        return iterateEntries(this._hashData.head, selectEntryValue);
    }

    entries() {
        return iterateEntries(this._hashData.head, selectEntryEntry);
    }

    [Symbol.iterator]() {
        return this.entries();
    }

    forEach(callback: (value: V, key: K, map: this) => void, thisArg?: any) {
        if (!isFunction(callback)) throw new TypeError("Function expected: callback");
        forEachEntry(this, this._hashData.head, callback, thisArg);
    }

    declare [Symbol.toStringTag]: string;

    get [ReadonlyKeyedCollection.size]() { return this.size; }
    [ReadonlyKeyedCollection.has](key: K) { return this.has(key); }
    [ReadonlyKeyedCollection.get](key: K) { return this.get(key); }
    [ReadonlyKeyedCollection.keys]() { return this.keys(); }
    [ReadonlyKeyedCollection.values]() { return this.values(); }

    [KeyedCollection.set](key: K, value: V) { this.set(key, value); }
    [KeyedCollection.delete](key: K) { return this.delete(key); }
    [KeyedCollection.clear]() { this.clear(); }
}

export interface ReadonlyHashMap<K, V> extends ReadonlyMap<K, V>, ReadonlyKeyedCollection<K, V> {
    readonly equaler: Equaler<K>;
    [Symbol.iterator](): IterableIterator<[K, V]>;
}
