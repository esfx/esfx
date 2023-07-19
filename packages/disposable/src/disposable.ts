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

import /*#__INLINE__*/ { isFunction, isIterableObject, isObject } from "@esfx/internal-guards";
import { CreateScope, DisposeResources, execSync } from "./internal/utils.js";

const disposeSymbol: unique symbol =
    typeof (Symbol as any)["dispose"] === "symbol" ?
        (Symbol as any)["dispose"] :
        Symbol.for("@esfx/disposable:Disposable.dispose");

type Is<T extends U, U> = T;
type DisposeSymbol =
    globalThis.SymbolConstructor extends { "dispose": Is<infer S, symbol> } ?
        S :
        typeof disposeSymbol;

/**
 * Indicates an object that has resources that can be explicitly disposed.
 */
export interface Disposable {
    /**
     * Dispose this object's resources.
     */
    [Disposable.dispose](): void;
}

/**
 * Indicates an object that has resources that can be explicitly disposed.
 */
export namespace Disposable {
    /**
     * A well-known symbol used to define an explicit resource disposal method on an object.
     *
     * NOTE: Uses `Symbol.dispose` if present.
     */
    export const dispose: DisposeSymbol = disposeSymbol as DisposeSymbol;

    /**
     * Emulate `using` using `for..of`.
     *
     * NOTE: This is not spec-compliant and will not be standardized.
     *
     * @example
     * ```ts
     * // with `using` (proposed)
     * {
     *   ...
     *   using x = expr, y = expr;
     *   ...
     * }
     *
     * // with `Disposable.scope()`:
     * for (const { using, fail } of Disposable.scope()) {
     *   try {
     *     ...
     *     const x = using(expr), y = using(expr);
     *     ...
     *   }
     *   catch (e) {
     *     fail(e);
     *   }
     * }
     * ```
     */
    export function * scope(): Generator<DisposableScope, void, undefined> {
        const context = CreateScope("sync-dispose");
        try {
            context.state = "initialized";
            yield context.scope;
            context.state = "exiting";
        }
        finally {
            context.state = "done";
            execSync(DisposeResources("sync-dispose", context.disposables, context.throwCompletion));
        }
    }

    /**
     * Yields each disposable in the iterable, disposing it when the generator resumes.
     *
     * This emulates `for (using x of expr)`.
     *
     * NOTE: This is not spec-compliant and will not be standardized.
     *
     * @example
     * ```ts
     * // with `using` (proposed)
     * for (using x of expr) {
     *   ...
     * }
     *
     * // with `Disposable.usingEach()`:
     * for (const x of Disposable.usingEach(expr)) {
     *   ...
     * }
     * ```
     */
    export function * usingEach(iterable: Iterable<Disposable | null | undefined>) {
        if (!isIterableObject(iterable)) throw new TypeError("Object not iterable: iterable");

        // for (using disposable of disposables) yield disposable;
        for (const disposable of iterable) {
            for (const { using, fail } of Disposable.scope()) try {
                yield using(disposable);
            } catch (e) { fail(e); }
        }
    }

    const disposablePrototype = {};
    Object.defineProperty(disposablePrototype, Symbol.toStringTag, { configurable: true, value: "Disposable" });

    /**
     * Creates a `Disposable` wrapper around a callback used to dispose of a resource.
     *
     * NOTE: This is not spec-compliant and will not be standardized. It is preferred to use a `DisposableStack`
     * or to implement `Disposable.dispose` yourself instead.
     */
    export function create(dispose: () => void): Disposable {
        if (!isFunction(dispose)) throw new TypeError("Function expected: dispose");

        let disposed = false;
        return Object.setPrototypeOf({
            [Disposable.dispose]() {
                if (!disposed) {
                    disposed = true;
                    const cb = dispose;
                    dispose = undefined!;
                    cb();
                }
            }
        }, disposablePrototype);
    }

    /**
     * Determines whether a value is Disposable.
     *
     * NOTE: This is not spec-compliant and will not be standardized.
     */
    export function hasInstance(value: unknown): value is Disposable {
        return isObject(value)
            && Disposable.dispose in value;
    }
}

Object.defineProperty(Disposable, Symbol.hasInstance, Object.getOwnPropertyDescriptor(Disposable, "hasInstance")!);

/**
 * Used to aproximate `using` via `for..of`. See {@link Disposable.scope}.
 *
 * NOTE: This is not spec-compliant and will not be standardized.
 */
export interface DisposableScope {
    /**
     * Tracks a resource to be disposed at the end of a `for..of` statement. See {@link Disposable.scope}.
     */
    using<T extends Disposable | null | undefined>(value: T): T;

    /**
     * Tracks an exception from the body of a `for..of` statement. See {@link Disposable.scope}.
     */
    fail(error: unknown): void;
}
