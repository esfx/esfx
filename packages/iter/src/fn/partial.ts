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
 * A placeholder for a partial application argument.
 *
 * See `partial` for more information.
 */
export const placeholder = Symbol.for("@esfx/iter:fn/placeholder");

/**
 * A placeholder for a partial application argument that should be used as the `this` binding.
 *
 * See `partial` for more information.
 */
export const thisPlaceholder = Symbol.for("@esfx/iter:fn/thisPlaceholder");

/**
 * A placeholder for a partial application argument that should pass on excess arguments.
 *
 * See `partial` for more information.
 */
export const restPlaceholder = Symbol.for("@esfx/iter:fn/restPlaceholder");

type _ = typeof placeholder;
type _this = typeof thisPlaceholder;
type _rest = typeof restPlaceholder;

/**
 * Partially applies `f`.
 *
 * - If `placeholder` is provided for any argument, that argument remains unapplied in the resulting function.
 *
 * - If `thisPlaceholder` is provided for any argument, an argument in that position in the resulting function is used as the `this` binding.
 *
 * - If `restPlaceholder` is provided as the last argument, any extra arguments passed to the resulting function are spread into the call to the original function.
 *
 * ```ts
 * import { partial, placeholder as _ } from "@esfx/iter/fn";
 * const add = (a, b) => a + b;
 * const addOne = partial(add, _, 1);
 * addOne(2); // 3;
 * ```
 */
export function partial<This, TResult>(f: (this: This) => TResult): (this: This) => TResult;
export function partial<This, TResult>(f: (this: This) => TResult, _this: _this): (_this: This) => TResult;
export function partial<This, TRest extends any[], TResult>(f: (this: This, ...rest: TRest) => TResult, _rest: _rest): (this: This, ...rest: TRest) => TResult;
export function partial<This, TRest extends any[], TResult>(f: (this: This, ...rest: TRest) => TResult, _this: _this, _rest: _rest): (_this: This, ...rest: TRest) => TResult;
export function partial<This, A, TResult>(f: (this: This, a: A) => TResult, a: A): (this: This) => TResult;
export function partial<This, A, TResult>(f: (this: This, a: A) => TResult, a: _): (this: This, a: A) => TResult;
export function partial<This, A, TResult>(f: (this: This, a: A) => TResult, _this: _this, a: A): (_this: This) => TResult;
export function partial<This, A, TResult>(f: (this: This, a: A) => TResult, _this: _this, a: _): (_this: This, a: A) => TResult;
export function partial<This, A, TResult>(f: (this: This, a: A) => TResult, a: A, _this: _this): (_this: This) => TResult;
export function partial<This, A, TResult>(f: (this: This, a: A) => TResult, a: _, _this: _this): (a: A, _this: This) => TResult;
export function partial<This, A, TRest extends any[], TResult>(f: (this: This, a: A, ...rest: TRest) => TResult, a: A, _rest: _rest): (this: This, ...rest: TRest) => TResult;
export function partial<This, A, TRest extends any[], TResult>(f: (this: This, a: A, ...rest: TRest) => TResult, a: _, _rest: _rest): (this: This, a: A, ...rest: TRest) => TResult;
export function partial<This, A, TRest extends any[], TResult>(f: (this: This, a: A, ...rest: TRest) => TResult, _this: _this, a: A, _rest: _rest): (_this: This, ...rest: TRest) => TResult;
export function partial<This, A, TRest extends any[], TResult>(f: (this: This, a: A, ...rest: TRest) => TResult, _this: _this, a: _, _rest: _rest): (_this: This, a: A, ...rest: TRest) => TResult;
export function partial<This, A, TRest extends any[], TResult>(f: (this: This, a: A, ...rest: TRest) => TResult, a: A, _this: _this, _rest: _rest): (_this: This, ...rest: TRest) => TResult;
export function partial<This, A, TRest extends any[], TResult>(f: (this: This, a: A, ...rest: TRest) => TResult, a: _, _this: _this, _rest: _rest): (a: A, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, TResult>(f: (this: This, a: A, b: B) => TResult, a: A, b: B): (this: This) => TResult;
export function partial<This, A, B, TResult>(f: (this: This, a: A, b: B) => TResult, a: _, b: B): (this: This, a: A) => TResult;
export function partial<This, A, B, TResult>(f: (this: This, a: A, b: B) => TResult, a: A, b: _): (this: This, b: B) => TResult;
export function partial<This, A, B, TResult>(f: (this: This, a: A, b: B) => TResult, a: _, b: _): (this: This, a: A, b: B) => TResult;
export function partial<This, A, B, TResult>(f: (this: This, a: A, b: B) => TResult, _this: _this, a: A, b: B): (_this: This) => TResult;
export function partial<This, A, B, TResult>(f: (this: This, a: A, b: B) => TResult, _this: _this, a: _, b: B): (_this: This, a: A) => TResult;
export function partial<This, A, B, TResult>(f: (this: This, a: A, b: B) => TResult, _this: _this, a: A, b: _): (_this: This, b: B) => TResult;
export function partial<This, A, B, TResult>(f: (this: This, a: A, b: B) => TResult, _this: _this, a: _, b: _): (_this: This, a: A, b: B) => TResult;
export function partial<This, A, B, TResult>(f: (this: This, a: A, b: B) => TResult, a: A, _this: _this, b: B): (_this: This) => TResult;
export function partial<This, A, B, TResult>(f: (this: This, a: A, b: B) => TResult, a: _, _this: _this, b: B): (a: A, _this: This) => TResult;
export function partial<This, A, B, TResult>(f: (this: This, a: A, b: B) => TResult, a: A, _this: _this, b: _): (_this: This, b: B) => TResult;
export function partial<This, A, B, TResult>(f: (this: This, a: A, b: B) => TResult, a: _, _this: _this, b: _): (a: A, _this: This, b: B) => TResult;
export function partial<This, A, B, TResult>(f: (this: This, a: A, b: B) => TResult, a: A, b: B, _this: _this): (_this: This) => TResult;
export function partial<This, A, B, TResult>(f: (this: This, a: A, b: B) => TResult, a: _, b: B, _this: _this): (a: A, _this: This) => TResult;
export function partial<This, A, B, TResult>(f: (this: This, a: A, b: B) => TResult, a: A, b: _, _this: _this): (b: B, _this: This) => TResult;
export function partial<This, A, B, TResult>(f: (this: This, a: A, b: B) => TResult, a: _, b: _, _this: _this): (a: A, b: B, _this: This) => TResult;
export function partial<This, A, B, TRest extends any[], TResult>(f: (this: This, a: A, b: B, ...rest: TRest) => TResult, a: A, b: B, _rest: _rest): (this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, TRest extends any[], TResult>(f: (this: This, a: A, b: B, ...rest: TRest) => TResult, a: _, b: B, _rest: _rest): (this: This, a: A, ...rest: TRest) => TResult;
export function partial<This, A, B, TRest extends any[], TResult>(f: (this: This, a: A, b: B, ...rest: TRest) => TResult, a: A, b: _, _rest: _rest): (this: This, b: B, ...rest: TRest) => TResult;
export function partial<This, A, B, TRest extends any[], TResult>(f: (this: This, a: A, b: B, ...rest: TRest) => TResult, a: _, b: _, _rest: _rest): (this: This, a: A, b: B, ...rest: TRest) => TResult;
export function partial<This, A, B, TRest extends any[], TResult>(f: (this: This, a: A, b: B, ...rest: TRest) => TResult, _this: _this, a: A, b: B, _rest: _rest): (_this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, TRest extends any[], TResult>(f: (this: This, a: A, b: B, ...rest: TRest) => TResult, _this: _this, a: _, b: B, _rest: _rest): (_this: This, a: A, ...rest: TRest) => TResult;
export function partial<This, A, B, TRest extends any[], TResult>(f: (this: This, a: A, b: B, ...rest: TRest) => TResult, _this: _this, a: A, b: _, _rest: _rest): (_this: This, b: B, ...rest: TRest) => TResult;
export function partial<This, A, B, TRest extends any[], TResult>(f: (this: This, a: A, b: B, ...rest: TRest) => TResult, _this: _this, a: _, b: _, _rest: _rest): (_this: This, a: A, b: B, ...rest: TRest) => TResult;
export function partial<This, A, B, TRest extends any[], TResult>(f: (this: This, a: A, b: B, ...rest: TRest) => TResult, a: A, _this: _this, b: B, _rest: _rest): (_this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, TRest extends any[], TResult>(f: (this: This, a: A, b: B, ...rest: TRest) => TResult, a: _, _this: _this, b: B, _rest: _rest): (a: A, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, TRest extends any[], TResult>(f: (this: This, a: A, b: B, ...rest: TRest) => TResult, a: A, _this: _this, b: _, _rest: _rest): (_this: This, b: B, ...rest: TRest) => TResult;
export function partial<This, A, B, TRest extends any[], TResult>(f: (this: This, a: A, b: B, ...rest: TRest) => TResult, a: _, _this: _this, b: _, _rest: _rest): (a: A, _this: This, b: B, ...rest: TRest) => TResult;
export function partial<This, A, B, TRest extends any[], TResult>(f: (this: This, a: A, b: B, ...rest: TRest) => TResult, a: A, b: B, _this: _this, _rest: _rest): (_this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, TRest extends any[], TResult>(f: (this: This, a: A, b: B, ...rest: TRest) => TResult, a: _, b: B, _this: _this, _rest: _rest): (a: A, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, TRest extends any[], TResult>(f: (this: This, a: A, b: B, ...rest: TRest) => TResult, a: A, b: _, _this: _this, _rest: _rest): (b: B, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, TRest extends any[], TResult>(f: (this: This, a: A, b: B, ...rest: TRest) => TResult, a: _, b: _, _this: _this, _rest: _rest): (a: A, b: B, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: A, b: B, c: C): (this: This) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: _, b: B, c: C): (this: This, a: A) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: A, b: _, c: C): (this: This, b: B) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: A, b: B, c: _): (this: This, c: C) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: _, b: _, c: C): (this: This, a: A, b: B) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: A, b: _, c: _): (this: This, b: B, c: C) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: _, b: B, c: _): (this: This, a: A, c: C) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: _, b: _, c: _): (this: This, a: A, b: B, c: C) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, _this: _this, a: A, b: B, c: C): (_this: This) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, _this: _this, a: _, b: B, c: C): (_this: This, a: A) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, _this: _this, a: A, b: _, c: C): (_this: This, b: B) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, _this: _this, a: A, b: B, c: _): (_this: This, c: C) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, _this: _this, a: _, b: _, c: C): (_this: This, a: A, b: B) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, _this: _this, a: A, b: _, c: _): (_this: This, b: B, c: C) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, _this: _this, a: _, b: B, c: _): (_this: This, a: A, c: C) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, _this: _this, a: _, b: _, c: _): (_this: This, a: A, b: B, c: C) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: A, _this: _this, b: B, c: C): (_this: This) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: _, _this: _this, b: B, c: C): (a: A, _this: This) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: A, _this: _this, b: _, c: C): (_this: This, b: B) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: A, _this: _this, b: B, c: _): (_this: This, c: C) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: _, _this: _this, b: _, c: C): (a: A, _this: This, b: B) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: A, _this: _this, b: _, c: _): (_this: This, b: B, c: C) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: _, _this: _this, b: B, c: _): (a: A, _this: This, c: C) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: _, _this: _this, b: _, c: _): (a: A, _this: This, b: B, c: C) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: A, b: B, _this: _this, c: C): (_this: This) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: _, b: B, _this: _this, c: C): (a: A, _this: This) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: A, b: _, _this: _this, c: C): (b: B, _this: This) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: A, b: B, _this: _this, c: _): (_this: This, c: C) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: _, b: _, _this: _this, c: C): (a: A, b: B, _this: This) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: A, b: _, _this: _this, c: _): (b: B, _this: This, c: C) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: _, b: B, _this: _this, c: _): (a: A, _this: This, c: C) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: _, b: _, _this: _this, c: _): (a: A, b: B, _this: This, c: C) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: A, b: B, c: C, _this: _this): (_this: This) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: _, b: B, c: C, _this: _this): (a: A, _this: This) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: A, b: _, c: C, _this: _this): (b: B, _this: This) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: A, b: B, c: _, _this: _this): (c: C, _this: This) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: _, b: _, c: C, _this: _this): (a: A, b: B, _this: This) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: A, b: _, c: _, _this: _this): (b: B, c: C, _this: This) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: _, b: B, c: _, _this: _this): (a: A, c: C, _this: This) => TResult;
export function partial<This, A, B, C, TResult>(f: (this: This, a: A, b: B, c: C) => TResult, a: _, b: _, c: _, _this: _this): (a: A, b: B, c: C, _this: This) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: A, b: B, c: C, _rest: _rest): (this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: _, b: B, c: C, _rest: _rest): (this: This, a: A, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: A, b: _, c: C, _rest: _rest): (this: This, b: B, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: A, b: B, c: _, _rest: _rest): (this: This, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: _, b: _, c: C, _rest: _rest): (this: This, a: A, b: B, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: A, b: _, c: _, _rest: _rest): (this: This, b: B, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: _, b: B, c: _, _rest: _rest): (this: This, a: A, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: _, b: _, c: _, _rest: _rest): (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, _this: _this, a: A, b: B, c: C, _rest: _rest): (_this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, _this: _this, a: _, b: B, c: C, _rest: _rest): (_this: This, a: A, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, _this: _this, a: A, b: _, c: C, _rest: _rest): (_this: This, b: B, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, _this: _this, a: A, b: B, c: _, _rest: _rest): (_this: This, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, _this: _this, a: _, b: _, c: C, _rest: _rest): (_this: This, a: A, b: B, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, _this: _this, a: A, b: _, c: _, _rest: _rest): (_this: This, b: B, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, _this: _this, a: _, b: B, c: _, _rest: _rest): (_this: This, a: A, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, _this: _this, a: _, b: _, c: _, _rest: _rest): (_this: This, a: A, b: B, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: A, _this: _this, b: B, c: C, _rest: _rest): (_this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: _, _this: _this, b: B, c: C, _rest: _rest): (a: A, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: A, _this: _this, b: _, c: C, _rest: _rest): (_this: This, b: B, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: A, _this: _this, b: B, c: _, _rest: _rest): (_this: This, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: _, _this: _this, b: _, c: C, _rest: _rest): (a: A, _this: This, b: B, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: A, _this: _this, b: _, c: _, _rest: _rest): (_this: This, b: B, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: _, _this: _this, b: B, c: _, _rest: _rest): (_this: This, a: A, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: _, _this: _this, b: _, c: _, _rest: _rest): (a: A, _this: This, b: B, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: A, b: B, _this: _this, c: C, _rest: _rest): (_this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: _, b: B, _this: _this, c: C, _rest: _rest): (a: A, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: A, b: _, _this: _this, c: C, _rest: _rest): (b: B, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: A, b: B, _this: _this, c: _, _rest: _rest): (_this: This, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: _, b: _, _this: _this, c: C, _rest: _rest): (a: A, b: B, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: A, b: _, _this: _this, c: _, _rest: _rest): (b: B, _this: This, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: _, b: B, _this: _this, c: _, _rest: _rest): (a: A, _this: This, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: _, b: _, _this: _this, c: _, _rest: _rest): (a: A, b: B, _this: This, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: A, b: B, c: C, _this: _this, _rest: _rest): (_this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: _, b: B, c: C, _this: _this, _rest: _rest): (a: A, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: A, b: _, c: C, _this: _this, _rest: _rest): (b: B, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: A, b: B, c: _, _this: _this, _rest: _rest): (c: C, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: _, b: _, c: C, _this: _this, _rest: _rest): (a: A, b: B, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: A, b: _, c: _, _this: _this, _rest: _rest): (b: B, c: C, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: _, b: B, c: _, _this: _this, _rest: _rest): (a: A, c: C, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult, a: _, b: _, c: _, _this: _this, _rest: _rest): (a: A, b: B, c: C, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: B, c: C, d: D): (this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: B, c: C, d: D): (this: This, a: A) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: _, c: C, d: D): (this: This, b: B) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: B, c: _, d: D): (this: This, c: C) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: B, c: C, d: _): (this: This, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: _, c: C, d: D): (this: This, a: A, b: B) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: B, c: _, d: D): (this: This, a: A, c: C) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: B, c: C, d: _): (this: This, a: A, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: _, c: _, d: D): (this: This, b: B, c: C) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: _, c: C, d: _): (this: This, b: B, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: B, c: _, d: _): (this: This, c: C, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: _, c: _, d: D): (this: This, a: A, b: B, c: C) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: _, c: C, d: _): (this: This, a: A, b: B, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: B, c: _, d: _): (this: This, a: A, c: C, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: _, c: _, d: _): (this: This, b: B, c: C, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: _, c: _, d: _): (this: This, a: A, b: B, c: C, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, _this: _this, a: A, b: B, c: C, d: D): (_this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, _this: _this, a: _, b: B, c: C, d: D): (_this: This, a: A) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, _this: _this, a: A, b: _, c: C, d: D): (_this: This, b: B) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, _this: _this, a: A, b: B, c: _, d: D): (_this: This, c: C) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, _this: _this, a: A, b: B, c: C, d: _): (_this: This, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, _this: _this, a: _, b: _, c: C, d: D): (_this: This, a: A, b: B) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, _this: _this, a: _, b: B, c: _, d: D): (_this: This, a: A, c: C) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, _this: _this, a: _, b: B, c: C, d: _): (_this: This, a: A, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, _this: _this, a: A, b: _, c: _, d: D): (_this: This, b: B, c: C) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, _this: _this, a: A, b: _, c: C, d: _): (_this: This, b: B, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, _this: _this, a: A, b: B, c: _, d: _): (_this: This, c: C, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, _this: _this, a: _, b: _, c: _, d: D): (_this: This, a: A, b: B, c: C) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, _this: _this, a: _, b: _, c: C, d: _): (_this: This, a: A, b: B, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, _this: _this, a: _, b: B, c: _, d: _): (_this: This, a: A, c: C, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, _this: _this, a: A, b: _, c: _, d: _): (_this: This, b: B, c: C, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, _this: _this, a: _, b: _, c: _, d: _): (_this: This, a: A, b: B, c: C, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, _this: _this, b: B, c: C, d: D): (_this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, _this: _this, b: B, c: C, d: D): (a: A, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, _this: _this, b: _, c: C, d: D): (_this: This, b: B) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, _this: _this, b: B, c: _, d: D): (_this: This, c: C) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, _this: _this, b: B, c: C, d: _): (_this: This, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, _this: _this, b: _, c: C, d: D): (a: A, _this: This, b: B) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, _this: _this, b: B, c: _, d: D): (a: A, _this: This, c: C) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, _this: _this, b: B, c: C, d: _): (a: A, _this: This, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, _this: _this, b: _, c: _, d: D): (_this: This, b: B, c: C) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, _this: _this, b: _, c: C, d: _): (_this: This, b: B, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, _this: _this, b: B, c: _, d: _): (_this: This, c: C, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, _this: _this, b: _, c: _, d: D): (a: A, _this: This, b: B, c: C) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, _this: _this, b: _, c: C, d: _): (a: A, _this: This, b: B, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, _this: _this, b: B, c: _, d: _): (a: A, _this: This, c: C, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, _this: _this, b: _, c: _, d: _): (_this: This, b: B, c: C, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, _this: _this, b: _, c: _, d: _): (a: A, _this: This, b: B, c: C, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: B, _this: _this, c: C, d: D): (_this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: B, _this: _this, c: C, d: D): (a: A, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: _, _this: _this, c: C, d: D): (b: B, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: B, _this: _this, c: _, d: D): (_this: This, c: C) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: B, _this: _this, c: C, d: _): (_this: This, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: _, _this: _this, c: C, d: D): (a: A, b: B, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: B, _this: _this, c: _, d: D): (a: A, _this: This, c: C) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: B, _this: _this, c: C, d: _): (a: A, _this: This, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: _, _this: _this, c: _, d: D): (b: B, _this: This, c: C) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: _, _this: _this, c: C, d: _): (b: B, _this: This, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: B, _this: _this, c: _, d: _): (_this: This, c: C, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: _, _this: _this, c: _, d: D): (a: A, b: B, _this: This, c: C) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: _, _this: _this, c: C, d: _): (a: A, b: B, _this: This, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: B, _this: _this, c: _, d: _): (a: A, _this: This, c: C, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: _, _this: _this, c: _, d: _): (b: B, _this: This, c: C, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: _, _this: _this, c: _, d: _): (a: A, b: B, _this: This, c: C, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: B, c: C, _this: _this, d: D): (_this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: B, c: C, _this: _this, d: D): (a: A, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: _, c: C, _this: _this, d: D): (b: B, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: B, c: _, _this: _this, d: D): (c: C, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: B, c: C, _this: _this, d: _): (_this: This, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: _, c: C, _this: _this, d: D): (a: A, b: B, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: B, c: _, _this: _this, d: D): (a: A, c: C, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: B, c: C, _this: _this, d: _): (a: A, _this: This, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: _, c: _, _this: _this, d: D): (b: B, c: C, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: _, c: C, _this: _this, d: _): (b: B, _this: This, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: B, c: _, _this: _this, d: _): (c: C, _this: This, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: _, c: _, _this: _this, d: D): (a: A, b: B, c: C, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: _, c: C, _this: _this, d: _): (a: A, b: B, _this: This, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: B, c: _, _this: _this, d: _): (a: A, c: C, _this: This, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: _, c: _, _this: _this, d: _): (b: B, c: C, _this: This, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: _, c: _, _this: _this, d: _): (a: A, b: B, c: C, _this: This, d: D) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: B, c: C, d: D, _this: _this): (_this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: B, c: C, d: D, _this: _this): (a: A, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: _, c: C, d: D, _this: _this): (b: B, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: B, c: _, d: D, _this: _this): (c: C, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: B, c: C, d: _, _this: _this): (d: D, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: _, c: C, d: D, _this: _this): (a: A, b: B, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: B, c: _, d: D, _this: _this): (a: A, c: C, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: B, c: C, d: _, _this: _this): (a: A, d: D, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: _, c: _, d: D, _this: _this): (b: B, c: C, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: _, c: C, d: _, _this: _this): (b: B, d: D, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: B, c: _, d: _, _this: _this): (c: C, d: D, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: _, c: _, d: D, _this: _this): (a: A, b: B, c: C, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: _, c: C, d: _, _this: _this): (a: A, b: B, d: D, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: B, c: _, d: _, _this: _this): (a: A, c: C, d: D, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: A, b: _, c: _, d: _, _this: _this): (b: B, c: C, d: D, _this: This) => TResult;
export function partial<This, A, B, C, D, TResult>(f: (this: This, a: A, b: B, c: C, d: D) => TResult, a: _, b: _, c: _, d: _, _this: _this): (a: A, b: B, c: C, d: D, _this: This) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: B, c: C, d: D, _rest: _rest): (this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: B, c: C, d: D, _rest: _rest): (this: This, a: A, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: _, c: C, d: D, _rest: _rest): (this: This, b: B, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: B, c: _, d: D, _rest: _rest): (this: This, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: B, c: C, d: _, _rest: _rest): (this: This, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: _, c: C, d: D, _rest: _rest): (this: This, a: A, b: B, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: B, c: _, d: D, _rest: _rest): (this: This, a: A, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: B, c: C, d: _, _rest: _rest): (this: This, a: A, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: _, c: _, d: D, _rest: _rest): (this: This, b: B, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: _, c: C, d: _, _rest: _rest): (this: This, b: B, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: B, c: _, d: _, _rest: _rest): (this: This, c: C, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: _, c: _, d: D, _rest: _rest): (this: This, a: A, b: B, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: _, c: C, d: _, _rest: _rest): (this: This, a: A, b: B, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: B, c: _, d: _, _rest: _rest): (this: This, a: A, c: C, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: _, c: _, d: _, _rest: _rest): (this: This, b: B, c: C, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: _, c: _, d: _, _rest: _rest): (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, _this: _this, a: A, b: B, c: C, d: D, _rest: _rest): (_this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, _this: _this, a: _, b: B, c: C, d: D, _rest: _rest): (_this: This, a: A, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, _this: _this, a: A, b: _, c: C, d: D, _rest: _rest): (_this: This, b: B, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, _this: _this, a: A, b: B, c: _, d: D, _rest: _rest): (_this: This, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, _this: _this, a: A, b: B, c: C, d: _, _rest: _rest): (_this: This, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, _this: _this, a: _, b: _, c: C, d: D, _rest: _rest): (_this: This, a: A, b: B, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, _this: _this, a: _, b: B, c: _, d: D, _rest: _rest): (_this: This, a: A, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, _this: _this, a: _, b: B, c: C, d: _, _rest: _rest): (_this: This, a: A, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, _this: _this, a: A, b: _, c: _, d: D, _rest: _rest): (_this: This, b: B, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, _this: _this, a: A, b: _, c: C, d: _, _rest: _rest): (_this: This, b: B, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, _this: _this, a: A, b: B, c: _, d: _, _rest: _rest): (_this: This, c: C, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, _this: _this, a: _, b: _, c: _, d: D, _rest: _rest): (_this: This, a: A, b: B, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, _this: _this, a: _, b: _, c: C, d: _, _rest: _rest): (_this: This, a: A, b: B, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, _this: _this, a: _, b: B, c: _, d: _, _rest: _rest): (_this: This, a: A, c: C, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, _this: _this, a: A, b: _, c: _, d: _, _rest: _rest): (_this: This, b: B, c: C, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, _this: _this, a: _, b: _, c: _, d: _, _rest: _rest): (_this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, _this: _this, b: B, c: C, d: D, _rest: _rest): (_this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, _this: _this, b: B, c: C, d: D, _rest: _rest): (a: A, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, _this: _this, b: _, c: C, d: D, _rest: _rest): (_this: This, b: B, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, _this: _this, b: B, c: _, d: D, _rest: _rest): (_this: This, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, _this: _this, b: B, c: C, d: _, _rest: _rest): (_this: This, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, _this: _this, b: _, c: C, d: D, _rest: _rest): (a: A, _this: This, b: B, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, _this: _this, b: B, c: _, d: D, _rest: _rest): (a: A, _this: This, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, _this: _this, b: B, c: C, d: _, _rest: _rest): (a: A, _this: This, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, _this: _this, b: _, c: _, d: D, _rest: _rest): (_this: This, b: B, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, _this: _this, b: _, c: C, d: _, _rest: _rest): (_this: This, b: B, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, _this: _this, b: B, c: _, d: _, _rest: _rest): (_this: This, c: C, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, _this: _this, b: _, c: _, d: D, _rest: _rest): (a: A, _this: This, b: B, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, _this: _this, b: _, c: C, d: _, _rest: _rest): (a: A, _this: This, b: B, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, _this: _this, b: B, c: _, d: _, _rest: _rest): (a: A, _this: This, c: C, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, _this: _this, b: _, c: _, d: _, _rest: _rest): (_this: This, b: B, c: C, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, _this: _this, b: _, c: _, d: _, _rest: _rest): (a: A, _this: This, b: B, c: C, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: B, _this: _this, c: C, d: D, _rest: _rest): (_this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: B, _this: _this, c: C, d: D, _rest: _rest): (a: A, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: _, _this: _this, c: C, d: D, _rest: _rest): (b: B, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: B, _this: _this, c: _, d: D, _rest: _rest): (_this: This, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: B, _this: _this, c: C, d: _, _rest: _rest): (_this: This, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: _, _this: _this, c: C, d: D, _rest: _rest): (a: A, b: B, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: B, _this: _this, c: _, d: D, _rest: _rest): (a: A, _this: This, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: B, _this: _this, c: C, d: _, _rest: _rest): (a: A, _this: This, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: _, _this: _this, c: _, d: D, _rest: _rest): (b: B, _this: This, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: _, _this: _this, c: C, d: _, _rest: _rest): (b: B, _this: This, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: B, _this: _this, c: _, d: _, _rest: _rest): (_this: This, c: C, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: _, _this: _this, c: _, d: D, _rest: _rest): (a: A, b: B, _this: This, c: C, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: _, _this: _this, c: C, d: _, _rest: _rest): (a: A, b: B, _this: This, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: B, _this: _this, c: _, d: _, _rest: _rest): (a: A, _this: This, c: C, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: _, _this: _this, c: _, d: _, _rest: _rest): (b: B, _this: This, c: C, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: _, _this: _this, c: _, d: _, _rest: _rest): (a: A, b: B, _this: This, c: C, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: B, c: C, _this: _this, d: D, _rest: _rest): (_this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: B, c: C, _this: _this, d: D, _rest: _rest): (a: A, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: _, c: C, _this: _this, d: D, _rest: _rest): (b: B, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: B, c: _, _this: _this, d: D, _rest: _rest): (c: C, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: B, c: C, _this: _this, d: _, _rest: _rest): (_this: This, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: _, c: C, _this: _this, d: D, _rest: _rest): (a: A, b: B, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: B, c: _, _this: _this, d: D, _rest: _rest): (a: A, c: C, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: B, c: C, _this: _this, d: _, _rest: _rest): (a: A, _this: This, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: _, c: _, _this: _this, d: D, _rest: _rest): (b: B, c: C, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: _, c: C, _this: _this, d: _, _rest: _rest): (b: B, _this: This, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: B, c: _, _this: _this, d: _, _rest: _rest): (c: C, _this: This, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: _, c: _, _this: _this, d: D, _rest: _rest): (a: A, b: B, c: C, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: _, c: C, _this: _this, d: _, _rest: _rest): (a: A, b: B, _this: This, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: B, c: _, _this: _this, d: _, _rest: _rest): (a: A, c: C, _this: This, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: _, c: _, _this: _this, d: _, _rest: _rest): (b: B, c: C, _this: This, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: _, c: _, _this: _this, d: _, _rest: _rest): (a: A, b: B, c: C, _this: This, d: D, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: B, c: C, d: D, _this: _this, _rest: _rest): (_this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: B, c: C, d: D, _this: _this, _rest: _rest): (a: A, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: _, c: C, d: D, _this: _this, _rest: _rest): (b: B, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: B, c: _, d: D, _this: _this, _rest: _rest): (c: C, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: B, c: C, d: _, _this: _this, _rest: _rest): (d: D, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: _, c: C, d: D, _this: _this, _rest: _rest): (a: A, b: B, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: B, c: _, d: D, _this: _this, _rest: _rest): (a: A, c: C, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: B, c: C, d: _, _this: _this, _rest: _rest): (a: A, d: D, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: _, c: _, d: D, _this: _this, _rest: _rest): (b: B, c: C, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: _, c: C, d: _, _this: _this, _rest: _rest): (b: B, d: D, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: B, c: _, d: _, _this: _this, _rest: _rest): (c: C, d: D, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: _, c: _, d: D, _this: _this, _rest: _rest): (a: A, b: B, c: C, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: _, c: C, d: _, _this: _this, _rest: _rest): (a: A, b: B, d: D, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: B, c: _, d: _, _this: _this, _rest: _rest): (a: A, c: C, d: D, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: A, b: _, c: _, d: _, _this: _this, _rest: _rest): (b: B, c: C, d: D, _this: This, ...rest: TRest) => TResult;
export function partial<This, A, B, C, D, TRest extends any[], TResult>(f: (this: This, a: A, b: B, c: C, d: D, ...rest: TRest) => TResult, a: _, b: _, c: _, d: _, _this: _this, _rest: _rest): (a: A, b: B, c: C, d: D, _this: This, ...rest: TRest) => TResult;
export function partial(f: (this: any, ...args: any) => any, ...partialArgs: any[]): (this: any, ...args: any[]) => any {
    let hasThis = false;
    let hasRest = false;
    for (const partialArg of partialArgs) {
        if (partialArg === thisPlaceholder) {
            if (hasRest) throw new Error("'this' placeholder cannot be specified after '...rest' placeholder.");
            if (hasThis) throw new Error("'this' placeholder cannot be specified more than once.");
            hasThis = true;
        }
        else if (partialArg === restPlaceholder) {
            if (hasRest) throw new Error("'...rest' placeholder specified more than once.");
            hasRest = true;
        }
        else if (partialArg === placeholder) {
            if (hasRest) throw new Error("Argument placeholder cannot be specified after '...rest' placeholder.");
        }
    }
    const name = `partial ${f.name}`;
    const pf: (this: any, ...args: any[]) => any = {
        [name]: function (this: any, ...appliedArgs: any[]) {
            const { thisArg, args } = bindPartial(this, partialArgs, appliedArgs);
            return f.apply(thisArg, args);
        }
    }[name];
    return pf;
}

function bindPartial(thisArg: any, partialArgs: any[], appliedArgs: any[]) {
    const args: any[] = [];
    let appliedArgIndex = 0;
    for (let partialArgIndex = 0; partialArgIndex < partialArgs.length; partialArgIndex++) {
        const partialArg = partialArgs[partialArgIndex];
        if (partialArg === placeholder) {
            if (appliedArgIndex < appliedArgs.length) {
                args.push(appliedArgs[appliedArgIndex++]);
            }
            else {
                args.push(undefined);
            }
        }
        else if (partialArg === restPlaceholder) {
            while (appliedArgIndex < appliedArgs.length) {
                args.push(appliedArgs[appliedArgIndex++]);
            }
        }
        else if (partialArg === thisPlaceholder) {
            if (appliedArgIndex < appliedArgs.length) {
                thisArg = appliedArgs[appliedArgIndex++];
            }
            else {
                thisArg = undefined;
            }
        }
        else {
            args.push(partialArg);
        }
    }
    return { thisArg, args };
}
