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

import { Cancelable, CancelSignal, CancelSubscription, CancelableSource } from "@esfx/cancelable";

//
// DOM augmentations
//

const accessorBase: PropertyDescriptor = { enumerable: false, configurable: true };
const methodBase: PropertyDescriptor = { ...accessorBase, writable: true };

declare global {
    interface AbortSignal extends Cancelable {}
    interface AbortController extends CancelableSource {}
}

if (typeof AbortSignal === "function" && typeof AbortController === "function") {
    const weakCancelSignal = new WeakMap<AbortSignal, CancelSignal>();

    function createCancelSignal(abortSignal: AbortSignal): CancelSignal {
        return {
            get signaled() {
                return abortSignal.aborted;
            },
            subscribe(onCancellationRequested): CancelSubscription {
                let callback = () => onCancellationRequested();
                abortSignal.addEventListener("abort", callback);
                return {
                    unsubscribe() {
                        if (callback && abortSignal) {
                            abortSignal.removeEventListener("abort", callback);
                            abortSignal = undefined!;
                            callback = undefined!;
                        }
                    }
                };
            }
        };
    }

    function getOrCreateCancelSignal(abortSignal: AbortSignal) {
        let cancelSignal = weakCancelSignal.get(abortSignal);
        if (!cancelSignal) weakCancelSignal.set(abortSignal, cancelSignal = createCancelSignal(abortSignal));
        return cancelSignal;
    }

    Object.defineProperties(AbortSignal.prototype, {
        [Cancelable.cancelSignal]: {
            ...methodBase,
            value(this: AbortSignal) {
                return getOrCreateCancelSignal(this);
            }
        }
    });

    Object.defineProperties(AbortController.prototype, {
        [CancelableSource.cancelSignal]: {
            ...methodBase,
            value(this: AbortController) {
                return getOrCreateCancelSignal(this.signal);
            }
        },
        [CancelableSource.cancel]: {
            ...methodBase,
            value(this: AbortController) {
                this.abort();
            }
        }
    });
}
