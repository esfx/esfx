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

   AutoResetEvent is derived from the implementation of AutoResetEvent in
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

import { Cancelable } from "@esfx/cancelable";
import { WaitQueue } from "@esfx/async-waitqueue";

/**
 * Represents a synchronization event that, when signaled, resets automatically after releasing a
 * single waiting asynchronous operation.
 */
export class AsyncAutoResetEvent {
    private _signaled: boolean;
    private _waiters = new WaitQueue<void>();

    /**
     * Initializes a new instance of the AutoResetEvent class.
     * @param initialState A value indicating whether to set the initial state to signaled.
     */
    constructor(initialState = false) {
        if (typeof initialState !== "boolean") throw new TypeError("Boolean expected: initialState.");
        this._signaled = initialState;
    }

    /**
     * Sets the state of the event to signaled, resolving at most one waiting Promise.
     * The event is then automatically reset.
     * @returns `true` if the operation successfully resolved a waiting Promise; otherwise, `false`.
     */
    set() {
        if (!this._signaled) {
            this._signaled = true;
            if (this._waiters.resolveOne()) {
                this._signaled = false;
                return true;
            }
        }
        return false;
    }

    /**
     * Sets the state of the event to nonsignaled, causing asynchronous operations to pause.
     */
    reset(): void {
        this._signaled = false;
    }

    /**
     * Asynchronously waits for the event to become signaled.
     * @param cancelable A Cancelable used to cancel the request.
     */
    async wait(cancelable?: Cancelable): Promise<void> {
        Cancelable.throwIfSignaled(cancelable);
        if (this._signaled) {
            this._signaled = false;
            return;
        }
        await this._waiters.wait(cancelable);
    }
}

Object.defineProperty(AsyncAutoResetEvent.prototype, Symbol.toStringTag, { configurable: true, value: "AsyncAutoResetEvent" });
