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

import { SignalFlags, lockArray, unlockArray, waitForArray } from "@esfx/internal-threading";

const enum Field {
    Signal,
    MaxCount,
    CurrentCount,
    WaitCount,
}

const kArray = Symbol("kArray");
export class Semaphore {
    static readonly SIZE = 16;

    private [kArray]: Int32Array | undefined;

    constructor(initialCount: number, maxCount?: number);
    constructor(buffer: SharedArrayBuffer, byteOffset?: number);
    constructor(bufferOrInitialCount: SharedArrayBuffer | number, byteOffsetOrMaxCount?: number) {
        let array: Int32Array;
        if (bufferOrInitialCount instanceof SharedArrayBuffer) {
            if (byteOffsetOrMaxCount === undefined) byteOffsetOrMaxCount = 0;
            if (byteOffsetOrMaxCount < 0 || byteOffsetOrMaxCount > bufferOrInitialCount.byteLength - 16) throw new RangeError("Out of range: byteOffset.");
            if (byteOffsetOrMaxCount % 4) throw new RangeError("Not aligned: byteOffset.");
            array = new Int32Array(bufferOrInitialCount, byteOffsetOrMaxCount, 4);
            const data = Atomics.load(array, Field.Signal);
            if (!(data & SignalFlags.Semaphore) || data & SignalFlags.SemaphoreExcludes) throw new TypeError("Invalid handle.");
            this[kArray] = array;
        }
        else {
            if (bufferOrInitialCount < 0) throw new RangeError("Out of range: initialCount.");
            if (byteOffsetOrMaxCount === undefined) byteOffsetOrMaxCount = 1;
            if (byteOffsetOrMaxCount < 1) throw new RangeError("Out of range: maxCount.");
            if (bufferOrInitialCount > byteOffsetOrMaxCount) throw new RangeError("Out of range: initialCount.");
            array = new Int32Array(new SharedArrayBuffer(16), 0, 4);
            array[Field.Signal] = SignalFlags.Semaphore;
            array[Field.MaxCount] = byteOffsetOrMaxCount;
            array[Field.CurrentCount] = bufferOrInitialCount;
            array[Field.WaitCount] = 0;
        }

        this[kArray] = array;
    }

    get buffer() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return array.buffer as SharedArrayBuffer;
    }

    get byteOffset() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return array.byteOffset;
    }

    get byteLength() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return 32;
    }

    get count() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return Atomics.load(array, Field.CurrentCount);
    }

    wait(ms: number = +Infinity): boolean {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");

        lock(array);
        try {
            Atomics.add(array, Field.WaitCount, 1);
            if (!waitFor(array, ms, () => Atomics.load(array, Field.CurrentCount) > 0)) {
                return false;
            }
            Atomics.sub(array, Field.CurrentCount, 1);
            return true;
        }
        finally {
            Atomics.sub(array, Field.WaitCount, 1);
            unlock(array);
        }
    }

    release(count = 1): number {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        if (count < 1) throw new RangeError("Out of range: count.");

        lock(array);
        try {
            const maxCount = Atomics.load(array, Field.MaxCount);
            const previousCount = Atomics.load(array, Field.CurrentCount);
            if (maxCount - previousCount < count) {
                throw new Error("Semaphore is full.");
            }

            const currentCount = previousCount + count;
            const waitCount = Atomics.load(array, Field.WaitCount);
            if (currentCount === 1 && waitCount === 1) {
                Atomics.notify(array, Field.WaitCount, 1);
            }
            else if (waitCount > 1) {
                Atomics.notify(array, Field.WaitCount, +Infinity);
            }

            Atomics.store(array, Field.CurrentCount, currentCount);
            return previousCount;
        }
        finally {
            unlock(array);
        }
    }
}

function lock(array: Int32Array) {
    lockArray(array, Field.Signal, SignalFlags.SemaphoreUnlocked, SignalFlags.SemaphoreLocked);
}

function unlock(array: Int32Array) {
    unlockArray(array, Field.Signal, SignalFlags.SemaphoreUnlocked, SignalFlags.SemaphoreLocked);
}

function waitFor(array: Int32Array, ms: number, condition: () => boolean) {
    return waitForArray(array, Field.CurrentCount, unlock, lock, ms, condition);
}