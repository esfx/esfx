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

import { Comparer } from "@esfx/equatable";

/*@internal*/
export function binarySearch<T>(array: readonly T[], key: T, comparer: Comparer<T>): number {
    if (array.length === 0) return -1;
    let low = 0;
    let high = array.length - 1;
    while (low <= high) {
        const middle = low + ((high - low) >> 1);
        const midKey = array[middle];
        switch (Math.sign(comparer.compare(midKey, key))) {
            case -1:
                low = middle + 1;
                break;
            case 0:
                return middle;
            case +1:
                high = middle - 1;
                break;
        }
    }

    return ~low;
}