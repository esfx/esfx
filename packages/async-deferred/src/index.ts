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

   Deferred is derived from the implementation of Deferred in
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

import /*#__INLINE__*/ { isFunction } from "@esfx/internal-guards";

/**
 * Encapsulates a Promise and exposes its resolve and reject callbacks.
 */
export class Deferred<T> {
    private _promise: Promise<T>;
    private _resolve!: (value: PromiseLike<T> | T) => void;
    private _reject!: (reason: any) => void;
    private _callback?: (err: Error | null | undefined, value: T) => void;

    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, value: "Deferred" });
    }

    /**
     * Initializes a new instance of the Deferred class.
     */
    constructor() {
        this._promise = new Promise<T>((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    /**
     * Gets the promise.
     */
    get promise(): Promise<T> {
        return this._promise;
    }

    /**
     * Gets the callback used to resolve the promise.
     */
    get resolve() {
        return this._resolve;
    }

    /**
     * Gets the callback used to reject the promise.
     */
    get reject() {
        return this._reject;
    }

    /**
     * Gets a NodeJS-style callback that can be used to resolve or reject the promise.
     */
    get callback() {
        this._callback ??= this.createCallback(identity);
        return this._callback as T extends void
            ? ((err: Error | null | undefined) => void)
            : ((err: Error | null | undefined, value: T) => void);
    }

    /**
     * Creates a NodeJS-style callback that can be used to resolve or reject the promise with multiple values.
     */
    createCallback<A extends any[]>(selector: (...args: A) => T) {
        if (!isFunction(selector)) throw new TypeError("Function expected: selector");

        return (err: Error | null | undefined, ...args: A) => {
            if (err !== null && err !== undefined) {
                this._reject(err);
            }
            else {
                this._resolve(selector(...args));
            }
        };
    }
}

function identity<A extends any[]>(...args: A): A[0];
function identity<T>(value: T) { return value; }
