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
const MANUAL_RESET_ID = 1 << 16;

const NON_SIGNALED = MANUAL_RESET_ID | 0;
const SIGNALED = MANUAL_RESET_ID | 1;
const MANUAL_RESET_EXCLUDES = ~(NON_SIGNALED | SIGNALED);

const ATOM_INDEX = 0;

const kArray = Symbol("kArray");

export class ManualResetEvent implements Disposable {
    static readonly SIZE = 4;

    private [kArray]: Int32Array | undefined;

    constructor(initialState?: boolean);
    constructor(buffer: SharedArrayBuffer, byteOffset?: number);
    constructor(bufferOrInitialState: SharedArrayBuffer | boolean = false, byteOffset = 0) {
        let initialState: boolean;
        let array: Int32Array;
        if (bufferOrInitialState instanceof SharedArrayBuffer) {
            if (byteOffset < 0 || byteOffset > bufferOrInitialState.byteLength - 4) throw new RangeError("Out of range: byteOffset.");
            if (byteOffset % 4) throw new RangeError("Not aligned: byteOffset.");
            array = new Int32Array(bufferOrInitialState, byteOffset, 1);
            initialState = false;
        }
        else {
            array = new Int32Array(new SharedArrayBuffer(4));
            initialState = bufferOrInitialState;
        }

        Atomics.compareExchange(array, ATOM_INDEX, 0, NON_SIGNALED);

        const data = Atomics.load(array, ATOM_INDEX);
        if (!(data & MANUAL_RESET_ID) || data & MANUAL_RESET_EXCLUDES) throw new TypeError("Invalid handle.");

        this[kArray] = array;
        if (initialState) {
            this.set();
        }
    }

    /**
     * Gets the `SharedArrayBuffer` for this event.
     */
    get buffer() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return array.buffer as SharedArrayBuffer;
    }

    /**
     * Gets the byte offset of this event in its buffer.
     */
    get byteOffset() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return array.byteOffset;
    }

    /**
     * Gets the number of bytes occupied by this event in its buffer.
     */
    get byteLength() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return 4;
    }

    /**
     * Gets a value indicating whether the event is currently set (e.g., in the signaled state).
     */
    get isSet() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return Atomics.load(array, ATOM_INDEX) === SIGNALED;
    }

    /**
     * Sets the state of the event to signaled, allowing any threads waiting on the event to proceed.
     *
     * @returns `true` if the event was set; otherwise, `false`.
     */
    set() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        if (Atomics.compareExchange(array, ATOM_INDEX, NON_SIGNALED, SIGNALED) === NON_SIGNALED) {
            Atomics.notify(array, ATOM_INDEX, +Infinity);
            return true;
        }
        return false;
    }

    /**
     * Sets the state of the event to nonsignaled, causing any threads waiting on the event to block.
     *
     * @returns `true` if the event was reset; otherwise, `false`.
     */
    reset() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return Atomics.compareExchange(array, ATOM_INDEX, SIGNALED, NON_SIGNALED) === SIGNALED;
    }

    /**
     * Blocks the current thread until this event becomes signaled.
     *
     * @param ms The number of milliseconds to wait.
     * @returns `true` if the event was signaled before the timeout expired; otherwise, `false`.
     */
    waitOne(ms: number = Infinity) {
        if (typeof ms !== "number") throw new TypeError("Number expected: ms.");
        if (isNaN(ms) || ms < 0) throw new RangeError("Out of range: ms.");
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return Atomics.wait(array, ATOM_INDEX, NON_SIGNALED, ms) !== "timed-out";
    }

    /**
     * Releases all resources for this event.
     */
    close() {
        this[kArray] = undefined;
    }

    /**
     * Releases all resources for this event.
     */
    [Disposable.dispose]() {
        this.close();
    }
}