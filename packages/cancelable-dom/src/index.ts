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

import { Cancelable } from "@esfx/cancelable";

export function toAbortSignal(cancelable: Cancelable): AbortSignal;
export function toAbortSignal(cancelable: Cancelable | AbortController | AbortSignal) {
    if (cancelable instanceof AbortSignal) return cancelable;
    if (cancelable instanceof AbortController) return cancelable.signal;
    const adapter = new AbortController();
    const signal = cancelable[Cancelable.cancelSignal]();
    if (signal.signaled) {
        adapter.abort();
    }
    else {
        signal.subscribe(() => adapter.abort());
    }
    return adapter.signal;
}
