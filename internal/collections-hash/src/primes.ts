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

/*@internal*/
export function isPrime(candidate: number) {
    if (candidate & 1) {
        const limit = Math.sqrt(candidate) | 0;
        for (let divisor = 3; divisor <= limit; divisor += 2) {
            if (!(candidate % divisor)) return false;
        }
        return true;
    }
    return candidate === 2;
}

/*@internal*/
export function getPrime(min: number) {
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

/*@internal*/
export function expandPrime(oldSize: number) {
    const newSize = 2 * oldSize;
    // Allow the hashtables to grow to maximum possible size (~2G elements) before encountering capacity overflow.
    // Note that this check works even when _items.Length overflowed thanks to the (uint) cast
    if (newSize > maxPrimeArrayLength && maxPrimeArrayLength > oldSize) {
        return maxPrimeArrayLength;
    }
    return getPrime(newSize);
}
