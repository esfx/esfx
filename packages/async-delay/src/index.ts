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

/**
 * Waits the specified number of milliseconds before resolving.
 * @param msec The number of milliseconds to wait before resolving.
 */
export function delay(msec: number): Promise<void>;
/**
 * Waits the specified number of milliseconds before resolving with the provided value.
 * @param msec The number of milliseconds to wait before resolving.
 * @param value An optional value for the resulting Promise.
 */
export function delay<T>(msec: number, value: T | PromiseLike<T>): Promise<T>;
/**
 * Waits the specified number of milliseconds before resolving.
 * @param cancelable A Cancelable
 * @param msec The number of milliseconds to wait before resolving.
 */
export function delay(cancelable: Cancelable, msec: number): Promise<void>;
/**
 * Waits the specified number of milliseconds before resolving with the provided value.
 * @param cancelable A Cancelable
 * @param msec The number of milliseconds to wait before resolving.
 * @param value An optional value for the resulting Promise.
 */
export function delay<T>(cancelable: Cancelable, msec: number, value: T | PromiseLike<T>): Promise<T>;
/**
 * Waits the specified number of milliseconds before resolving with the provided value.
 * @param cancelable A Cancelable
 * @param msec The number of milliseconds to wait before resolving.
 * @param value An optional value for the resulting Promise.
 */
export function delay<T>(cancelable: number | Cancelable, msec?: T | PromiseLike<T> | number, value?: T | PromiseLike<T>) {
    const _msec = msec;
    return new Promise<T>((resolve, reject) => {
        let msec: number;
        if (typeof cancelable === "number") {
            value = _msec as T | PromiseLike<T>;
            msec = cancelable;
            cancelable = Cancelable.none;
        }
        else {
            msec = _msec as number;
        }

        Cancelable.throwIfSignaled(cancelable);

        const handle = setTimeout(() => {
            subscription.unsubscribe();
            resolve(value!);
        }, msec);

        const subscription = Cancelable.subscribe(cancelable, () => {
            clearTimeout(handle);
            reject(new CancelError());
        });
    });
}