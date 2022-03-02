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
import /*#__INLINE__*/ { SEM_FIELD_STATE, SEM_FIELD_CURRENTCOUNT, SEM_FIELD_MAXCOUNT, SEM_FIELD_WAITCOUNT, SEM_ID, SEM_STATE_EXCLUDES, SEM_STATE_INCONTENTION, SEM_STATE_LOCKED } from "@esfx/internal-threading";
import /*#__INLINE__*/ { isNumber } from "@esfx/internal-guards";

const kArray = Symbol("kArray");

export class Semaphore {
    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, writable: true, value: "Semaphore" });
    }

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

        if (Atomics.compareExchange(array, SEM_FIELD_STATE, 0, SEM_STATE_INCONTENTION) === 0) {
            if (Atomics.compareExchange(array, SEM_FIELD_MAXCOUNT, 0, maxCount) !== 0
                || Atomics.compareExchange(array, SEM_FIELD_CURRENTCOUNT, 0, initialCount) !== 0
                || Atomics.load(array, SEM_FIELD_WAITCOUNT) !== 0) {
                throw new Error("Invalid handle.");
            }
        }

        const data = Atomics.load(array, SEM_FIELD_STATE);
        if (!(data & SEM_ID) || data & SEM_STATE_EXCLUDES) throw new TypeError("Invalid handle.");

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
        return Atomics.load(array, SEM_FIELD_CURRENTCOUNT);
    }

    /**
     * Blocks the current thread until it can enter the semaphore.
     *
     * @param ms The number of milliseconds to wait before the operation times out.
     * @returns `true` if the semaphore was entered before the timeout elapsed; otherwise, `false`.
     */
    wait(ms: number = Infinity): boolean {
        if (!isNumber(ms)) throw new TypeError("Number expected: ms");
        ms = isNaN(ms) ? Infinity : Math.max(ms, 0);

        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");

        const start = isFinite(ms) ? Date.now() : 0;
        let timeout = ms;

        lock(array);
        try {
            Atomics.add(array, SEM_FIELD_WAITCOUNT, 1);

            // wait until the current count is greater than 0
            let c = Atomics.load(array, SEM_FIELD_CURRENTCOUNT);
            while (c <= 0) {
                unlock(array);
                const result = Atomics.wait(array, SEM_FIELD_CURRENTCOUNT, c, timeout);
                lock(array);
                if (result === "timed-out") {
                    return false;
                }
                if (isFinite(ms)) {
                    timeout = ms - (Date.now() - start);
                }
                c = Atomics.load(array, SEM_FIELD_CURRENTCOUNT);
            }

            Atomics.sub(array, SEM_FIELD_CURRENTCOUNT, 1);
            return true;
        }
        finally {
            Atomics.sub(array, SEM_FIELD_WAITCOUNT, 1);
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
        if (!isNumber(count)) throw new TypeError("Number expected: count");
        if (count < 1) throw new RangeError("Out of range: count.");

        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");

        lock(array);
        try {
            const maxCount = Atomics.load(array, SEM_FIELD_MAXCOUNT);
            const previousCount = Atomics.load(array, SEM_FIELD_CURRENTCOUNT);
            if (maxCount - previousCount < count) {
                throw new Error("Semaphore is full.");
            }

            const currentCount = previousCount + count;
            const waitCount = Atomics.load(array, SEM_FIELD_WAITCOUNT);
            if (currentCount === 1 && waitCount === 1) {
                Atomics.notify(array, SEM_FIELD_WAITCOUNT, 1);
            }
            else if (waitCount > 1) {
                Atomics.notify(array, SEM_FIELD_WAITCOUNT, +Infinity);
            }

            Atomics.store(array, SEM_FIELD_CURRENTCOUNT, currentCount);
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
    let c = Atomics.compareExchange(array, SEM_FIELD_STATE, SEM_STATE_INCONTENTION, SEM_STATE_LOCKED);
    if (c !== SEM_STATE_INCONTENTION) {
        do {
            if (c === SEM_STATE_INCONTENTION || Atomics.compareExchange(array, SEM_FIELD_STATE, SEM_STATE_LOCKED, SEM_STATE_INCONTENTION) !== SEM_STATE_INCONTENTION) {
                Atomics.wait(array, SEM_FIELD_STATE, SEM_STATE_INCONTENTION);
            }
        } while ((c = Atomics.compareExchange(array, SEM_FIELD_STATE, SEM_STATE_INCONTENTION, SEM_STATE_INCONTENTION)) !== SEM_STATE_INCONTENTION);
    }
}

function unlock(array: Int32Array) {
    if (Atomics.sub(array, SEM_FIELD_STATE, 1) !== SEM_STATE_LOCKED) {
        Atomics.store(array, SEM_FIELD_STATE, SEM_STATE_INCONTENTION);
        Atomics.notify(array, SEM_FIELD_STATE, 1);
    }
}
