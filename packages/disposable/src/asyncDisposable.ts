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

import /*#__INLINE__*/ { isAsyncIterableObject, isFunction, isIterableObject, isObject } from "@esfx/internal-guards";
import { Disposable } from "./disposable.js";
import { CreateScope, DisposeResources } from "./internal/utils.js";

/**
 * Indicates an object that has resources that can be explicitly disposed asynchronously.
 */
export interface AsyncDisposable {
    /**
     * Dispose this object's resources.
     */
    [AsyncDisposable.asyncDispose](): Promise<void>;
}

/**
 * Indicates an object that has resources that can be explicitly disposed asynchronously.
 *
 * NOTE: It is not necessary to subclass `AsyncDisposable`. Merely having an `[AsyncDisposable.asyncDispose]()` method is sufficient.
 */
export class AsyncDisposable {
    /**
     * Creates an `AsyncDisposable` wrapper around a callback used to dispose resources.
     * @deprecated Use `AsyncDisposableStack` or `{ [AsyncDisposable.asyncDispose]() { ... } }` instead.
     */
    constructor(disposeAsync: () => void | PromiseLike<void>) {
        if (!isFunction(disposeAsync)) throw new TypeError("Function expected: disposeAsync");

        return AsyncDisposable.create(disposeAsync);
    }
}

export namespace AsyncDisposable {
    /**
     * A well-known symbol used to define an async explicit resource disposal method on an object.
     *
     * NOTE: Uses `Symbol.asyncDispose` if present.
     */
    export const asyncDispose: unique symbol =
        typeof (Symbol as any)["asyncDispose"] === "symbol" ?
            (Symbol as any)["asyncDispose"] :
            Symbol.for("@esfx/disposable:AsyncDisposable.asyncDispose");

    /**
     * Emulate `using await const` using `for..await..of`.
     *
     * NOTE: This is not spec-compliant and will not be standardized.
     *
     * @example
     * ```ts
     * // with `using await const` (proposed)
     * {
     *   ...
     *   using await const x = expr, y = expr;
     *   ...
     * }
     *
     * // with `AsyncDisposable.scope()`:
     * for await (const { using, fail } of AsyncDisposable.scope()) {
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
    export async function * scope(): AsyncGenerator<AsyncDisposableScope, void, undefined> {
        const context = CreateScope("async");
        try {
            context.state = "initialized";
            yield context.scope;
            context.state = "exiting";
        }
        finally {
            context.state = "done";
            await DisposeResources("async", context.disposables, context.throwCompletion);
        }
    }

    /**
     * Yields each disposable in the iterable, disposing it when the generator resumes.
     *
     * This emulates `for (using await const x of expr)`.
     *
     * NOTE: This is not spec-compliant and will not be standardized.
     *
     * @example
     * ```ts
     * // with `using await const` (proposed)
     * for (using await const x of expr) {
     *   ...
     * }
     * for await (using await const x of expr) {
     *   ...
     * }
     *
     * // with `Disposable.usingEach()`:
     * for await (const x of Disposable.usingEach(expr)) {
     *   ...
     * }
     * ```
     */
    export async function * usingEach(iterable: AsyncIterable<AsyncDisposable | Disposable | null | undefined> | Iterable<AsyncDisposable | Disposable | null | undefined | PromiseLike<AsyncDisposable | Disposable | null | undefined>>) {
        if (!isAsyncIterableObject(iterable) && !isIterableObject(iterable)) throw new TypeError("Object not iterable: iterable");

        for await (const disposable of iterable) {
            for await (const { using, fail } of AsyncDisposable.scope()) try {
                yield using(disposable);
            } catch (e) { fail(e); }
        }
    }

    const asyncDisposablePrototype = AsyncDisposable.prototype;
    Object.defineProperty(asyncDisposablePrototype, Symbol.toStringTag, { configurable: true, value: "AsyncDisposable" });

    /**
     * Creates an `AsyncDisposable` wrapper around a callback used to dispose resources.
     *
     * NOTE: This is not spec-compliant and will not be standardized. It is preferred to use an `AsyncDisposableStack`
     * or to implement `AsyncDisposable.asyncDispose` yourself instead.
     */
    export function create(disposeAsync: () => void | PromiseLike<void>): AsyncDisposable {
        if (!isFunction(disposeAsync)) throw new TypeError("Function expected: disposeAsync");

        let disposed = false;
        return Object.setPrototypeOf({
            async [AsyncDisposable.asyncDispose]() {
                if (!disposed) {
                    disposed = true;
                    const cb = disposeAsync;
                    disposeAsync = undefined!;
                    await cb();
                }
            }
        }, asyncDisposablePrototype);
    }

    /**
     * Determines whether a value is `AsyncDisposable`.
     *
     * NOTE: This is not spec-compliant and will not be standardized.
     */
    export function hasInstance(value: unknown): value is AsyncDisposable {
        return isObject(value) && AsyncDisposable.asyncDispose in value;
    }
}

Object.defineProperty(AsyncDisposable, Symbol.hasInstance, Object.getOwnPropertyDescriptor(AsyncDisposable, "hasInstance")!);

export interface AsyncDisposableScope {
    /**
     * Tracks a resource to be disposed at the end of a `for..of` statement. See {@link AsyncDisposable.scope}.
     */
    using<T extends Disposable | AsyncDisposable | null | undefined>(value: T): T;

    /**
     * Tracks an exception from the body of a `for..of` statement. See {@link AsyncDisposable.scope}.
     */
    fail(error: unknown): void;
}
