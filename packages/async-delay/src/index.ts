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
import /*#__INLINE__*/ { isMissing, isPositiveFiniteNumber } from '@esfx/internal-guards';

/**
 * Waits the specified number of milliseconds before resolving.
 * @param msec The number of milliseconds to wait before resolving.
 */
export function delay(msec: number): Promise<void>;
/**
 * Waits the specified number of milliseconds before resolving with the provided value.
 * @param msec The number of milliseconds to wait before resolving.
 * @param value An optional value for the resulting Promise. May not be a {@link Cancelable} &mdash; if you intend to resolve with a {@link Cancelable} you must use a different overload.
 */
export function delay<T>(msec: number, value: PromiseLike<T> | Exclude<T, Cancelable>): Promise<T>;
/**
 * Waits the specified number of milliseconds before resolving.
 * @param cancelable A Cancelable
 * @param msec The number of milliseconds to wait before resolving.
 */
export function delay(cancelable: Cancelable | null | undefined, msec: number): Promise<void>;
/**
 * Waits the specified number of milliseconds before resolving with the provided value.
 * @param cancelable A Cancelable
 * @param msec The number of milliseconds to wait before resolving.
 * @param value An optional value for the resulting Promise.
 */
export function delay<T>(cancelable: Cancelable | null | undefined, msec: number, value: T | PromiseLike<T>): Promise<T>;
/**
 * Waits the specified number of milliseconds before resolving with the provided value.
 * @param cancelable A Cancelable
 * @param msec The number of milliseconds to wait before resolving.
 * @param value An optional value for the resulting Promise.
 */
export function delay<T>(cancelable: number | Cancelable | null | undefined, msec?: Exclude<T, Cancelable> | PromiseLike<T> | number, value?: T | PromiseLike<T>) {
    return new Promise<T>((resolve, reject) => {
        let valueCanBeCancelable: boolean;
        if (typeof cancelable === "number") {
            value = msec as Exclude<T, Cancelable> | PromiseLike<T>;
            msec = cancelable;
            cancelable = Cancelable.none;
            valueCanBeCancelable = false;
        }
        else {
            msec = msec as number;
            cancelable ??= Cancelable.none;
            valueCanBeCancelable = true;
        }

        if (!isMissing(cancelable) && !Cancelable.hasInstance(cancelable)) throw new TypeError("Cancelable expected: cancelable");
        if (!isPositiveFiniteNumber(msec)) throw new TypeError("Argument out of range: msec");
        if (!valueCanBeCancelable && Cancelable.hasInstance(value)) throw new TypeError("Argument may not be a Cancelable: value");

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
