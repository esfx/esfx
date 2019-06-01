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

import { SignalFlags, waitForArray } from "@esfx/internal-threading";
import { Disposable } from "@esfx/disposable";
import { Lockable } from "@esfx/threading-lockable";

const enum Field {
    Signal
}

const kArray = Symbol("kArray");
export class ConditionVariable implements Disposable {
    static readonly SIZE = 4;

    private [kArray]: Int32Array | undefined;

    constructor(buffer?: SharedArrayBuffer, byteOffset = 0) {
        let array: Int32Array;
        if (buffer instanceof SharedArrayBuffer) {
            if (byteOffset < 0 || byteOffset > buffer.byteLength - 4) throw new RangeError("Out of range: byteOffset.");
            if (byteOffset % 4) throw new RangeError("Not aligned: byteOffset.");
            array = new Int32Array(buffer, byteOffset, 1);
            const data = Atomics.load(array, Field.Signal);
            if (!(data & SignalFlags.ConditionVariable) || data & SignalFlags.ConditionVariableExcludes) throw new TypeError("Invalid handle.");
        }
        else {
            array = new Int32Array(new SharedArrayBuffer(4));
            array[Field.Signal] = SignalFlags.ConditionVariable;
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
        return 4;
    }

    wait(mutex: Lockable, condition?: () => boolean) {
        return this.waitFor(mutex, +Infinity, condition);
    }

    waitFor(mutex: Lockable, ms: number, condition?: () => boolean) {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        const unlock = () => { if (!mutex[Lockable.unlock]()) throw new Error("Mutex does not own lock."); };
        const lock = () => { mutex[Lockable.lock](); }
        return waitForArray(array, Field.Signal, unlock, lock, ms, condition);
    }

    notifyOne() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return Atomics.notify(array, Field.Signal, 1) === 1;
    }

    notifyAll() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return Atomics.notify(array, Field.Signal, +Infinity);
    }

    close() {
        this[kArray] = undefined;
    }

    [Disposable.dispose]() {
        this[kArray] = undefined;
    }
}
