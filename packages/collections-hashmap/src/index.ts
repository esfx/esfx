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

   THIRD PARTY LICENSE NOTICE:

   HashMap is derived from the implementation of Dictionary<T> in .NET Core.

   .NET Core is licensed under the MIT License:

   The MIT License (MIT)

   Copyright (c) .NET Foundation and Contributors

   All rights reserved.

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in all
   copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   SOFTWARE.
*/

import { KeyedCollection, ReadonlyKeyedCollection } from "@esfx/collection-core";
import { Equaler } from "@esfx/equatable";
import { HashData, createHashData, findEntryIndex, findEntryValue, insertEntry, deleteEntry, clearEntries, ensureCapacity, trimExcessEntries, iterateEntries, selectEntryKey, selectEntryValue, selectEntryEntry, forEachEntry } from '@esfx/internal-collections-hash/dist/hashData';

export class HashMap<K, V> implements KeyedCollection<K, V>, ReadonlyHashMap<K, V> {
    private _hashData: HashData<K, V>;

    constructor(equaler?: Equaler<K>);
    constructor(iterable?: Iterable<[K, V]>, equaler?: Equaler<K>);
    constructor(capacity: number, equaler?: Equaler<K>);
    constructor(...args: [Equaler<K>?] | [number, Equaler<K>?] | [Iterable<[K, V]>?, Equaler<K>?]) {
        let capacity: number | undefined;
        let iterable: Iterable<[K, V]> | undefined;
        let equaler: Equaler<K> | undefined;
        if (args.length > 0) {
            const arg0 = args[0];
            if (typeof arg0 === "number") {
                capacity = arg0;
                if (args.length > 1) equaler = args[1];
            }
            else if (typeof arg0 === "object" && arg0 !== null && Symbol.iterator in arg0 || arg0 === undefined) {
                iterable = arg0 as Iterable<[K, V]> | undefined;
                if (args.length > 1) equaler = args[1];
            }
            else {
                equaler = arg0 as Equaler<K>;
            }
        }

        if (capacity === undefined) capacity = 0;
        if (equaler === undefined) equaler = Equaler.defaultEqualer;
        if (capacity < 0) throw new RangeError();

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
        return ensureCapacity(this._hashData, capacity);
    }

    trimExcess(capacity?: number) {
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
        forEachEntry(this, this._hashData.head, callback, thisArg);
    }

    [Symbol.toStringTag]: string;

    get [ReadonlyKeyedCollection.size]() { return this.size; }
    [ReadonlyKeyedCollection.has](key: K) { return this.has(key); }
    [ReadonlyKeyedCollection.get](key: K) { return this.get(key); }
    [ReadonlyKeyedCollection.keys]() { return this.keys(); }
    [ReadonlyKeyedCollection.values]() { return this.values(); }

    [KeyedCollection.set](key: K, value: V) { this.set(key, value); }
    [KeyedCollection.delete](key: K) { return this.delete(key); }
    [KeyedCollection.clear]() { this.clear(); }
}

Object.defineProperty(HashMap, Symbol.toStringTag, {
    enumerable: false,
    configurable: true,
    writable: true,
    value: "HashMap"
});

export interface ReadonlyHashMap<K, V> extends ReadonlyMap<K, V>, ReadonlyKeyedCollection<K, V> {
    readonly equaler: Equaler<K>;
    [Symbol.iterator](): IterableIterator<[K, V]>;
}
