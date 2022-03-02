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

import { AsyncLockable } from "@esfx/async-lockable";
import { Cancelable, CancelError } from "@esfx/cancelable";
import /*#__INLINE__*/ { LinkedList, listAdd, listCreate, listRemove } from "@esfx/internal-linked-list";
import /*#__INLINE__*/ { isFunction, isUndefined } from "@esfx/internal-guards";

interface Entry {
    cancelable: Cancelable | undefined;
    lock: AsyncLockable;
    resolve(): void;
    reject(reason: any): void;
    unsubscribe(): void;
}

export class AsyncConditionVariable {
    private _waiters: LinkedList<Entry> = listCreate();

    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, value: "AsyncConditionVariable" });
    }

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
        if (Cancelable.hasInstance(condition)) cancelable = condition, condition = undefined;
        if (!AsyncLockable.hasInstance(lock)) throw new TypeError("AsyncLockable expected: lock");
        if (!isUndefined(condition) && !isFunction(condition)) throw new TypeError("Function expected: condition");
        if (!isUndefined(cancelable) && !Cancelable.hasInstance(cancelable)) throw new TypeError("Cancelable expected: cancelable");

        const signal = cancelable?.[Cancelable.cancelSignal]();
        if (signal?.signaled) throw signal.reason ?? new CancelError();

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
        const head = this._waiters.head;
        if (head && listRemove(this._waiters, head)) {
            this._notifyOne(head.value);
        }
    }

    /**
     * Notifies all current waiters to reacquire their locks.
     */
    notifyAll() {
        const entries: Entry[] = [];
        while (this._waiters.head) {
            const head = this._waiters.head;
            if (listRemove(this._waiters, head)) {
                entries.push(head.value);
                head.value = undefined!;
            }
        }

        for (const entry of entries) {
            this._notifyOne(entry);
        }
    }

    private _waitOne(lock: AsyncLockable, cancelable: Cancelable | undefined) {
        return new Promise<void>((resolve, reject) => {
            lock[AsyncLockable.unlock]();

            const node = listAdd(this._waiters, {
                lock,
                cancelable,
                unsubscribe() {
                    subscription.unsubscribe();
                },
                resolve,
                reject
            });

            const subscription = Cancelable.subscribe(cancelable, () => {
                if (listRemove(this._waiters, node)) {
                    node.value.reject(new CancelError());
                    node.value = undefined!;
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
