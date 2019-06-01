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

import { SignalFlags, lockArray } from "@esfx/internal-threading";
import { Lockable } from "@esfx/threading-lockable";
import { Disposable } from "@esfx/disposable";

const enum Field {
    Signal,
    Counter,
    Owner,
}

const kArray = Symbol("kArray");
const kId = Symbol("kId");
export class Mutex implements Lockable, Disposable {
    static readonly SIZE = 12;

    private [kArray]: Int32Array | undefined;
    private [kId]: number;

    constructor(initiallyOwned?: boolean);
    constructor(buffer: SharedArrayBuffer, byteOffset?: number);
    constructor(bufferOrInitiallyOwned: SharedArrayBuffer | boolean = false, byteOffset = 0) {
        let array: Int32Array;
        let initiallyOwned = false;
        if (bufferOrInitiallyOwned instanceof SharedArrayBuffer) {
            if (byteOffset < 0 || byteOffset > bufferOrInitiallyOwned.byteLength - 12) throw new RangeError("Out of range: byteOffset.");
            if (byteOffset % 4) throw new RangeError("Not aligned: byteOffset.");
            array = new Int32Array(bufferOrInitiallyOwned, byteOffset, 3);
            const data = Atomics.load(array, Field.Signal);
            if (!(data & SignalFlags.Mutex) || data & SignalFlags.MutexExcludes) throw new TypeError("Invalid handle.");
        }
        else {
            initiallyOwned = bufferOrInitiallyOwned;
            array = new Int32Array(new SharedArrayBuffer(12));
            array[Field.Signal] = SignalFlags.MutexUnlocked;
        }
        this[kArray] = array;
        this[kId] = Atomics.add(array, Field.Counter, 1) + 1;
        if (initiallyOwned) {
            this.lock();
        }
    }

    get buffer() {
        const array = this[kArray];
        if (!array) throw new TypeError("Object is disposed.");
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

    get ownsLock() {
        const array = this[kArray];
        if (!array) throw new TypeError("Object is disposed.");
        return Atomics.load(array, Field.Owner) === this[kId];
    }

    get isLocked() {
        const array = this[kArray];
        if (!array) throw new TypeError("Object is disposed.");
        return Atomics.load(array, Field.Signal) === SignalFlags.MutexLocked;
    }

    lock(ms?: number) {
        if (typeof ms !== "undefined") {
            if (typeof ms !== "number") throw new TypeError("Number expected: ms.");
            if (!isFinite(ms) || ms < 0) throw new RangeError("Out of range: ms.");
        }

        const array = this[kArray];
        if (!array) throw new TypeError("Object is disposed.");

        const id = this[kId];
        if (Atomics.load(array, Field.Owner) === id) {
            throw new Error("Deadlock would occur.");
        }

        if (lockArray(array, Field.Signal, SignalFlags.MutexUnlocked, SignalFlags.MutexLocked, ms)) {
            Atomics.store(array, Field.Owner, id);
            return true;
        }

        return false;
    }

    tryLock(): boolean {
        const array = this[kArray];
        if (!array) throw new TypeError("Object is disposed.");

        const id = this[kId];
        if (Atomics.load(array, Field.Owner) === id) {
            throw new Error("Deadlock would occur.");
        }

        if (Atomics.compareExchange(array, Field.Signal, SignalFlags.MutexUnlocked, SignalFlags.MutexLocked) === SignalFlags.MutexUnlocked) {
            Atomics.store(array, Field.Owner, id);
            return true;
        }

        return false;
    }

    unlock() {
        const array = this[kArray];
        if (!array) throw new TypeError("Object is disposed.");

        const id = this[kId];
        if (Atomics.compareExchange(array, Field.Owner, id, 0) === id) {
            Atomics.store(array, Field.Signal, SignalFlags.MutexUnlocked);
            Atomics.notify(array, Field.Signal, 1);
            return true;
        }
        return false;
    }

    close() {
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

    [Disposable.dispose]() {
        this.close();
    }
}
