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
   HashSet is derived from the implementation of HashSet<T> in .NET Core.
   "getPrime", "expandPrime", and "isPrime" are derived from the implementation
   of "HashHelpers" in .NET Core.

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

import { Equaler } from "@esfx/equatable";

const MAX_INT32 = (2 ** 31) - 1;
const maxPrimeArrayLength = 2146435069;
const hashPrime = 101;

// Table of prime numbers to use as hash table sizes. 
// A typical resize algorithm would pick the smallest prime number in this array
// that is larger than twice the previous capacity. 
// Suppose our Hashtable currently has capacity x and enough elements are added 
// such that a resize needs to occur. Resizing first computes 2x then finds the 
// first prime in the table greater than 2x, i.e. if primes are ordered 
// p_1, p_2, ..., p_i, ..., it finds p_n such that p_n-1 < 2x < p_n. 
// Doubling is important for preserving the asymptotic complexity of the 
// hashtable operations such as add.  Having a prime guarantees that double 
// hashing does not lead to infinite loops.  IE, your hash function will be 
// h1(key) + i*h2(key), 0 <= i < size.  h2 and the size must be relatively prime.
// We prefer the low computation costs of higher prime numbers over the increased
// memory allocation of a fixed prime number i.e. when right sizing a HashSet.
const primes: readonly number[] = [
    3, 7, 11, 17,
    23, 29, 37, 47,
    59, 71, 89, 107,
    131, 163, 197, 239,
    293, 353, 431, 521,
    631, 761, 919, 1103,
    1327, 1597, 1931, 2333,
    2801, 3371, 4049, 4861,
    5839, 7013, 8419, 10103,
    12143, 14591, 17519, 21023,
    25229, 30293, 36353, 43627,
    52361, 62851, 75431, 90523,
    108631, 130363, 156437, 187751,
    225307, 270371, 324449, 389357,
    467237, 560689, 672827, 807403,
    968897, 1162687, 1395263, 1674319,
    2009191, 2411033, 2893249, 3471899,
    4166287, 4999559, 5999471, 7199369
];

function isPrime(candidate: number) {
    if (candidate & 1) {
        const limit = Math.sqrt(candidate) | 0;
        for (let divisor = 3; divisor <= limit; divisor += 2) {
            if (!(candidate % divisor)) return false;
        }
        return true;
    }
    return candidate === 2;
}

function getPrime(min: number) {
    if (min < 0) throw new RangeError();
    for (let i = 0; i < primes.length; i++) {
        const prime = primes[i];
        if (prime >= min) return prime;
    }
    for (let i = min | 1; i < MAX_INT32; i += 2) {
        if (isPrime(i) && (i - 1) % hashPrime) {
            return i;
        }
    }
    return min;
}

function expandPrime(oldSize: number) {
    const newSize = 2 * oldSize;
    // Allow the hashtables to grow to maximum possible size (~2G elements) before encountering capacity overflow.
    // Note that this check works even when _items.Length overflowed thanks to the (uint) cast
    if (newSize > maxPrimeArrayLength && maxPrimeArrayLength > oldSize) {
        return maxPrimeArrayLength;
    }
    return getPrime(newSize);
}

/*@internal*/
export interface HashEntry<K, V> {
    next: number;
    prevEntry: HashEntry<K, V> | undefined;
    nextEntry: HashEntry<K, V> | undefined;
    skipNextEntry: boolean;
    hashCode: number;
    key: K;
    value: V;
}

/*@internal*/
export interface HashData<K, V> {
    buckets?: Int32Array;
    entries?: HashEntry<K, V>[];
    freeSize: number;
    freeList: number;
    size: number;
    equaler: Equaler<K>;
    head: HashEntry<K, V>;
    tail: HashEntry<K, V>;
}

/*@internal*/
export function createHashEntry<K, V>(): HashEntry<K, V> {
    return {
        prevEntry: undefined,
        nextEntry: undefined,
        skipNextEntry: false,
        next: 0,
        hashCode: 0,
        key: undefined!,
        value: undefined!
    };
}

/*@internal*/
export function createHashData<K, V>(equaler: Equaler<K>, capacity: number) {
    const head = createHashEntry<K, V>();
    const hashData: HashData<K, V> = {
        buckets: undefined,
        entries: undefined,
        freeSize: 0,
        freeList: 0,
        size: 0,
        equaler,
        head,
        tail: head
    };
    initializeHashData(hashData, capacity);
    return hashData;
}

/*@internal*/
export function initializeHashData<K, V>(hashData: HashData<K, V>, capacity: number) {
    const newCapacity = getPrime(capacity);
    hashData.freeList = -1;
    hashData.buckets = new Int32Array(newCapacity);
    hashData.entries = new Array(newCapacity);
    return newCapacity;
}

/*@internal*/
export function resizeHashData<K, V>(hashData: HashData<K, V>, newSize: number) {
    const size = hashData.size;
    const buckets = new Int32Array(newSize);
    const entries = hashData.entries ? hashData.entries.slice() : [];
    entries.length = newSize;
    for (let i = 0; i < size; i++) {
        const entry = entries[i];
        if (entry && entry.hashCode >= 0) {
            const bucket = entry.hashCode % newSize;
            // Value in _buckets is 1-based
            entry.next = buckets[bucket] - 1;
            // Value in _buckets is 1-based
            buckets[bucket] = i + 1;
        }
    }
    hashData.buckets = buckets;
    hashData.entries = entries;
}

/*@internal*/
export function findEntryIndex<K, V>(hashData: HashData<K, V>, key: K) {
    let i = -1;
    const { buckets, entries, equaler } = hashData;
    if (buckets && entries) {
        let hashCode = equaler.hash(key) & MAX_INT32;
        // Value in _buckets is 1-based
        i = buckets[hashCode % buckets.length] - 1;
        const length = entries.length;
        while ((i >>> 0) < length) {
            const entry = entries[i];
            if (entry.hashCode === hashCode && equaler.equals(entry.key, key)) {
                break;
            }
            i = entry.next;
        }
    }
    return i;
}

/*@internal*/
export function findEntryValue<K, V>(hashData: HashData<K, V>, key: K) {
    const index = findEntryIndex(hashData, key);
    return index >= 0 ? hashData.entries![index].value : undefined;
}

/*@internal*/
export function insertEntry<K, V>(hashData: HashData<K, V>, key: K, value: V) {
    if (!hashData.buckets) initializeHashData(hashData, 0);
    const { buckets, entries, equaler } = hashData;
    if (!buckets || !entries) throw new Error();

    const hashCode = equaler.hash(key) & MAX_INT32;
    let bucket = hashCode % buckets.length;
    // Value in _buckets is 1-based
    let i = buckets[bucket] - 1;
    while ((i >>> 0) < entries.length) {
        const entry = entries[i];
        if (entry.hashCode === hashCode && equaler.equals(entry.key, key)) {
            entry.value = value;
            return;
        }
        i = entry.next;
    }
    let updateFreeList = false;
    let index: number;
    if (hashData.freeSize > 0) {
        index = hashData.freeList;
        updateFreeList = true;
        hashData.freeSize--;
    }
    else {
        const size = hashData.size;
        if (size === entries.length) {
            resizeHashData(hashData, expandPrime(hashData.size));
            if (!hashData.buckets || !entries) throw new Error();
            bucket = hashCode % hashData.buckets.length;
        }
        index = size;
        hashData.size = size + 1;
    }
    const entry = entries[index] || (entries[index] = createHashEntry<K, V>());
    if (updateFreeList) hashData.freeList = entry.next;
    entry.hashCode = hashCode;
    // Value in _buckets is 1-based
    entry.next = buckets[bucket] - 1;
    entry.key = key;
    entry.value = value;
    entry.skipNextEntry = false;
    const tail = hashData.tail;
    tail.nextEntry = entry;
    entry.prevEntry = tail;
    hashData.tail = entry;
    // Value in _buckets is 1-based
    buckets[bucket] = index + 1;
}

/*@internal*/
export function deleteEntry<K, V>(hashData: HashData<K, V>, key: K) {
    const { buckets, entries, equaler } = hashData;
    if (buckets && entries) {
        const hashCode = equaler.hash(key) & MAX_INT32;
        const bucket = hashCode % buckets.length;
        let last = -1;
        let entry: HashEntry<K, V> | undefined;
        // Value in _buckets is 1-based
        for (let i = buckets[bucket] - 1; i >= 0; i = entry.next) {
            entry = entries[i];
            if (entry.hashCode === hashCode && equaler.equals(entry.key, key)) {
                if (last < 0) {
                    // Value in _buckets is 1-based
                    buckets[bucket] = entry.next + 1;
                }
                else {
                    entries[last]!.next = entry.next;
                }

                const prevEntry = entry.prevEntry!;
                prevEntry.nextEntry = entry.nextEntry;
                if (prevEntry.nextEntry) {
                    prevEntry.nextEntry.prevEntry = prevEntry;
                }
                if (hashData.tail === entry) {
                    hashData.tail = prevEntry;
                }
                entry.hashCode = -1;
                entry.next = hashData.freeList;
                entry.key = undefined!;
                entry.value = undefined!;
                entry.prevEntry = undefined;
                entry.nextEntry = prevEntry;
                entry.skipNextEntry = true;
                hashData.freeList = i;
                hashData.freeSize++;
                return true;
            }
            last = i;
        }
    }
    return false;
}

/*@internal*/
export function clearEntries<K, V>(hashData: HashData<K, V>) {
    const size = hashData.size;
    if (size > 0) {
        if (hashData.buckets) hashData.buckets.fill(0);
        if (hashData.entries) hashData.entries.fill(undefined!);
        let currentEntry = hashData.head.nextEntry;
        while (currentEntry) {
            const nextEntry = currentEntry.nextEntry;
            currentEntry.prevEntry = undefined;
            currentEntry.nextEntry = hashData.head;
            currentEntry.skipNextEntry = true;
            currentEntry = nextEntry;
        }
        hashData.head.nextEntry = undefined;
        hashData.tail = hashData.head;
        hashData.size = 0;
        hashData.freeList = -1;
        hashData.freeSize = 0;
    }
}

/*@internal*/
export function ensureCapacity<K, V>(hashData: HashData<K, V>, capacity: number) {
    if (capacity < 0) throw new RangeError();
    const existingCapacity = hashData.entries ? hashData.entries.length : 0;
    if (existingCapacity >= capacity) return existingCapacity;
    if (!hashData.buckets) {
        return initializeHashData(hashData, capacity);
    }
    const newCapacity = getPrime(capacity);
    resizeHashData(hashData, getPrime(capacity));
    return newCapacity;
}

/*@internal*/
export function trimExcessEntries<K, V>(hashData: HashData<K, V>, capacity = hashData.size - hashData.freeSize) {
    if (capacity < hashData.size) throw new RangeError(); // TODO
    if (!hashData.buckets || !hashData.entries) return;
    const newCapacity = getPrime(capacity);
    const existingEntries = hashData.entries;
    if (newCapacity >= (existingEntries ? existingEntries.length : 0)) return;
    const oldSize = hashData.size;
    initializeHashData(hashData, newCapacity);
    if (!hashData.buckets || !hashData.entries) throw new Error();
    let newSize = 0;
    for (let i = 0; i < oldSize; i++) {
        const hashCode = existingEntries[i].hashCode;
        if (hashCode >= 0) {
            const bucket = hashCode % newCapacity;
            hashData.entries[newSize] = existingEntries[i];
            // Value in _buckets is 1-based
            hashData.entries[newSize].next = hashData.buckets[bucket] - 1;
            // Value in _buckets is 1-based
            hashData.buckets[bucket] = newSize + 1;
            newSize++;
        }
    }
    hashData.size = newSize;
    hashData.freeSize = 0;
}

/*@internal*/
export function selectEntryKey<K, V>(entry: HashEntry<K, V>) {
    return entry.key;
}

/*@internal*/
export function selectEntryValue<K, V>(entry: HashEntry<K, V>) {
    return entry.value;
}

/*@internal*/
export function selectEntryEntry<K, V>(entry: HashEntry<K, V>) {
    return [entry.key, entry.value] as [K, V];
}

/*@internal*/
export function * iterateEntries<K, V, R>(head: HashEntry<K, V>, selector: (entry: HashEntry<K, V>) => R) {
    let currentEntry: HashEntry<K, V> | undefined = head;
    while (currentEntry) {
        const skipNextEntry = currentEntry.skipNextEntry;
        currentEntry = currentEntry.nextEntry;
        if (skipNextEntry) continue;
        if (currentEntry) yield selector(currentEntry);
    }
}

/*@internal*/
export function forEachEntry<K, V, T>(source: T, head: HashEntry<K, V>, callback: (value: V, key: K, source: T) => void, thisArg: any) {
    let currentEntry: HashEntry<K, V> | undefined = head;
    while (currentEntry) {
        const skipNextEntry = currentEntry.skipNextEntry;
        currentEntry = currentEntry.nextEntry;
        if (skipNextEntry) continue;
        if (currentEntry) callback.call(thisArg, currentEntry.value, currentEntry.key, source);
    }
}
