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

import { Cancelable, CancelableCancelSignal, CancelSubscription } from "@esfx/cancelable";

const weakAbortSignal = new WeakMap<Cancelable, AbortSignal>();
const weakCancelable = new WeakMap<AbortSignal, CancelableCancelSignal>();
const defaultReason = Cancelable.canceled.reason;
const uncurryThis = Function.prototype.bind.bind(Function.prototype.call) as <T, A extends unknown[], R>(f: (this: T, ...args: A) => R) => (this_: T, ...args: A) => R;
const AbortControllerAbort: (obj: AbortController, reason?: unknown) => void = uncurryThis(AbortController.prototype.abort);
const AbortControllerGetSignal: (obj: AbortController) => AbortSignal = uncurryThis(Object.getOwnPropertyDescriptor(AbortController.prototype, "signal")!.get!);
const AbortSignalAddEventListener = uncurryThis(AbortSignal.prototype.addEventListener);
const AbortSignalRemoveEventListener = uncurryThis(AbortSignal.prototype.removeEventListener);
const AbortSignalGetAborted: (obj: AbortSignal) => boolean = uncurryThis(Object.getOwnPropertyDescriptor(AbortSignal.prototype, "aborted")!.get!);
const AbortSignalGetReason: ((obj: AbortSignal) => unknown) | undefined = "reason" in AbortSignal.prototype ? uncurryThis(Object.getOwnPropertyDescriptor(AbortSignal.prototype, "reason")!.get!) : undefined;

export function toAbortSignal(cancelable: Cancelable): AbortSignal;
export function toAbortSignal(cancelable: Cancelable | AbortController | AbortSignal) {
    if (cancelable instanceof AbortController) return AbortControllerGetSignal(cancelable);
    if (cancelable instanceof AbortSignal) return cancelable;
    let abortSignal = weakAbortSignal.get(cancelable);
    if (!abortSignal) {
        const signal = cancelable[Cancelable.cancelSignal]();
        const adapter = new AbortController();
        if (signal.signaled) {
            AbortControllerAbort(adapter, signal.reason);
        }
        else {
            signal.subscribe(() => AbortControllerAbort(adapter, signal.reason));
        }
        abortSignal = AbortControllerGetSignal(adapter);
        weakAbortSignal.set(cancelable, abortSignal);
    }
    return abortSignal;
}

export function wrapAbortSignal(signal: AbortController | AbortSignal): Cancelable {
    if (signal instanceof AbortController) {
        return wrapAbortSignal(AbortControllerGetSignal(signal));
    }

    if (Cancelable.hasInstance(signal)) {
        return signal;
    }

    let cancelable = weakCancelable.get(signal);
    if (!cancelable) {
        cancelable = {
            get signaled() {
                return AbortSignalGetAborted(signal);
            },
            get reason() {
                return AbortSignalGetReason?.(signal) ?? defaultReason;
            },
            subscribe(onSignaled: () => void) {
                let subscribed = true;
                const onAbort = () => {
                    if (subscribed) {
                        subscribed = false;
                        AbortSignalRemoveEventListener!(signal, "abort", onAbort);
                        onSignaled();
                        onSignaled = undefined!;
                    }
                };
                AbortSignalAddEventListener!(signal, "abort", onAbort);
                return CancelSubscription.create(() => {
                    if (subscribed) {
                        subscribed = false;
                        AbortSignalRemoveEventListener!(signal, "abort", onAbort);
                        onSignaled = undefined!;
                    }
                });
            },
            [Cancelable.cancelSignal]() {
                return this;
            }
        };
        weakCancelable.set(signal, cancelable);
    }

    return cancelable;
}
