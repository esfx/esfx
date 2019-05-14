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

import { LinkedList } from "@esfx/collections-linkedlist";
import { Cancelable, CancelError } from "@esfx/cancelable";
import { CancelToken } from "@esfx/async-canceltoken";
import { isMissing, isIterable } from "@esfx/internal-guards";

/**
 * An asynchronous queue.
 */
export class AsyncQueue<T> {
    private _ended = false;
    private _available: Array<Promise<T>> | undefined = undefined;
    private _pending: LinkedList<{ resolve: (value: T | PromiseLike<T>) => void, reject: (reason: any) => void }> | undefined = undefined;

    /**
     * Initializes a new instance of the AsyncQueue class.
     *
     * @param iterable An optional iterable of values or promises.
     */
    constructor(iterable?: Iterable<T | PromiseLike<T>>) {
        if (!isMissing(iterable) && !isIterable(iterable)) throw new TypeError("Object not iterable: iterable.");
        if (!isMissing(iterable)) {
            this._available = [];
            for (const value of iterable) {
                this._available.push(Promise.resolve(value));
            }
        }
    }

    /**
     * Gets a value indicating whether new items can be added to the queue.
     */
    get writable() {
        return !this._ended;
    }

    /**
     * Gets a value indicating whether the queue has ended and there are no more items available.
     */
    get done() {
        return this._ended && this.size <= 0;
    }

    /**
     * Gets the number of entries in the queue.
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
     * Adds a value to the end of the queue. If the queue is empty but has a pending
     * dequeue request, the value will be dequeued and the request fulfilled.
     *
     * @param value A value or promise to add to the queue.
     */
    put(value: T | PromiseLike<T>): void {
        if (this._ended) throw new Error("Cannot put new values into an AsyncQueue that has ended.");
        if (this._pending !== undefined) {
            const pending = this._pending.shift();
            if (pending !== undefined) {
                pending.resolve(value);
                return;
            }
        }

        if (this._available === undefined) {
            this._available = [];
        }

        this._available.push(Promise.resolve(value));
    }

    /**
     * Removes and returns a Promise for the first value in the queue. If the queue is empty,
     * returns a Promise for the next value to be added to the queue.
     *
     * @param cancelable A Cancelable used to cancel the request.
     */
    get(cancelable?: Cancelable): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const token = CancelToken.from(cancelable);
            token.throwIfSignaled();

            const promise = this._available && this._available.shift();
            if (promise !== undefined) {
                resolve(promise);
                return;
            }

            if (this._ended) {
                reject(new CancelError());
                return;
            }

            if (this._pending === undefined) {
                this._pending = new LinkedList();
            }

            const node = this._pending.push({
                resolve: value => {
                    subscription.unsubscribe();
                    resolve(value);
                },
                reject
            });

            const subscription = token.subscribe(() => {
                if (node.detachSelf()) {
                    reject(new CancelError());
                }
            });
        });
    }

    end() {
        if (this._ended) return;
        this._ended = true;

        if (this._pending) {
            for (const node of [...this._pending.nodes()]) {
                if (node.detachSelf()) {
                    node.value.reject(new CancelError());
                }
            }
        }
    }
}