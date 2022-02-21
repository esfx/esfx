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

   AsyncQueue is derived from the implementation of Queue in
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

import { Cancelable, CancelError } from "@esfx/cancelable";
import { LinkedList, listAdd, listCreate, listRemove } from "@esfx/internal-linked-list";

interface Entry<T> {
    resolve(value: T | PromiseLike<T>): void;
    reject(reason: any): void;
    unsubscribe(): void;
}

/**
 * An async coordination primitive that provides a queue of Promises.
 */
export class WaitQueue<T> {
    private _list: LinkedList<Entry<T>> = listCreate();

    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, value: "WaitQueue" });        
    }

    /**
     * Gets the number of pending entries in the queue.
     */
    get size() {
        return this._list.size;
    }

    /**
     * Returns a `Promise` for the next value to be added to the queue.
     * @param cancelable A `Cancelable` used to cancel the request.
     */
    wait(cancelable: Cancelable = Cancelable.none): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            Cancelable.throwIfSignaled(cancelable);

            const node = listAdd(this._list, {
                unsubscribe() {
                    subscription.unsubscribe();
                },
                resolve,
                reject,
            });

            const subscription = Cancelable.subscribe(cancelable, () => {
                const entry = node.value;
                if (listRemove(this._list, node)) {
                    entry.reject(new CancelError());
                }
            });
        });
    }

    /**
     * Resolves a pending `wait()` operation with the provided value.
     * @returns `true` if a pending `wait()` operation was resolved; otherwise, `false`.
     */
    resolveOne(this: WaitQueue<void>): boolean;
    /**
     * Resolves a pending `wait()` operation with the provided value.
     * @returns `true` if a pending `wait()` operation was resolved; otherwise, `false`.
     */
    resolveOne(value: T | PromiseLike<T>): boolean;
    /**
     * Resolves a pending `wait()` operation with the provided value.
     * @returns `true` if a pending `wait()` operation was resolved; otherwise, `false`.
     */
    resolveOne(value?: T | PromiseLike<T>) {
        const node = this._list.head;
        if (node) {
            const pending = node.value;
            if (listRemove(this._list, node)) {
                pending.unsubscribe();
                pending.resolve(value!);
                return true;
            }
        }
        return false;
    }

    /**
     * Resolves all pending `wait()` operations with the provided value.
     * @returns The number of pending `wait()` operations that were resolved.
     */
    resolveAll(this: WaitQueue<void>): number;
    /**
     * Resolves all pending `wait()` operations with the provided value.
     * @returns The number of pending `wait()` operations that were resolved.
     */
    resolveAll(value: T | PromiseLike<T>): number;
    /**
     * Resolves all pending `wait()` operations with the provided value.
     * @returns The number of pending `wait()` operations that were resolved.
     */
    resolveAll(value?: T | PromiseLike<T>) {
        let count = 0;
        while (this.resolveOne(value!)) {
            count++;
        }
        return count;
    }

    /**
     * Rejects the next pending `wait()` operation with the provided reason.
     * @returns `true` if a pending `wait()` operation was rejected; otherwise, `false`.
     */
    rejectOne(reason: unknown) {
        const node = this._list.head;
        if (node) {
            const pending = node.value;
            if (listRemove(this._list, node)) {
                pending.unsubscribe();
                pending.reject(reason);
                return true;
            }
        }
        return false;
    }

    /**
     * Rejects all pending `wait()` operations with the provided reason.
     * @returns The number of pending `wait()` operations that were rejected.
     */
    rejectAll(reason: unknown) {
        let count = 0;
        while (this.rejectOne(reason)) {
            count++;
        }
        return count;
    }

    /**
     * Rejects the next pending `wait()` operation with a `CancelError`.
     * @returns `true` if a pending `wait()` operation was rejected; otherwise, `false`.
     */
    cancelOne() {
        return this.rejectOne(new CancelError());
    }

    /**
     * Rejects all pending `wait()` operations with a `CancelError`.
     * @returns The number of pending `wait()` operations that were rejected.
     */
    cancelAll() {
        return this.rejectAll(new CancelError());
    }
}