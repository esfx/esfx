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

import { Lockable } from "@esfx/threading-lockable";
import { Disposable } from "@esfx/disposable";

// NOTE: This must be a single bit, must be distinct from other threading coordination
//       primitives, and must be a bit >= 16.
const MUTEX_ID = 1 << 18;

const UNLOCKED = MUTEX_ID | 0;
const LOCKED = MUTEX_ID | 1;
const IN_CONTENTION = MUTEX_ID | 2;
const MUTEX_EXCLUDES = ~(UNLOCKED | LOCKED | IN_CONTENTION);

const ATOM_INDEX = 0;

const kArray = Symbol("kArray");
const kOwnsLock = Symbol("kOwnsLock");

export class Mutex implements Lockable, Disposable {
    static readonly SIZE = 4;

    private [kArray]: Int32Array | undefined;
    private [kOwnsLock]: boolean;

    constructor(initiallyOwned?: boolean);
    constructor(buffer: SharedArrayBuffer, byteOffset?: number);
    constructor(bufferOrInitiallyOwned: SharedArrayBuffer | boolean = false, byteOffset = 0) {
        let array: Int32Array;
        let initiallyOwned: boolean;
        if (bufferOrInitiallyOwned instanceof SharedArrayBuffer) {
            if (byteOffset < 0 || byteOffset > bufferOrInitiallyOwned.byteLength - 4) throw new RangeError("Out of range: byteOffset.");
            if (byteOffset % 4) throw new RangeError("Not aligned: byteOffset.");
            array = new Int32Array(bufferOrInitiallyOwned, byteOffset, 1);
            initiallyOwned = false;
        }
        else {
            array = new Int32Array(new SharedArrayBuffer(4));
            initiallyOwned = bufferOrInitiallyOwned;
        }

        Atomics.compareExchange(array, ATOM_INDEX, 0, UNLOCKED);

        const data = Atomics.load(array, ATOM_INDEX);
        if (!(data & MUTEX_ID) || data & MUTEX_EXCLUDES) throw new TypeError("Invalid handle.");

        this[kArray] = array;
        this[kOwnsLock] = false;
        if (initiallyOwned) {
            this.lock();
        }
    }

    /**
     * Gets the `SharedArrayBuffer` for this mutex.
     */
    get buffer() {
        const array = this[kArray];
        if (!array) throw new TypeError("Object is disposed.");
        return array.buffer as SharedArrayBuffer;
    }

    /**
     * Gets the byte offset of this mutex in its buffer.
     */
    get byteOffset() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return array.byteOffset;
    }

    /**
     * Gets the number of bytes occupied by this mutex in its buffer.
     */
    get byteLength() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return 4;
    }

    /**
     * Gets a value indicating whether this instance of the mutex owns the lock.
     */
    get ownsLock() {
        return this[kOwnsLock];
    }

    /**
     * Gets a value indicating whether the mutex is currently locked.
     */
    get isLocked() {
        const array = this[kArray];
        if (!array) throw new TypeError("Object is disposed.");

        const atom = Atomics.load(array, ATOM_INDEX);
        return atom === LOCKED || atom === IN_CONTENTION;
    }

    /**
     * Blocks the current `Agent` until it can acquire a lock on the mutex.
     *
     * @param ms The number of milliseconds to wait before the operation times out.
     * @returns `true` if the lock was acquired within the provided timeout period; otherwise, `false`.
     */
    lock(ms: number = Infinity) {
        if (typeof ms !== "number") throw new TypeError("Number expected: ms");
        ms = isNaN(ms) ? Infinity : Math.max(ms, 0);

        const array = this[kArray];
        if (!array) throw new TypeError("Object is disposed.");

        if (this[kOwnsLock]) {
            throw new Error("Deadlock would occur.");
        }

        const start = isFinite(ms) ? Date.now() : 0;
        let timeout = ms;

        // algorithm based on https://github.com/eliben/code-for-blog/blob/e041beff3712e0674e87dbae5283a09987e566cf/2018/futex-basics/mutex-using-futex.cpp.
        let c = Atomics.compareExchange(array, ATOM_INDEX, UNLOCKED, LOCKED);
        if (c !== UNLOCKED) {
            do {
                if (c === IN_CONTENTION || Atomics.compareExchange(array, ATOM_INDEX, LOCKED, IN_CONTENTION) !== UNLOCKED) {
                    if (timeout <= 0 || Atomics.wait(array, ATOM_INDEX, IN_CONTENTION, timeout) === "timed-out") {
                        return false;
                    }
                    if (isFinite(ms)) {
                        timeout = ms - (Date.now() - start);
                    }
                }
            } while ((c = Atomics.compareExchange(array, ATOM_INDEX, UNLOCKED, IN_CONTENTION)) !== UNLOCKED);
        }

        this[kOwnsLock] = true;
        return true;
    }

    /**
     * Attempts to acquire a lock on the mutex without blocking the current `Agent`.
     *
     * @returns `true` if the lock was acquired successfully; otherwise, `false`.
     */
    tryLock(): boolean {
        const array = this[kArray];
        if (!array) throw new TypeError("Object is disposed.");
        if (this[kOwnsLock]) {
            throw new Error("Deadlock would occur.");
        }
        if (Atomics.compareExchange(array, ATOM_INDEX, UNLOCKED, LOCKED) === UNLOCKED) {
            this[kOwnsLock] = true;
            return true;
        }
        return false;
    }

    /**
     * Releases the lock on the mutex allowing the next waiter to take the lock.
     * 
     * @returns `true` if the lock was released successfully; otherwise, `false`.
     */
    unlock() {
        const array = this[kArray];
        if (!array) throw new TypeError("Object is disposed.");
        if (this[kOwnsLock]) {
            if (Atomics.sub(array, ATOM_INDEX, 1) !== LOCKED) {
                Atomics.store(array, ATOM_INDEX, UNLOCKED);
                Atomics.notify(array, ATOM_INDEX, 1);
            }
            this[kOwnsLock] = false;
            return true;
        }
        return false;
    }

    /**
     * Releases the lock on the mutex (if this mutex owns the lock) and releases all resources
     * for this mutex.
     */
    close() {
        if (this[kArray]) {
            this.unlock();
        }
        this[kArray] = undefined;
    }

    [Lockable.lock](ms?: number) {
        return this.lock(ms);
    }

    [Lockable.tryLock]() {
        return this.tryLock();
    }

    [Lockable.unlock]() {
        return this.unlock();
    }

    /**
     * Releases the lock on the mutex (if this mutex owns the lock) and releases all resources
     * for this mutex.
     */
    [Disposable.dispose]() {
        this.close();
    }
}
