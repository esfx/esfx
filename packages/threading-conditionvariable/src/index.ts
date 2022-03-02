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
import { Lockable } from "@esfx/threading-lockable";
import /*#__INLINE__*/ { CONDVAR_FIELD_STATE, CONDVAR_ID, CONDVAR_STATE_EXCLUDES } from "@esfx/internal-threading";
import /*#__INLINE__*/ { isNumber } from "@esfx/internal-guards";

const kArray = Symbol("kArray");
export class ConditionVariable implements Disposable {
    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, writable: true, value: "ConditionVariable" });
    }

    static readonly SIZE = 4;

    private [kArray]: Int32Array | undefined;

    constructor(buffer?: SharedArrayBuffer, byteOffset = 0) {
        let array: Int32Array;
        if (buffer instanceof SharedArrayBuffer) {
            if (byteOffset < 0 || byteOffset > buffer.byteLength - 4) throw new RangeError("Out of range: byteOffset.");
            if (byteOffset % 4) throw new RangeError("Not aligned: byteOffset.");
            array = new Int32Array(buffer, byteOffset, 1);
        }
        else {
            array = new Int32Array(new SharedArrayBuffer(4));
        }

        Atomics.compareExchange(array, CONDVAR_FIELD_STATE, 0, CONDVAR_ID);

        const data = Atomics.load(array, CONDVAR_FIELD_STATE);
        if (!(data & CONDVAR_ID) || data & CONDVAR_STATE_EXCLUDES) throw new TypeError("Invalid handle.");

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
        return 4;
    }

    /**
     * Blocks the current thread until the condition variable is notified.
     * 
     * @param mutex A lock used to synchronize access to the condition variable.
     * @param condition An optional condition to wait for.
     * @returns `true` if the condition variable was notified; otherwise, `false`.
     */
    wait(mutex: Lockable, condition?: () => boolean) {
        return this.waitFor(mutex, Infinity, condition);
    }

    /**
     * Blocks the current thread until the condition variable is notified or after the
     * specified timeout has elapsed.
     * 
     * @param mutex A lock used to synchronize access to the condition variable.
     * @param ms The number of milliseconds to wait.
     * @param condition An optional condition to wait for.
     * @returns `true` if the condition variable was notified prior to the timeout period elapsing; otherwise, `false`.
     */
    waitFor(mutex: Lockable, ms: number, condition?: () => boolean) {
        if (!isNumber(ms)) throw new TypeError("Number expected: ms");
        ms = isNaN(ms) ? Infinity : Math.max(ms, 0);

        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");

        const start = isFinite(ms) ? Date.now() : 0;
        let timeout = ms;

        while (!condition?.()) {
            if (!mutex[Lockable.unlock]()) throw new Error("Mutex does not own lock.");
            const result = Atomics.wait(array, CONDVAR_FIELD_STATE, CONDVAR_ID, timeout);
            mutex[Lockable.lock]();
            if (result === "not-equal") throw new Error("Illegal state");
            if (result === "timed-out") return false;
            if (!condition) break;
            if (isFinite(ms)) {
                timeout = ms - (Date.now() - start);
            }
        }
        return true;
    }

    /**
     * Notifies one waiting thread.
     * 
     * @returns `true` if a thread was notified; otherwise, `false`.
     */
    notifyOne() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return Atomics.notify(array, CONDVAR_FIELD_STATE, 1) === 1;
    }

    /**
     * Notifies all waiting threads.
     * 
     * @returns The number of threads notified.
     */
    notifyAll() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return Atomics.notify(array, CONDVAR_FIELD_STATE, +Infinity);
    }

    /**
     * Releases the resources associated for this object.
     */
    close() {
        this[kArray] = undefined;
    }

    /**
     * Releases the resources associated for this object.
     */
    [Disposable.dispose]() {
        this.close();
    }
}
