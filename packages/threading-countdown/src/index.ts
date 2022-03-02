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

import { SpinWait } from "@esfx/threading-spinwait";
import { Disposable } from "@esfx/disposable";
import /*#__INLINE__*/ { COUNTDOWN_FIELD_STATE, COUNTDOWN_FIELD_INITIALCOUNT, COUNTDOWN_FIELD_REMAININGCOUNT, COUNTDOWN_ID, COUNTDOWN_STATE_EXCLUDES, COUNTDOWN_STATE_NONSIGNALED, COUNTDOWN_STATE_SIGNALED } from "@esfx/internal-threading";
import /*#__INLINE__*/ { isNumber, isPositiveNonZeroFiniteNumber, isUndefined } from "@esfx/internal-guards";

const MAX_INT32 = (2 ** 31) - 1;

const kArray = Symbol("kArray");

export class CountdownEvent implements Disposable {
    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, writable: true, value: "CountdownEvent" });
    }

    static readonly SIZE = 12;

    private [kArray]: Int32Array | undefined;

    constructor(initialCount: number);
    constructor(buffer: SharedArrayBuffer, byteOffset?: number);
    constructor(bufferOrInitialCount: SharedArrayBuffer | number, byteOffset = 0) {
        let array: Int32Array;
        let initialCount: number;
        if (bufferOrInitialCount instanceof SharedArrayBuffer) {
            if (byteOffset < 0 || byteOffset > bufferOrInitialCount.byteLength - 12) throw new RangeError("Out of range: byteOffset");
            if (byteOffset % 4) throw new RangeError("Not aligned: byteOffset");
            array = new Int32Array(bufferOrInitialCount, byteOffset, 3);
            initialCount = 0;
        }
        else {
            if (bufferOrInitialCount < 0) throw new TypeError("Out of range: initialCount");
            array = new Int32Array(new SharedArrayBuffer(4));
            initialCount = bufferOrInitialCount;
        }

        if (Atomics.compareExchange(array, COUNTDOWN_FIELD_STATE, 0, initialCount === 0 ? COUNTDOWN_STATE_SIGNALED : COUNTDOWN_STATE_NONSIGNALED) === 0) {
            if (Atomics.compareExchange(array, COUNTDOWN_FIELD_INITIALCOUNT, 0, initialCount) !== 0 ||
                Atomics.compareExchange(array, COUNTDOWN_FIELD_REMAININGCOUNT, 0, initialCount) !== 0) {
                throw new TypeError("Invalid handle.");
            }
        }

        const data = Atomics.load(array, COUNTDOWN_FIELD_STATE);
        if (!(data & COUNTDOWN_ID) || data & COUNTDOWN_STATE_EXCLUDES) throw new TypeError("Invalid handle.");

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
        return 12;
    }

    /**
     * Gets the number of participants initially required to signal the event.
     */
    get initialCount() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return Atomics.load(array, COUNTDOWN_FIELD_INITIALCOUNT);
    }

    /**
     * Gets the number of remaining participants required to signal the event.
     */
    get remainingCount() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return Math.max(0, Atomics.load(array, COUNTDOWN_FIELD_REMAININGCOUNT));
    }

    /**
     * Gets a value indicating whether the event is signaled (all participants are accounted for).
     */
    get isSet() {
        return this.remainingCount === 0;
    }

    /**
     * Adds one or more required participants to the event.
     */
    add(count?: number) {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        if (!this.tryAdd(count)) {
            throw new Error("The event is already signaled and cannot be incremented.");
        }
    }

    /**
     * Adds one or more required participants to the event if the event is not already signaled.
     *
     * @returns `true` if the participants were added; otherwise, `false`.
     */
    tryAdd(count: number = 1) {
        if (!isNumber(count)) throw new TypeError("Number expected: count");
        if (!isPositiveNonZeroFiniteNumber(count)) throw new RangeError("Out of range: count");

        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");

        const spinWait = new SpinWait();
        while (true) {
            const remainingCount = Atomics.load(array, COUNTDOWN_FIELD_REMAININGCOUNT);
            if (remainingCount <= 0) return false;
            if (remainingCount > MAX_INT32 - count) throw new Error("Operation would cause count to overflow.");
            if (Atomics.compareExchange(array, COUNTDOWN_FIELD_REMAININGCOUNT, remainingCount, remainingCount + count) === remainingCount) {
                break;
            }
            spinWait.spinOnce();
        }
        return true;
    }

    /**
     * Resets the countdown to the specified count.
     *
     * @param count The new number of participants required. If this is `undefined`, the current value of `initialCount` is used.
     */
    reset(count?: number) {
        if (!isUndefined(count) && !isNumber(count)) throw new TypeError("Number expected: count");
        if (!isUndefined(count) && count < 0) throw new RangeError("Out of range: count");

        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");

        count ??= Atomics.load(array, COUNTDOWN_FIELD_INITIALCOUNT);

        Atomics.store(array, COUNTDOWN_FIELD_REMAININGCOUNT, count);
        Atomics.store(array, COUNTDOWN_FIELD_INITIALCOUNT, count);
        if (count === 0) {
            if (Atomics.compareExchange(array, COUNTDOWN_FIELD_STATE, COUNTDOWN_STATE_NONSIGNALED, COUNTDOWN_STATE_SIGNALED) === COUNTDOWN_STATE_NONSIGNALED) {
                Atomics.notify(array, COUNTDOWN_FIELD_STATE, Infinity);
            }
        }
        else {
            Atomics.compareExchange(array, COUNTDOWN_FIELD_STATE, COUNTDOWN_STATE_SIGNALED, COUNTDOWN_STATE_NONSIGNALED);
        }
    }

    /**
     * Signals a participant is ready, decrementing the number of remaining required participants by the provided value.
     * 
     * @param count The number of participants to signal (default: `1`).
     * @returns `true` if all participants were accounted for and the event became signaled; otherwise, `false`.
     */
    signal(count: number = 1) {
        if (!isNumber(count)) throw new TypeError("Number expected: count");
        if (count <= 0) throw new RangeError("Out of range: count");

        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");

        const spinWait = new SpinWait();
        let remainingCount: number;
        while (true) {
            remainingCount = Atomics.load(array, COUNTDOWN_FIELD_REMAININGCOUNT);
            if (remainingCount < count) throw new Error("Invalid attempt to decrement the event's count below zero.");
            if (Atomics.compareExchange(array, COUNTDOWN_FIELD_REMAININGCOUNT, remainingCount, remainingCount - count) === remainingCount) {
                break;
            }
            spinWait.spinOnce();
        }
        if (remainingCount === count) {
            if (Atomics.compareExchange(array, COUNTDOWN_FIELD_STATE, COUNTDOWN_STATE_NONSIGNALED, COUNTDOWN_STATE_SIGNALED) === COUNTDOWN_STATE_NONSIGNALED) {
                Atomics.notify(array, COUNTDOWN_FIELD_STATE, Infinity);
            }
            return true;
        }
        return false;
    }

    /**
     * Blocks the current thread until the countdown is set.
     * 
     * @param ms The number of milliseconds to wait.
     * @returns `true` if the event was signaled before the timeout period elapsed; otherwise, `false`.
     */
    wait(ms: number = Infinity) {
        if (!isNumber(ms)) throw new TypeError("Number expected: ms");
        ms = isNaN(ms) ? Infinity : Math.max(ms, 0);

        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");

        return this.isSet || Atomics.wait(array, COUNTDOWN_FIELD_STATE, COUNTDOWN_STATE_NONSIGNALED, ms) !== "timed-out";
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
