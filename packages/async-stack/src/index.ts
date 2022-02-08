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

   THIRD PARTY LICENSE NOTICE:

   AsyncStack is derived from the implementation of Stack in
   Promise Extensions for Javascript: https://github.com/rbuckton/prex

   Promise Extensions is licensed under the Apache 2.0 License:

   Promise Extensions for JavaScript
   Copyright (c) Microsoft Corporation

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

import { WaitQueue } from "@esfx/async-waitqueue";
import { Cancelable } from "@esfx/cancelable";

const enum State {
    Open = 0,
    DoneReading = 1 << 0,
    DoneWriting = 1 << 1,
    Done = DoneReading | DoneWriting,
}

/**
 * An asynchronous Stack.
 */
export class AsyncStack<T> {
    private _state = State.Open;
    private _available: Array<Promise<T>> | undefined = undefined;
    private _pending: WaitQueue<T> | undefined = undefined;

    /**
     * Initializes a new instance of the AsyncStack class.
     *
     * @param iterable An optional iterable of values or promises.
     */
    constructor(iterable?: Iterable<T | PromiseLike<T>>) {
        if (iterable !== null && iterable !== undefined) {
            if (typeof iterable !== "object" || !(Symbol.iterator in iterable)) throw new TypeError("Object not iterable: iterable.");
            this._available = [];
            for (const value of iterable) {
                this._available.push(Promise.resolve(value));
            }
        }
    }

    /**
     * Gets a value indicating whether new items can be added to the stack.
     */
    get writable() {
        return (this._state & State.DoneWriting) === 0 || this.size < 0;
    }

    /**
     * Gets a value indicating whether items can be read from the stack.
     */
    get readable() {
        return (this._state & State.DoneReading) === 0 || this.size > 0;
    }
    
    /**
     * Gets a value indicating whether the stack has ended and there are no more items available.
     */
    get done() {
        return !this.readable && !this.writable;
    }

    /**
     * Gets the number of entries in the stack.
     * When positive, indicates the number of entries available to get.
     * When negative, indicates the number of requests waiting to be fulfilled.
     */
    get size() {
        if (this._available && this._available.length > 0) {
            return this._available.length;
        }
        if (this._pending && this._pending.size > 0) {
            return -this._pending.size;
        }
        return 0;
    }

    /**
     * Removes and returns a Promise for the top value of the stack. If the stack is empty,
     * returns a Promise for the next value to be pushed on to the stack.
     * @param cancelable A Cancelable used to cancel the request.
     */
    async pop(cancelable: Cancelable = Cancelable.none): Promise<T> {
        Cancelable.throwIfSignaled(cancelable);
        if (this._available !== undefined) {
            const promise = this._available.pop();
            if (promise !== undefined) {
                if (this._available.length === 0) {
                    this._available = undefined;
                }
                return await promise;
            }
        }

        if (!this.readable) {
            throw new Error("AsyncStack is not readable.");
        }

        if (this._pending === undefined) {
            this._pending = new WaitQueue();
        }

        return await this._pending.wait(cancelable);
    }

    /**
     * Adds a value to the top of the stack. If the stack is empty but has a pending
     * pop request, the value will be popped and the request fulfilled.
     */
    push(this: AsyncStack<void>): void;
    /**
     * Adds a value to the top of the stack. If the stack is empty but has a pending
     * pop request, the value will be popped and the request fulfilled.
     * @param value A value or promise to add to the stack.
     */
    push(value: T | PromiseLike<T>): void;
    /**
     * Adds a value to the top of the stack. If the stack is empty but has a pending
     * pop request, the value will be popped and the request fulfilled.
     * @param value A value or promise to add to the stack.
     */
    push(value?: T | PromiseLike<T>): void {
        if (!this.writable) throw new Error("AsyncStack is not writable.");
        if (this._pending && this._pending.resolveOne(value!)) {
            if (this._pending.size === 0) {
                this._pending = undefined;
            }
            return;
        }
        if (this._available === undefined) {
            this._available = [Promise.resolve(value!)];
        }
        else {
            this._available.push(Promise.resolve(value!));
        }
    }

    /**
     * Blocks attempts to read from the stack until it is empty. Available items in the stack
     * can still be read until the stack is empty.
     */
    doneReading() {
        if (this._state & State.DoneReading) return;
        this._state |= State.DoneReading;
    }

    /**
     * Blocks attempts to write to the stack. Pending requests in the stack can still be
     * resolved until the stack is empty.
     */
    doneWriting() {
        if (this._state & State.DoneWriting) return;
        this._state |= State.DoneWriting;
    }

    /**
     * Blocks future attempts to read or write from the stack. Available items in the stack
     * can still be read until the stack is empty. Pending reads from the stack are rejected
     * with a `CancelError`.
     */
    end() {
        this.doneReading();
        this.doneWriting();
        if (this._pending) {
            this._pending.cancelAll();
            this._pending = undefined;
        }
    }
}

Object.defineProperty(AsyncStack.prototype, Symbol.toStringTag, { configurable: true, value: "AsyncStack" });
