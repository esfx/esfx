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

/// <reference lib="dom" />

import { Cancelable, CancelSignal, CancelSubscription } from "@esfx/cancelable";

const weakAbortSignal = new WeakMap<Cancelable, AbortSignal>();

export function toAbortSignal(cancelable: Cancelable): AbortSignal;
export function toAbortSignal(cancelable: Cancelable | AbortController | AbortSignal) {
    if (cancelable instanceof AbortSignal) return cancelable;
    if (cancelable instanceof AbortController) return cancelable.signal;
    let abortSignal = weakAbortSignal.get(cancelable);
    if (!abortSignal) {
        const adapter = new AbortController();
        const signal = cancelable[Cancelable.cancelSignal]();
        if (signal.signaled) {
            adapter.abort();
        }
        else {
            signal.subscribe(() => adapter.abort());
        }
        abortSignal = adapter.signal;
        weakAbortSignal.set(cancelable, abortSignal);
    }
    return abortSignal;
}

const weakCancelable = new WeakMap<AbortSignal, Cancelable>();

export function wrapAbortSignal(signal: AbortController | AbortSignal): Cancelable {
    if (signal instanceof AbortController) return wrapAbortSignal(signal.signal);
    if (Cancelable.hasInstance(signal)) return signal;
    let cancelable = weakCancelable.get(signal);
    if (!cancelable) {
        const cancelSignal: CancelSignal = {
            get signaled() {
                return signal.aborted;
            },
            subscribe(onSignaled: () => void) {
                let subscribed = true;
                const unsubscribe = () => {
                    if (subscribed) {
                        subscribed = false;
                        signal.removeEventListener("abort", callback);
                    }
                };
                const callback = () => {
                    if (subscribed) {
                        unsubscribe();
                        onSignaled();
                    }
                };
                signal.addEventListener("abort", callback);
                return CancelSubscription.create(unsubscribe);
            }
        };
        cancelable = {
            [Cancelable.cancelSignal]() {
                return cancelSignal;
            }
        };
        weakCancelable.set(signal, cancelable);
    }
    return cancelable;
}
