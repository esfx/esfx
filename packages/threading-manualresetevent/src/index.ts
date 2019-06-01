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

import { SignalFlags, setArray, resetArray, waitOneArray } from "@esfx/internal-threading";
import { Disposable } from "@esfx/disposable";

const enum Field {
    Signal
}

const kArray = Symbol("kArray");
export class ManualResetEvent implements Disposable {
    static readonly SIZE = 4;

    private [kArray]: Int32Array | undefined;

    constructor(initialState?: boolean);
    constructor(buffer: SharedArrayBuffer, byteOffset?: number);
    constructor(bufferOrInitialState: SharedArrayBuffer | boolean = false, byteOffset = 0) {
        let array: Int32Array;
        if (bufferOrInitialState instanceof SharedArrayBuffer) {
            if (byteOffset < 0 || byteOffset > bufferOrInitialState.byteLength - 4) throw new RangeError("Out of range: byteOffset.");
            if (byteOffset % 4) throw new RangeError("Not aligned: byteOffset.");
            array = new Int32Array(bufferOrInitialState, byteOffset, 1);
            const data = Atomics.load(array, Field.Signal);
            if (!(data & SignalFlags.ManualReset) || data & SignalFlags.ManualResetExcludes) throw new TypeError("Invalid handle.");
        }
        else {
            array = new Int32Array(new SharedArrayBuffer(4));
            array[Field.Signal] = bufferOrInitialState ? SignalFlags.ManualResetSignaled : SignalFlags.ManualResetNonSignaled;
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

    get isSet(){
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return Atomics.load(array, Field.Signal) === SignalFlags.ManualResetSignaled;
    }

    set() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return setArray(array, Field.Signal, SignalFlags.ManualResetNonSignaled, SignalFlags.ManualResetSignaled, +Infinity);
    }

    // set() {
    //     const array = this[kArray];
    //     if (!array) throw new ReferenceError("Object is disposed.");
    //     if (Atomics.compareExchange(array, Field.Signal, SignalFlags.ManualResetNonSignaled, SignalFlags.ManualResetSignaled) === SignalFlags.ManualResetNonSignaled) {
    //         Atomics.notify(array, Field.Signal, +Infinity);
    //         return true;
    //     }
    //     return false;
    // }

    reset() {
        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");
        return resetArray(array, Field.Signal, SignalFlags.ManualResetNonSignaled, SignalFlags.ManualResetSignaled);
    }

    // reset() {
    //     const array = this[kArray];
    //     if (!array) throw new ReferenceError("Object is disposed.");
    //     return Atomics.compareExchange(array, Field.Signal, SignalFlags.ManualResetSignaled, SignalFlags.ManualResetNonSignaled) === SignalFlags.ManualResetSignaled;
    // }

    waitOne(ms?: number) {
        if (typeof ms !== "undefined") {
            if (typeof ms !== "number") throw new TypeError("Number expected: ms.");
            if (!isFinite(ms) || ms < 0) throw new RangeError("Out of range: ms.");
        }

        const array = this[kArray];
        if (!array) throw new ReferenceError("Object is disposed.");

        return waitOneArray(array, Field.Signal, SignalFlags.ManualResetNonSignaled, ms);
    }

    // waitOne(ms?: number) {
    //     if (typeof ms !== "undefined") {
    //         if (typeof ms !== "number") throw new TypeError("Number expected: ms.");
    //         if (!isFinite(ms) || ms < 0) throw new RangeError("Out of range: ms.");
    //     }

    //     const array = this[kArray];
    //     if (!array) throw new ReferenceError("Object is disposed.");

    //     if (Atomics.wait(array, Field.Signal, SignalFlags.ManualResetNonSignaled, ms) === "timed-out") {
    //         return false;
    //     }

    //     return true;
    // }
    
    close() {
        this[kArray] = undefined;
    }

    [Disposable.dispose]() {
        this.close();
    }
}