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

import { Disposable } from "@esfx/disposable";

// NOTE: This must be a single bit, must be distinct from other threading coordination
//       primitives, and must be a bit >= 16.
const SEM_ID = 1 << 20;

const UNLOCKED = SEM_ID | 0;
const LOCKED = SEM_ID | 1;
const IN_CONTENTION = SEM_ID | 2;
const SEM_EXCLUDES = ~(UNLOCKED | LOCKED | IN_CONTENTION);

const ATOM_INDEX = 0;
const MAXCOUNT_INDEX = 1;
const CURRENTCOUNT_INDEX = 2;
const WAITCOUNT_INDEX = 3;

const kArray = Symbol("kArray");

export class Semaphore {
    static readonly SIZE = 16;

    private [kArray]: Int32Array | undefined;

    constructor(initialCount: number, maxCount?: number);
    constructor(buffer: SharedArrayBuffer, byteOffset?: number);
    constructor(bufferOrInitialCount: SharedArrayBuffer | number, byteOffsetOrMaxCount?: number) {
        let array: Int32Array;
        let initialCount: number;
        let maxCount: number;
        if (bufferOrInitialCount instanceof SharedArrayBuffer) {
            if (byteOffsetOrMaxCount === undefined) byteOffsetOrMaxCount = 0;
            if (byteOffsetOrMaxCount < 0 || byteOffsetOrMaxCount > bufferOrInitialCount.byteLength - 16) throw new RangeError("Out of range: byteOffset.");
            if (byteOffsetOrMaxCount % 4) throw new RangeError("Not aligned: byteOffset.");
            array = new Int32Array(bufferOrInitialCount, byteOffsetOrMaxCount, 4);
            maxCount = 1;
            initialCount = 0;
        }
        else {
            if (bufferOrInitialCount < 0) throw new RangeError("Out of range: initialCount.");
            if (byteOffsetOrMaxCount === undefined) byteOffsetOrMaxCount = 1;
            if (byteOffsetOrMaxCount < 1) throw new RangeError("Out of range: maxCount.");
            if (bufferOrInitialCount > byteOffsetOrMaxCount) throw new RangeError("Out of range: initialCount.");
            array = new Int32Array(new SharedArrayBuffer(16), 0, 4);
            initialCount = bufferOrInitialCount;
            maxCount = byteOffsetOrMaxCount;
        }

        if (Atomics.compareExchange(array, ATOM_INDEX, 0, UNLOCKED) === 0) {
            if (Atomics.compareExchange(array, MAXCOUNT_INDEX, 0, maxCount) !== 0
                || Atomics.compareExchange(array, CURRENTCOUNT_INDEX, 0, initialCount) !== 0
                || Atomics.load(array, WAITCOUNT_INDEX) !== 0) {
                throw new Error("Invalid handle.");
            }
        }

        const data = Atomics.load(array, ATOM_INDEX);
        if (!(data & SEM_ID) || data & SEM_EXCLUDES) throw new TypeError("Invalid handle.");

        this[kArray] = array;
    }

    /**
     * Gets the `SharedArrayBuffer` for this object.
     */
    get buffer() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return array.buffer as SharedArrayBuffer;
    }

    /**
     * Gets the byte offset of this object in its buffer.
     */
    get byteOffset() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return array.byteOffset;
    }

    /**
     * Gets the number of bytes occupied by this object in its buffer.
     */
    get byteLength() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return 16;
    }

    /**
     * Gets the number of remaining threads that can enter the semaphore.
     */
    get count() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return Atomics.load(array, CURRENTCOUNT_INDEX);
    }

    /**
     * Blocks the current thread until it can enter the semaphore.
     *
     * @param ms The number of milliseconds to wait before the operation times out.
     * @returns `true` if the semaphore was entered before the timeout elapsed; otherwise, `false`.
     */
    wait(ms: number = Infinity): boolean {
        if (typeof ms !== "number") throw new TypeError("Number expected: ms");
        ms = isNaN(ms) ? Infinity : Math.max(ms, 0);

        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");

        const start = isFinite(ms) ? Date.now() : 0;
        let timeout = ms;

        lock(array);
        try {
            Atomics.add(array, WAITCOUNT_INDEX, 1);

            // wait until the current count is greater than 0
            let c = Atomics.load(array, CURRENTCOUNT_INDEX);
            while (c <= 0) {
                unlock(array);
                const result = Atomics.wait(array, CURRENTCOUNT_INDEX, c, timeout);
                lock(array);
                if (result === "timed-out") {
                    return false;
                }
                if (isFinite(ms)) {
                    timeout = ms - (Date.now() - start);
                }
                c = Atomics.load(array, CURRENTCOUNT_INDEX);
            }

            Atomics.sub(array, CURRENTCOUNT_INDEX, 1);
            return true;
        }
        finally {
            Atomics.sub(array, WAITCOUNT_INDEX, 1);
            unlock(array);
        }
    }

    /**
     * Exits the semaphore the provided number of times.
     *
     * @param count The number of times to exit the semaphore (default: `1`).
     * @returns The previous count of the semaphore.
     */
    release(count = 1): number {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        if (count < 1) throw new RangeError("Out of range: count.");

        lock(array);
        try {
            const maxCount = Atomics.load(array, MAXCOUNT_INDEX);
            const previousCount = Atomics.load(array, CURRENTCOUNT_INDEX);
            if (maxCount - previousCount < count) {
                throw new Error("Semaphore is full.");
            }

            const currentCount = previousCount + count;
            const waitCount = Atomics.load(array, WAITCOUNT_INDEX);
            if (currentCount === 1 && waitCount === 1) {
                Atomics.notify(array, WAITCOUNT_INDEX, 1);
            }
            else if (waitCount > 1) {
                Atomics.notify(array, WAITCOUNT_INDEX, +Infinity);
            }

            Atomics.store(array, CURRENTCOUNT_INDEX, currentCount);
            return previousCount;
        }
        finally {
            unlock(array);
        }
    }

    /**
     * Releases all resources for this object.
     */
    close() {
        this[kArray] = undefined;
    }

    /**
     * Releases all resources for this object.
     */
    [Disposable.dispose]() {
        this.close();
    }
}

// algorithms based on https://github.com/eliben/code-for-blog/blob/e041beff3712e0674e87dbae5283a09987e566cf/2018/futex-basics/mutex-using-futex.cpp:
function lock(array: Int32Array) {
    let c = Atomics.compareExchange(array, ATOM_INDEX, UNLOCKED, LOCKED);
    if (c !== UNLOCKED) {
        do {
            if (c === IN_CONTENTION || Atomics.compareExchange(array, ATOM_INDEX, LOCKED, IN_CONTENTION) !== UNLOCKED) {
                Atomics.wait(array, ATOM_INDEX, IN_CONTENTION);
            }
        } while ((c = Atomics.compareExchange(array, ATOM_INDEX, UNLOCKED, IN_CONTENTION)) !== UNLOCKED);
    }
}

function unlock(array: Int32Array) {
    if (Atomics.sub(array, ATOM_INDEX, 1) !== LOCKED) {
        Atomics.store(array, ATOM_INDEX, UNLOCKED);
        Atomics.notify(array, ATOM_INDEX, 1);
    }
}