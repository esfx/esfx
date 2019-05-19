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

import { isMissing, isFunction } from "@esfx/internal-guards";
import { Tag } from "@esfx/internal-tag";
import { AsyncLockable } from "@esfx/async-lockable";
import { Cancelable, CancelError } from "@esfx/cancelable";
import { LinkedList } from "@esfx/collections-linkedlist";

interface Entry {
    cancelable: Cancelable | undefined;
    lock: AsyncLockable;
    resolve(): void;
    reject(reason: any): void;
    unsubscribe(): void;
}

@Tag()
export class ConditionVariable {
    private _waiters = new LinkedList<Entry>();

    /**
     * Releases `lock`, waiting until notified before reacquiring `lock`.
     * @param lock An `AsyncLockable` to release and reacquire.
     * @param cancelable A `Cancelable` object that can be used to cancel the request.
     */
    async wait(lock: AsyncLockable, cancelable?: Cancelable): Promise<void>;
    /**
     * Releases `lock`, waiting until notified before reacquiring `lock`.
     * @param lock An `AsyncLockable` to release and reacquire.
     * @param condition When specified, loops until `condition` returns `true`.
     * @param cancelable A `Cancelable` object that can be used to cancel the request.
     */
    async wait(lock: AsyncLockable, condition?: () => boolean, cancelable?: Cancelable): Promise<void>;
    async wait(lock: AsyncLockable, condition?: (() => boolean) | Cancelable, cancelable?: Cancelable) {
        if (Cancelable.isCancelable(condition)) cancelable = condition, condition = undefined;
        if (!AsyncLockable.isAsyncLockable(lock)) throw new TypeError("AsyncLockable expected: lock");
        if (!isMissing(condition) && !isFunction(condition)) throw new TypeError("Function expected: condition");
        if (!isMissing(cancelable) && !Cancelable.isCancelable(cancelable)) throw new TypeError("Cancelable expected: cancelable");
        Cancelable.throwIfSignaled(cancelable);
        if (condition) {
            while (!condition()) {
                await this._waitOne(lock, cancelable);
            }
        }
        else {
            await this._waitOne(lock, cancelable);
        }
    }

    /**
     * Notifies one waiter to reacquire its lock.
     */
    notifyOne() {
        const entry = this._waiters.shift();
        if (entry) {
            this._notifyOne(entry);
        }
    }

    /**
     * Notifies all current waiters to reacquire their locks.
     */
    notifyAll() {
        const entries = [...this._waiters];
        this._waiters.clear();
        for (const entry of entries) {
            this._notifyOne(entry);
        }
    }

    private _waitOne(lock: AsyncLockable, cancelable: Cancelable | undefined) {
        return new Promise<void>((resolve, reject) => {
            lock[AsyncLockable.unlock]();

            const node = this._waiters.push({
                lock,
                cancelable,
                unsubscribe() {
                    subscription.unsubscribe();
                },
                resolve,
                reject
            });

            const subscription = Cancelable.subscribe(cancelable, () => {
                if (node.detachSelf()) {
                    reject(new CancelError());
                }
            });
        });
    }

    private _notifyOne(entry: Entry) {
        entry.unsubscribe();
        try {
            entry.lock[AsyncLockable.lock](entry.cancelable).then(
                entry.resolve,
                entry.reject);
        }
        catch (e) {
            entry.reject(e);
        }
    }
}