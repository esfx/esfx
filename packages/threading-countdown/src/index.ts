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

import { maxInt32 } from "@esfx/internal-integers";
import { SignalFlags, setArray, resetArray, waitOneArray } from "@esfx/internal-threading";
import { SpinWait } from "@esfx/threading-spinwait";
import { Disposable } from "@esfx/disposable";

const enum Field {
    Signal,
    InitialCount,
    RemainingCount,
}

const kArray = Symbol("kArray");
export class CountdownEvent implements Disposable {
    static readonly SIZE = 12;

    private [kArray]: Int32Array | undefined;

    constructor(initialCount: number);
    constructor(buffer: SharedArrayBuffer, byteOffset?: number);
    constructor(bufferOrInitialCount: SharedArrayBuffer | number, byteOffset = 0) {
        let array: Int32Array;
        if (bufferOrInitialCount instanceof SharedArrayBuffer) {
            if (byteOffset < 0 || byteOffset > bufferOrInitialCount.byteLength - 12) throw new RangeError("Out of range: byteOffset");
            if (byteOffset % 4) throw new RangeError("Not aligned: byteOffset");
            array = new Int32Array(bufferOrInitialCount, byteOffset, 3);
            const data = Atomics.load(array, Field.Signal);
            if (!(data & SignalFlags.Countdown) || data & SignalFlags.CountdownExcludes) throw new TypeError("Invalid handle.");
        }
        else {
            if (bufferOrInitialCount < 0) throw new TypeError("Out of range: initialCount");
            array = new Int32Array(new SharedArrayBuffer(4));
            array[Field.Signal] = bufferOrInitialCount === 0 ? SignalFlags.CountdownSignaled : SignalFlags.CountdownNonSignaled;
            array[Field.InitialCount] = bufferOrInitialCount;
            array[Field.RemainingCount] = bufferOrInitialCount;
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
        return 12;
    }

    get initialCount() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return Atomics.load(array, Field.InitialCount);
    }

    get remainingCount() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return Math.max(0, Atomics.load(array, Field.RemainingCount));
    }

    get isSet() {
        return this.remainingCount <= 0;
    }

    add(count?: number) {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        if (!this.tryAdd(count)) {
            throw new Error("The event is already signaled and cannot be incremented.");
        }
    }

    tryAdd(count?: number) {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        if (count === undefined) count = 1;
        if (count <= 0) throw new RangeError("Out of range: count");
        const spinWait = new SpinWait();
        while (true) {
            const remainingCount = Atomics.load(array, Field.RemainingCount);
            if (remainingCount <= 0) return false;
            if (remainingCount > maxInt32 - count) throw new Error("Operation would cause count to overflow.");
            if (Atomics.compareExchange(array, Field.RemainingCount, remainingCount, remainingCount + count) === remainingCount) {
                break;
            }
            spinWait.spinOnce();
        }
        return true;
    }

    reset(count?: number) {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        if (count === undefined) count = Atomics.load(array, Field.InitialCount);
        if (count < 0) throw new RangeError("Out of range: count");
        Atomics.store(array, Field.RemainingCount, count);
        Atomics.store(array, Field.InitialCount, count);
        if (count === 0) {
            setArray(array, Field.Signal, SignalFlags.CountdownNonSignaled, SignalFlags.CountdownSignaled, +Infinity);
        }
        else {
            resetArray(array, Field.Signal, SignalFlags.CountdownNonSignaled, SignalFlags.CountdownSignaled);
        }
    }

    signal(count?: number) {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        if (count === undefined) count = 1;
        if (count <= 0) throw new RangeError("Out of range: count");
        const spinWait = new SpinWait();
        let remainingCount: number;
        while (true) {
            remainingCount = Atomics.load(array, Field.RemainingCount);
            if (remainingCount < count) throw new Error("Invalid attempt to decrement the event's count below zero.");
            if (Atomics.compareExchange(array, Field.RemainingCount, remainingCount, remainingCount - count) === remainingCount) {
                break;
            }
            spinWait.spinOnce();
        }
        if (remainingCount === count) {
            setArray(array, Field.Signal, SignalFlags.CountdownNonSignaled, SignalFlags.CountdownSignaled, +Infinity);
            return true;
        }
        return false;
    }

    wait(ms?: number) {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");

        if (typeof ms !== "undefined") {
            if (typeof ms !== "number") throw new TypeError("Number expected: ms");
            if (!isFinite(ms) || ms < 0) throw new RangeError("Out of range: ms");
        }

        return this.isSet || waitOneArray(array, Field.Signal, SignalFlags.CountdownNonSignaled, ms);
    }

    close() {
        this[kArray] = undefined;
    }

    [Disposable.dispose]() {
        this.close();
    }
}
