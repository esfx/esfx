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

import { Cancelable, CancelableSource } from "@esfx/cancelable";
import { wrapAbortSignal } from "@esfx/cancelable-dom";

//
// DOM augmentations
//

declare global {
    interface AbortSignal extends Cancelable {}
    interface AbortController extends CancelableSource {}
}

if (typeof AbortSignal === "function" && typeof AbortController === "function") {
    const uncurryThis = Function.prototype.bind.bind(Function.prototype.call) as <T, A extends unknown[], R>(f: (this: T, ...args: A) => R) => (this_: T, ...args: A) => R;
    const AbortControllerAbort: (obj: AbortController, reason?: unknown) => void = uncurryThis(AbortController.prototype.abort);
    const AbortControllerGetSignal: (obj: AbortController) => AbortSignal = uncurryThis(Object.getOwnPropertyDescriptor(AbortController.prototype, "signal")!.get!);

    Object.defineProperties(AbortSignal.prototype, {
        [Cancelable.cancelSignal]: {
            configurable: true,
            writable: true,
            value(this: AbortSignal) {
                return wrapAbortSignal(this);
            }
        }
    });

    Object.defineProperties(AbortController.prototype, {
        [CancelableSource.cancelSignal]: {
            configurable: true,
            writable: true,
            value(this: AbortController) {
                return wrapAbortSignal(AbortControllerGetSignal(this));
            }
        },
        [CancelableSource.cancel]: {
            configurable: true,
            writable: true,
            value(this: AbortController, reason?: unknown) {
                AbortControllerAbort(this, reason);
            }
        }
    });
}
