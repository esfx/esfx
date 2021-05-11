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

   Semaphore is derived from the implementation of Semaphore in
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

import { isMissing, isNumber } from "@esfx/internal-guards";
import { Tag } from "@esfx/internal-tag";
import { WaitQueue } from "@esfx/async-waitqueue";
import { Cancelable } from "@esfx/cancelable";

const MAX_INT32 = (2 ** 31) - 1;

/**
 * Limits the number of asynchronous operations that can access a resource
 * or pool of resources.
 */
@Tag()
export class AsyncSemaphore {
    private _maxCount: number;
    private _currentCount: number;
    private _waiters = new WaitQueue<void>();

    /**
     * Initializes a new instance of the Semaphore class.
     *
     * @param initialCount The initial number of entries.
     * @param maxCount The maximum number of entries.
     */
    constructor(initialCount: number, maxCount?: number) {
        if (isMissing(maxCount)) maxCount = MAX_INT32;
        if (!isNumber(initialCount)) throw new TypeError("Number expected: initialCount.");
        if (!isNumber(maxCount)) throw new TypeError("Number expected: maxCount.");
        if ((initialCount |= 0) < 0) throw new RangeError("Argument out of range: initialCount.");
        if ((maxCount |= 0) < 1) throw new RangeError("Argument out of range: maxCount.");
        if (initialCount > maxCount) throw new RangeError("Argument out of range: initialCount.");

        this._currentCount = initialCount;
        this._maxCount = maxCount;
    }

    /**
     * Gets the number of remaining asynchronous operations that can enter
     * the Semaphore.
     */
    get count(): number {
        return this._currentCount;
    }

    /**
     * Asynchronously waits for the event to become signaled.
     *
     * @param cancelable An optional [[Cancelable]] used to cancel the request.
     */
    async wait(cancelable?: Cancelable): Promise<void> {
        Cancelable.throwIfSignaled(cancelable);
        if (this._currentCount > 0) {
            this._currentCount--;
            return;
        }
        await this._waiters.wait(cancelable);
    }

    /**
     * Releases the [[Semaphore]] one or more times.
     *
     * @param count The number of times to release the [[Semaphore]].
     */
    release(count?: number): void {
        if (isMissing(count)) count = 1;
        if (!isNumber(count)) throw new TypeError("Number expected: count.");
        if ((count |= 0) < 1) throw new RangeError("Argument out of range: count.");
        if (this._maxCount - this._currentCount < count) throw new RangeError("Argument out of range: count.");

        while (count > 0) {
            count--;
            if (!this._waiters.resolveOne()) {
                this._currentCount++;
            }
        }
    }
}
