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

   'delay' is derived from the implementation of 'delay' in
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
import { CancelToken } from "@esfx/async-canceltoken";

/**
 * Waits the specified number of milliseconds before resolving.
 *
 * @param msec The number of milliseconds to wait before resolving.
 */
export function delay(msec: number): Promise<void>;

/**
 * Waits the specified number of milliseconds before resolving with the provided value.
 *
 * @param msec The number of milliseconds to wait before resolving.
 * @param value An optional value for the resulting Promise.
 */
export function delay<T>(msec: number, value: T | PromiseLike<T>): Promise<T>;

/**
 * Waits the specified number of milliseconds before resolving.
 *
 * @param cancelable A Cancelable
 * @param msec The number of milliseconds to wait before resolving.
 */
export function delay(cancelable: Cancelable, msec: number): Promise<void>;

/**
 * Waits the specified number of milliseconds before resolving with the provided value.
 *
 * @param cancelable A Cancelable
 * @param msec The number of milliseconds to wait before resolving.
 * @param value An optional value for the resulting Promise.
 */
export function delay<T>(cancelable: Cancelable, msec: number, value: T | PromiseLike<T>): Promise<T>;

/**
 * Waits the specified number of milliseconds before resolving with the provided value.
 *
 * @param cancelable A Cancelable
 * @param msec The number of milliseconds to wait before resolving.
 * @param value An optional value for the resulting Promise.
 */
export function delay<T>(cancelable: number | Cancelable, msec_?: T | PromiseLike<T> | number, value?: T | PromiseLike<T>) {
    return new Promise<T>((resolve, reject) => {
        let token: CancelToken;
        let msec: number;
        if (typeof cancelable === "number") {
            value = msec_ as T | PromiseLike<T>;
            msec = cancelable;
            token = CancelToken.none;
        }
        else {
            msec = msec_ as number;
            token = CancelToken.from(cancelable);
        }

        if (!token.canBeSignaled) {
            setTimeout(resolve, msec, value);
            return;
        }

        token.throwIfSignaled();

        const handle = setTimeout(() => {
            subscription.unsubscribe();
            resolve(value);
        }, msec);

        const subscription = token.subscribe(() => {
            clearTimeout(handle);
            reject(new CancelError());
        });
    });
}