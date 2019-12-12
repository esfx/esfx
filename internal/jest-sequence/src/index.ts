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

import { toEqualSequence } from "./toEqualSequence";
import { toStartWithSequence } from "./toStartWithSequence";
import { IteratedType } from "@esfx/type-model";

expect.extend({
    toEqualSequence,
    toStartWithSequence
});

declare global {
    namespace jest {
        interface Matchers<R> {
            toEqualSequence(expected: Iterable<IteratedType<R>>): R;
            toStartWithSequence(expected: Iterable<IteratedType<R>>): R;
        }
    }
}