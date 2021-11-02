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

import { AddDisposableResource, asyncDisposeSym, createDeprecation, CreateScope, DisposableResourceRecord, DisposeResources, ThrowCompletion } from "./internal/utils";
import { weakAsyncDisposableResourceStack, weakAsyncDisposableState } from "./internal/asyncDisposable";
import type { Disposable } from "./disposable";

const reportAsyncDisposableCreateDeprecation = createDeprecation("Use 'new AsyncDisposable(dispose)' instead.");

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
 * NOTE: It is not necessary to subclass `Disposable`. Merely having a `[Disposable.dispose]()` method is sufficient.
 */
export class AsyncDisposable {
    /**
     * A well-known symbol used to define an async explicit resource disposal method on an object.
     *
     * Uses `Symbol.asyncDispose` if present.
     */
    static readonly asyncDispose: unique symbol = asyncDisposeSym;

    /**
     * Creates an `AsyncDisposable` wrapper around a callback used to dispose resources.
     */
    constructor(dispose: () => void | PromiseLike<void>) {
        if (typeof dispose !== "function") throw new TypeError("Function expected: dispose");
        weakAsyncDisposableState.set(this, "pending-one");
        weakAsyncDisposableResourceStack.set(this, [{ hint: "async", resource: null, dispose }]);
    }

    /* @internal */
    async [asyncDisposeSym]() {
        if (!weakAsyncDisposableState.has(this) || !weakAsyncDisposableResourceStack.has(this)) throw new TypeError("Wrong target");
        const state = weakAsyncDisposableState.get(this);
        if (state === "disposed") return;
        weakAsyncDisposableState.set(this, "disposed");
        await DisposeResources("async", weakAsyncDisposableResourceStack.get(this), state === "pending-one", /*completion*/ undefined);
    }

    /**
     * Creates an `AsyncDisposable` wrapper around a set of other disposables.
     * @param resources An `Iterable` of `AsyncDisposable` or `Disposable` objects.
     */
    static async from(resources: AsyncIterable<AsyncDisposable | Disposable | (() => void | PromiseLike<void>) | null | undefined> | Iterable<AsyncDisposable | Disposable | (() => void | PromiseLike<void>) | null | undefined | PromiseLike<AsyncDisposable | Disposable | (() => void | PromiseLike<void>) | null | undefined>>) {
        const disposableResourceStack: DisposableResourceRecord<"async">[] = [];
        const errors: unknown[] = [];

        let throwCompletion: ThrowCompletion | undefined;
        try {
            for await (const resource of resources) {
                try {
                    AddDisposableResource(disposableResourceStack, resource, "async");
                }
                catch (e) {
                    errors.push(e);
                }
            }
        }
        catch (e) {
            throwCompletion = { cause: e };
        }
        finally {
            if (errors.length || throwCompletion) {
                await DisposeResources("async", disposableResourceStack, /*suppress*/ false, throwCompletion, errors);
            }
        }

        const disposable: AsyncDisposable = Object.create(AsyncDisposable.prototype);
        weakAsyncDisposableState.set(disposable, "pending");
        weakAsyncDisposableResourceStack.set(disposable, disposableResourceStack);
        return disposable;
    }

    /**
     * Emulate `using await const` using `for..await..of`.
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
    static async * scope(): AsyncGenerator<AsyncDisposableScope, void, undefined> {
        const context = CreateScope("async");
        try {
            context.state = "initialized";
            yield context.scope;
            context.state = "exiting";
        }
        finally {
            context.state = "done";
            await DisposeResources("async", context.disposables, /*suppress*/ false, context.throwCompletion);
        }
    }

    /**
     * Yields each disposable in the iterable, disposing it when the generator resumes.
     *
     * This emulates `for (using await const x of expr)`.
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
    static async * usingEach(iterable: AsyncIterable<AsyncDisposable | Disposable | (() => void | PromiseLike<void>) | null | undefined> | Iterable<AsyncDisposable | Disposable | (() => void | PromiseLike<void>) | null | undefined | PromiseLike<AsyncDisposable | Disposable | (() => void | PromiseLike<void>) | null | undefined>>) {
        for await (const disposable of iterable) {
            for await (const { using, fail } of AsyncDisposable.scope()) try {
                yield using(disposable);
            } catch (e) { fail(e); }
        }
    }

    /**
     * Executes a callback with the provided `AsyncDisposable` resource, disposing the resource when the callback completes asynchronously.
     */
    static async  use<T extends AsyncDisposable | Disposable | (() => void | PromiseLike<void>) | null | undefined, U>(resource: T, callback: (resource: T) => U | PromiseLike<U>) {
        const disposableResourceStack: DisposableResourceRecord<"async">[] = [];
        AddDisposableResource(disposableResourceStack, resource, "async");

        let throwCompletion: ThrowCompletion | undefined;
        try {
            return await callback(resource);
        }
        catch (e) {
            throwCompletion = { cause: e };
        }
        finally {
            await DisposeResources("async", disposableResourceStack, /*suppress*/ false, throwCompletion);
        }
    }

    /**
     * Determines whether a value is `AsyncDisposable`.
     */
    static hasInstance(value: unknown): value is AsyncDisposable {
        return typeof value === "object"
            && value !== null
            && asyncDisposeSym in value;
    }

    /**
     * Determines whether a value is `AsyncDisposable`.
     */
    static [Symbol.hasInstance](value: unknown): value is AsyncDisposable {
        return AsyncDisposable.hasInstance(value);
    }
}

Object.defineProperty(AsyncDisposable.prototype, Symbol.toStringTag, { configurable: true, value: "AsyncDisposable" });

export namespace AsyncDisposable {
    /**
     * Creates an `AsyncDisposable` wrapper around a callback used to dispose resources.
     * @deprecated Use `new AsyncDisposable(dispose)` instead.
     */
    export function create(dispose: () => void | PromiseLike<void>): AsyncDisposable {
        reportAsyncDisposableCreateDeprecation();
        return new AsyncDisposable(dispose);
    }
}

export interface AsyncDisposableScope {
    /**
     * Tracks a resource to be disposed at the end of a `for..of` statement. See {@link AsyncDisposable.scope}.
     */
    using<T extends AsyncDisposable | Disposable | (() => void | PromiseLike<void>) | null | undefined>(value: T): T;

    /**
     * Tracks an exception from the body of a `for..of` statement. See {@link AsyncDisposable.scope}.
     */
    fail(error: unknown): void;
}
