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

interface Entry {
    cancelable: Cancelable | undefined;
    lock: AsyncLockable;
    resolve(): void;
    reject(reason: any): void;
    unsubscribe(): void;
}

export class AsyncConditionVariable {
    private _waiters: List<Entry> = { head: null };

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
        if (condition !== null && condition !== undefined && typeof condition !== "function") throw new TypeError("Function expected: condition");
        if (cancelable !== null && cancelable !== undefined && !Cancelable.hasInstance(cancelable)) throw new TypeError("Cancelable expected: cancelable");
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

Object.defineProperty(AsyncConditionVariable.prototype, Symbol.toStringTag, { configurable: true, value: "AsyncConditionVariable" });

interface List<T> {
    head: Node<T> | null;
}

interface Node<T> {
    value: T;
    prev: Node<T> | null;
    next: Node<T> | null;
}

function listAdd<T>(list: List<T>, value: T) {
    const node: Node<T> = { value, next: null, prev: null };
    if (!list.head) {
        list.head = node.next = node.prev = node;
    }
    else {
        const tail = list.head.prev;
        if (!tail?.next) throw new Error("Illegal state");
        node.prev = tail;
        node.next = tail.next;
        tail.next = tail.next.prev = node;
    }
    return node;
}

function listRemove<T>(list: List<T>, node: Node<T>) {
    if (!node.next || !node.prev) {
        return false;
    }
    if (node.next === node) {
        if (list.head !== node) throw new Error("Illegal state");
        list.head = null;
    }
    else {
        node.next.prev = node.next;
        node.prev.next = node.prev;
        if (list.head === node) {
            list.head = node.next;
        }
    }
    node.next = node.prev = null;
    return true;
}
