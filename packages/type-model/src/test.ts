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

import { IsAny, IsNever, OptionalKeys } from "./index";

/**
 * A helper type for testing types, used in conjunction with {@link ExpectType}:
 *
 * ```ts
 * // test suite:
 * type _ = [
 *   Test<ExpectType<Actual, Expected>>,
 * ];
 * ```
 */
export type Test<T extends { pass: true }> = T;

/**
 * A helper type for testing types, used in conjunction with {@link Test}:
 *
 * ```ts
 * // test suite:
 * type _ = [
 *   Test<ExpectType<Actual, Expected>>
 * ];
 * ```
 */
export type ExpectType<Actual, Expected> =
   // never
   IsNever<Actual> extends true ? IsNever<Expected> extends true ? { pass: true } : { pass: false, Actual: Actual, Expected: Expected } :
   IsNever<Expected> extends true ? { pass: false, Actual: Actual, Expected: Expected } :
   // any
   IsAny<Actual> extends true ? IsAny<Expected> extends true ? { pass: true } : { pass: false, Actual: Actual, Expected: Expected } :
   IsAny<Expected> extends true ? { pass: false, Actual: Actual, Expected: Expected } :
   // identical
   (<T>() => T extends [Expected, OptionalKeys<Expected>, Actual, OptionalKeys<Actual>] ? 0 : 1) extends (<T>() => T extends [Actual, OptionalKeys<Actual>, Expected, OptionalKeys<Expected>] ? 0 : 1) ? { pass: true } :
   { pass: false, Actual: Actual, Expected: Expected };
