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

import { Collection, ReadonlyCollection } from "@esfx/collection-core";
import { Comparer, Comparison } from "@esfx/equatable";
import /*#__INLINE__*/ { binarySearch } from '@esfx/internal-binarysearch';
import /*#__INLINE__*/ { isIterable, isMissing } from '@esfx/internal-guards';

export class SortedSet<T> implements Collection<T> {
    private _values: T[] = [];
    private _comparer: Comparer<T>;

    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, writable: true, value: "SortedSet" });
    }

    constructor(comparer?: Comparison<T> | Comparer<T>);
    constructor(iterable?: Iterable<T>, comparer?: Comparison<T> | Comparer<T>);
    constructor(...args: [(Comparison<T> | Comparer<T>)?] | [Iterable<T>?, (Comparison<T> | Comparer<T>)?]) {
        let iterable: Iterable<T> | undefined;
        let comparer: Comparison<T> | Comparer<T> | undefined;
        if (args.length > 0) {
            const arg0 = args[0];
            if (isIterable(arg0) || isMissing(arg0)) {
                iterable = arg0;
                if (args.length > 1) comparer = args[1];
            }
            else {
                comparer = arg0;
            }
        }
        if (comparer === undefined) comparer = Comparer.defaultComparer;
        this._comparer = typeof comparer === "function" ? Comparer.create(comparer) : comparer;
        if (iterable) {
            for (const value of iterable) {
                this.add(value);
            }
        }
    }

    get comparer() {
        return this._comparer;
    }

    get size() {
        return this._values.length;
    }

    has(value: T) {
        return binarySearch(this._values, value, this._comparer) >= 0;
    }

    add(value: T) {
        const index = binarySearch(this._values, value, this._comparer);
        if (index >= 0) {
            this._values[index] = value;
        }
        else {
            this._values.splice(~index, 0, value);
        }
        return this;
    }

    delete(value: T) {
        const index = binarySearch(this._values, value, this._comparer);
        if (index >= 0) {
            this._values.splice(index, 1);
            return true;
        }
        return false;
    }

    clear() {
        this._values.length = 0;
    }

    keys() {
        return this._values.values();
    }

    values() {
        return this._values.values();
    }

    * entries() {
        for (let i = 0; i < this._values.length; i++) {
            yield [this._values[i], this._values[i]] as [T, T];
        }
    }

    [Symbol.iterator]() {
        return this.values();
    }

    forEach(cb: (value: T, key: T, map: this) => void, thisArg?: unknown) {
        for (const value of this) {
            cb.call(thisArg, value, value, this);
        }
    }

    [Symbol.toStringTag]: string;

    get [Collection.size]() { return this.size; }
    [Collection.has](value: T) { return this.has(value); }
    [Collection.add](value: T) { this.add(value); }
    [Collection.delete](value: T) { return this.delete(value); }
    [Collection.clear]() { this.clear(); }
}

export interface ReadonlySortedSet<T> extends ReadonlySet<T>, ReadonlyCollection<T> {
    readonly comparer: Comparer<T>;
    [Symbol.iterator](): IterableIterator<T>;
}
