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

import { weakDisposableResourceStack, weakDisposableState } from "./internal/disposable";
import { AddDisposableResource, disposeSym, createDeprecation, CreateScope, DisposableResourceRecord, DisposeResources, ThrowCompletion } from "./internal/utils";

const reportDisposableCreateDeprecation = createDeprecation("Use 'new Disposable(dispose)' instead.");
const reportDisposableUseDeprecation = createDeprecation("Use 'Disposable.scope()' instead.");

/**
 * Indicates an object that has resources that can be explicitly disposed.
 */
export interface Disposable {
    /**
     * Dispose this object's resources.
     */
    [Disposable.dispose](): void;
}

export type DisposableLike =
    | Disposable
    | (() => void)
    ;

/**
 * Indicates an object that has resources that can be explicitly disposed.
 *
 * NOTE: It is not necessary to subclass `Disposable`. Merely having a `[Disposable.dispose]()` method is sufficient.
 */
export class Disposable {
    /**
     * A well-known symbol used to define an explicit resource disposal method on an object.
     *
     * Uses `Symbol.dispose` if present.
     */
    static readonly dispose: unique symbol = disposeSym;

    /**
     * Creates a `Disposable` wrapper around a callback used to dispose of a resource.
     */
    constructor(onDispose: () => void) {
        if (typeof onDispose !== "function") throw new TypeError("Function expected: dispose");
        weakDisposableState.set(this, "pending-one");
        weakDisposableResourceStack.set(this, [{ hint: "sync", resource: null, dispose: onDispose }]);
    }

    /* @internal */
    [disposeSym]() {
        const disposableState = weakDisposableState.get(this);
        if (disposableState === "disposed") return;
        if (disposableState !== "pending" && disposableState !== "pending-one") throw new TypeError("Wrong target");
        weakDisposableState.set(this, "disposed");

        DisposeResources("sync", weakDisposableResourceStack.get(this), disposableState === "pending-one", /*completion*/ undefined);
    }

    /**
     * Creates a `Disposable` wrapper around a set of other disposables.
     * @param disposables An `Iterable` of `Disposable` objects.
     * @deprecated Use `DisposableStack.from()` instead.
     */
    static from(disposables: Iterable<DisposableLike | null | undefined>) {
        const disposableResourceStack: DisposableResourceRecord<"sync">[] = [];
        const errors: unknown[] = [];

        let throwCompletion: ThrowCompletion | undefined;
        try {
            for (const resource of disposables) {
                try {
                    AddDisposableResource(disposableResourceStack, resource, "sync");
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
                DisposeResources("sync", disposableResourceStack, /*suppress*/ false, throwCompletion, errors);
            }
        }

        const disposable: Disposable = Object.create(__Disposable_prototype__);
        weakDisposableState.set(disposable, "pending");
        weakDisposableResourceStack.set(disposable, disposableResourceStack);
        return disposable;
    }

    /**
     * Emulate `using const` using `for..of`.
     *
     * @example
     * ```ts
     * // with `using const` (proposed)
     * {
     *   ...
     *   using const x = expr, y = expr;
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
    static * scope(): Generator<DisposableScope, void, undefined> {
        const context = CreateScope("sync");
        try {
            context.state = "initialized";
            yield context.scope;
            context.state = "exiting";
        }
        finally {
            context.state = "done";
            DisposeResources("sync", context.disposables, /*suppress*/ false, context.throwCompletion);
        }
    }

    /**
     * Yields each disposable in the iterable, disposing it when the generator resumes.
     *
     * This emulates `for (using const x of expr)`.
     *
     * @example
     * ```ts
     * // with `using const` (proposed)
     * for (using const x of expr) {
     *   ...
     * }
     *
     * // with `Disposable.usingEach()`:
     * for (const x of Disposable.usingEach(expr)) {
     *   ...
     * }
     * ```
     */
    static * usingEach(disposables: Iterable<Disposable | (() => void) | null | undefined>) {
        // for (using const disposable of disposables) yield disposable;
        for (const disposable of disposables) {
            for (const { using, fail } of Disposable.scope()) try {
                yield using(disposable);
            } catch (e) { fail(e); }
        }
    }

    /**
     * Executes a callback with the provided `Disposable` resource, disposing the resource when the callback completes.
     * @deprecated Use `Disposable.scope()` instead.
     */
    static use<T extends Disposable | (() => void) | null | undefined, U>(resource: T, callback: (resource: T) => U) {
        reportDisposableUseDeprecation();
        // using const x = resource;
        // return callback(x);
        for (const { using, fail } of Disposable.scope()) {
            try {
                return callback(using(resource));
            }
            catch (e) {
                fail(e);
            }
        }
    }

    /**
     * Determines whether a value is Disposable.
     */
    static hasInstance(value: unknown): value is Disposable {
        return typeof value === "object"
            && value != null
            && disposeSym in value;
    }

    /**
     * Determines whether a value is `Disposable`.
     */
    static [Symbol.hasInstance](value: unknown): value is Disposable {
        return Disposable.hasInstance(value);
    }
}

/* @internal */
export const __Disposable_prototype__ = Disposable.prototype;

Object.defineProperty(__Disposable_prototype__, Symbol.toStringTag, { configurable: true, value: "Disposable" });
Object.defineProperty(Disposable, Symbol.hasInstance, Object.getOwnPropertyDescriptor(Disposable, "hasInstance")!);

export namespace Disposable {
    /**
     * Creates a `Disposable` wrapper around a callback used to dispose of a resource.
     * @deprecated Use `new Disposable(dispose)` instead.
     */
    export function create(dispose: () => void): Disposable {
        reportDisposableCreateDeprecation();
        return new Disposable(dispose);
    }
}

/**
 * Used to aproximate `using const` via `for..of`. See {@link Disposable.scope}.
 */
export interface DisposableScope {
    /**
     * Tracks a resource to be disposed at the end of a `for..of` statement. See {@link Disposable.scope}.
     */
    using<T extends Disposable | (() => void) | null | undefined>(value: T): T;

    /**
     * Tracks an exception from the body of a `for..of` statement. See {@link Disposable.scope}.
     */
    fail(error: unknown): void;
}
