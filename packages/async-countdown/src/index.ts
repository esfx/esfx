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

   Countdown is derived from the implementation of Countdown in
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
import { AsyncManualResetEvent } from "@esfx/async-manualresetevent";

/**
 * An event that is set when all participants have signaled.
 */
export class AsyncCountdownEvent {
    private _initialCount: number;
    private _remainingCount: number;
    private _event: AsyncManualResetEvent;

    /**
     * Initializes a new instance of the CountdownEvent class.
     *
     * @param initialCount The initial participant count.
     */
    constructor(initialCount: number) {
        if (typeof initialCount !== "number") throw new TypeError("Number expected: initialCount.");
        if ((initialCount |= 0) < 0) throw new RangeError("Argument out of range: initialCount.");

        this._initialCount = initialCount;
        this._remainingCount = initialCount;
        this._event = new AsyncManualResetEvent(initialCount === 0);
    }

    /**
     * Gets the number of signals initially required to set the event.
     */
    get initialCount(): number {
        return this._initialCount;
    }

    /**
     * Gets the number of remaining signals required to set the event.
     */
    get remainingCount(): number {
        return this._remainingCount;
    }

    /**
     * Increments the event's current count by one or more.
     *
     * @param count An optional count specifying the additional number of signals for which the event will wait.
     */
    add(count: number = 1): void {
        if (typeof count !== "number") throw new TypeError("Number expected: count.");
        if ((count |= 0) <= 0) throw new RangeError("Argument out of range: count.");
        if (this._remainingCount === 0) throw new Error("The event is already signaled and cannot be incremented.");

        if (this._remainingCount > 0) {
            this._remainingCount += count;
        }
    }

    /**
     * Resets the remaining and initial count to the specified value, or the initial count.
     *
     * @param count An optional count specifying the number of required signals.
     */
    reset(count: number = this._initialCount): void {
        if (typeof count !== "number") throw new TypeError("Number expected: count.");
        if ((count |= 0) < 0) throw new RangeError("Argument out of range: count.");

        this._remainingCount = count;
        this._initialCount = count;
        if (this._remainingCount > 0) {
            this._event.reset();
        }
        else {
            this._event.set();
        }
    }

    /**
     * Registers one or more signals with the CountdownEvent, decrementing the remaining count.
     *
     * @param count An optional count specifying the number of signals to register.
     */
    signal(count: number = 1): boolean {
        if (typeof count !== "number") throw new TypeError("Number expected: count.");
        if ((count |= 0) <= 0) throw new RangeError("Argument out of range: count.");
        if (count > this._remainingCount) throw new Error("Invalid attempt to decrement the event's count below zero.");

        this._remainingCount -= count;
        if (this._remainingCount === 0) {
            this._event.set();
            return true;
        }

        return false;
    }

    /**
     * Asynchronously waits for the event to become signaled.
     *
     * @param cancelable An optional Cancelable used to cancel the request.
     */
    wait(cancelable?: Cancelable): Promise<void> {
        return this._event.wait(cancelable);
    }
}

Object.defineProperty(AsyncCountdownEvent.prototype, Symbol.toStringTag, { configurable: true, value: "AsyncCountdownEvent" });
