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

import { LinkedList } from "@esfx/collections-linkedlist";
import { Cancelable, CancelError } from "@esfx/cancelable";
import { CancelToken } from "@esfx/async-canceltoken";
import { isMissing, isNumber } from "@esfx/internal-guards";
import { maxInt32 as MAX_INT32 } from "@esfx/internal-integers";

/**
 * Limits the number of asynchronous operations that can access a resource
 * or pool of resources.
 */
export class Semaphore {
    private _maxCount: number;
    private _currentCount: number;
    private _waiters = new LinkedList<() => void>();

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
    public get count(): number {
        return this._currentCount;
    }

    /**
     * Asynchronously waits for the event to become signaled.
     *
     * @param cancelable An optional [[Cancelable]] used to cancel the request.
     */
    public wait(cancelable?: Cancelable): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const token = CancelToken.from(cancelable);
            token.throwIfSignaled();

            if (this._currentCount > 0) {
                this._currentCount--;
                resolve();
                return;
            }

            const node = this._waiters.push(() => {
                subscription.unsubscribe();
                if (token.signaled) {
                    reject(new CancelError());
                }
                else {
                    resolve();
                }
            });

            const subscription = token.subscribe(() => {
                if (node.detachSelf()) {
                    reject(new CancelError());
                }
            });
        });
    }

    /**
     * Releases the [[Semaphore]] one or more times.
     *
     * @param count The number of times to release the [[Semaphore]].
     */
    public release(count?: number): void {
        if (isMissing(count)) count = 1;
        if (!isNumber(count)) throw new TypeError("Number expected: count.");
        if ((count |= 0) < 1) throw new RangeError("Argument out of range: count.");
        if (this._maxCount - this._currentCount < count) throw new RangeError("Argument out of range: count.");

        while (count > 0) {
            count--;
            const resolve = this._waiters.shift();
            if (resolve) {
                resolve();
            }
            else {
                this._currentCount++;
            }
        }
    }
}