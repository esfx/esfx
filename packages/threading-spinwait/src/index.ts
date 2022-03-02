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

import { sleep } from "@esfx/threading-sleep";
import /*#__INLINE__*/ { isFunction, isNumber } from "@esfx/internal-guards";

export class SpinWait {
    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, writable: true, value: "SpinWait" });
    }

    private _count = 0;

    reset() {
        this._count = 0;
    }

    spinOnce() {
        if (this._count % 20 === 19) {
            sleep(1);
        }
        else if (this._count % 5 === 4) {
            sleep(0);
        }
        this._count = this._count === ~(1 << 31) ? 0 : this._count + 1;
    }

    spinUntil(condition: () => boolean, ms: number = +Infinity) {
        if (!isFunction(condition)) throw new TypeError("Function expected: condition");
        if (!isNumber(ms)) throw new TypeError("Number expected: ms");

        if (ms < 0) throw new RangeError("Out of range: ms");
        const start = Date.now();
        while (!condition()) {
            if (ms === 0) {
                return false;
            }
            this.spinOnce();
            if (isFinite(ms) && ms < (Date.now() - start)) {
                return false;
            }
        }
        return true;
    }
}