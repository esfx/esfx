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

import /*#__INLINE__*/ { isNumber } from "@esfx/internal-guards";

const sleepBuffer = new SharedArrayBuffer(4);
const sleepArray = new Int32Array(sleepBuffer);

/**
 * Causes the current thread of execution to sleep until the specified timeout expires.
 * @param ms The number of milliseconds to suspend the thread. Must be a finite, positive value, or zero.
 */
export function sleep(ms: number) {
    if (!isNumber(ms)) throw new TypeError("Number expected: ms");
    if (!isFinite(ms) || ms < 0) throw new RangeError("Out of range: ms");
    Atomics.wait(sleepArray, 0, 0, ms);
}