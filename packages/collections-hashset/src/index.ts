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

   HashSet is derived from the implementation of HashSet<T> in .NET Core.

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

import { Collection, ReadonlyCollection } from "@esfx/collection-core";
import { Equaler } from "@esfx/equatable";
import /*#__INLINE__*/ { clearEntries, createHashData, deleteEntry, ensureCapacity, findEntryIndex, forEachEntry, HashData, insertEntry, iterateEntries, selectEntryEntry, selectEntryKey, selectEntryValue, trimExcessEntries } from '@esfx/internal-collections-hash';
import /*#__INLINE__*/ { isFunction, isIterable, isNumber, isPositiveInteger, isUndefined } from "@esfx/internal-guards";

export class HashSet<T> implements Collection<T> {
    private _hashData: HashData<T,T>;

    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, writable: true, value: "HashSet" });
    }

    constructor(equaler?: Equaler<T>);
    constructor(iterable?: Iterable<T>, equaler?: Equaler<T>);
    constructor(capacity: number, equaler?: Equaler<T>);
    constructor(...args: [Equaler<T>?] | [number, Equaler<T>?] | [Iterable<T>?, Equaler<T>?]) {
        let capacity: number | undefined;
        let iterable: Iterable<T> | undefined;
        let equaler: Equaler<T> | undefined;
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
            for (const value of iterable) {
                this.add(value);
            }
        }
    }

    get equaler() {
        return this._hashData.equaler;
    }

    get size() {
        return this._hashData.size - this._hashData.freeSize;
    }

    has(value: T) {
        return findEntryIndex(this._hashData, value) >= 0;
    }

    add(value: T) {
        insertEntry(this._hashData, value, value);
        return this;
    }

    tryAdd(value: T) {
        const oldSize = this.size;
        insertEntry(this._hashData, value, value);
        return this.size > oldSize;
    }

    delete(value: T) {
        return deleteEntry(this._hashData, value);
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
        return this.values();
    }

    forEach(callback: (value: T, key: T, map: this) => void, thisArg?: any) {
        if (!isFunction(callback)) throw new TypeError("Function expected: callback");
        forEachEntry(this, this._hashData.head, callback, thisArg);
    }

    declare [Symbol.toStringTag]: string;

    get [Collection.size]() { return this.size; }
    [Collection.has](value: T) { return this.has(value); }
    [Collection.add](value: T) { this.add(value); }
    [Collection.delete](value: T) { return this.delete(value); }
    [Collection.clear]() { this.clear(); }
}

export interface ReadonlyHashSet<T> extends ReadonlySet<T>, ReadonlyCollection<T> {
    readonly equaler: Equaler<T>;
    [Symbol.iterator](): IterableIterator<T>;
}
