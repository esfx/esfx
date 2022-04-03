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
   [Expected] extends [never] ? [Actual] extends [never] ? { pass: true } : { pass: false, Expected: Expected, Actual: Actual } :
   [Actual] extends [never] ? { pass: false, Expected: Expected, Actual: Actual } :
   boolean extends (Expected extends never ? true : false) ? boolean extends (Actual extends never ? true : false) ? { pass: true } : { pass: false, Expected: Expected, Actual: Actual } :
   boolean extends (Actual extends never ? true : false) ? { pass: false, Expected: Expected, Actual: Actual } :
   (<T>() => T extends Expected ? 0 : 1) extends (<T>() => T extends Actual ? 0 : 1) ? { pass: true } :
   { pass: false, Expected: Expected, Actual: Actual };
