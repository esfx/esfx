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

import { AsyncDisposable, AsyncDisposableLike, __AsyncDisposable_prototype__ } from "./asyncDisposable";
import { weakAsyncDisposableResourceStack, weakAsyncDisposableState } from "./internal/asyncDisposable";
import { AddDisposableResource, createDeprecation, DisposableResourceRecord, DisposeResources, ThrowCompletion } from "./internal/utils";

const weakAsyncDisposable = new WeakMap<AsyncDisposableStack, AsyncDisposable>();
const reportAsyncDisposableStackEnterDeprecation = createDeprecation("Use 'AsyncDisposableStack.use()' instead.");

/**
 * Emulates Python's `AsyncExitStack`
 */
export class AsyncDisposableStack implements AsyncDisposable {
    declare [Symbol.toStringTag]: string;

    constructor() {
        const disposable = Object.create(AsyncDisposable.prototype) as AsyncDisposable;
        weakAsyncDisposableState.set(disposable, "pending");
        weakAsyncDisposableResourceStack.set(disposable, []);
        weakAsyncDisposable.set(this, disposable);
    }

    /**
     * Creates an `AsyncDisposableStack` from an iterable of other disposables.
     * @param disposables An `Iterable` of `AsyncDisposable` or `Disposable` objects.
     */
    static async from(disposables: AsyncIterable<AsyncDisposableLike | null | undefined> | Iterable<AsyncDisposableLike | null | undefined | PromiseLike<AsyncDisposableLike | null | undefined>>) {
        const disposableResourceStack: DisposableResourceRecord<"async">[] = [];
        const errors: unknown[] = [];

        let throwCompletion: ThrowCompletion | undefined;
        try {
            for await (const resource of disposables) {
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

        const disposable: AsyncDisposable = Object.create(__AsyncDisposable_prototype__);
        weakAsyncDisposableState.set(disposable, "pending");
        weakAsyncDisposableResourceStack.set(disposable, disposableResourceStack);

        const disposableStack: AsyncDisposableStack = Object.create(__AsyncDisposableStack_prototype__);
        weakAsyncDisposable.set(disposableStack, disposable);
        return disposableStack;

    }

    /**
     * Pushes a new disposable resource onto the disposable stack stack. Resources are disposed in the reverse order they were entered.
     * @param value The resource to add.
     * @returns The resource provided.
     */
    use<T extends AsyncDisposableLike | null | undefined>(value: T): T;
    /**
     * Pushes a new disposable resource onto the disposable stack stack. Resources are disposed in the reverse order they were entered.
     * @param value The resource to add.
     * @param onDispose The operation to perform when the resource is disposed.
     * @returns The resource provided.
     */
    use<T>(value: T, onDispose: (value: T) => void | PromiseLike<void>): T;
    use<T>(value: T, onDispose: ((value: T) => void | PromiseLike<void>) | undefined = undefined): T {
        const disposable = weakAsyncDisposable.get(this);
        if (!disposable) throw new TypeError("Wrong target");

        const disposableState = weakAsyncDisposableState.get(disposable);
        if (disposableState === "disposed") throw new ReferenceError("Object is disposed");
        if (disposableState !== "pending") throw new ReferenceError("Wrong target");

        if (value !== null && value !== undefined || onDispose) {
            const disposableResourceStack = weakAsyncDisposableResourceStack.get(disposable)!;
            AddDisposableResource(disposableResourceStack, onDispose ? () => onDispose(value!) : value, "async");
        }

        return value;
    }

    /**
     * Pushes a new disposable resource onto the disposable stack stack. Resources are disposed in the reverse order they were entered.
     * @param value The resource to add.
     * @returns The resource provided.
     * @deprecated Use {@link use `AsyncDisposableStack.use`} instead.
     */
    enter<T extends AsyncDisposableLike | null | undefined>(value: T): T;
    /**
     * Pushes a new disposable resource onto the disposable stack stack. Resources are disposed in the reverse order they were entered.
     * @param value The resource to add.
     * @param onDispose The operation to perform when the resource is disposed.
     * @returns The resource provided.
     * @deprecated Use {@link use `AsyncDisposableStack.use`} instead.
     */
    enter<T>(value: T, onDispose: (value: T) => void | PromiseLike<void>): T;
    enter<T>(value: T, onDispose: ((value: T) => void | PromiseLike<void>) | undefined = undefined): T {
        reportAsyncDisposableStackEnterDeprecation();
        return this.use(value, onDispose!);
    }

    /**
     * Moves all resources out of this `AsyncDisposableStack` and into a new `AsyncDisposableStack` and returns it.
     */
    move(): AsyncDisposableStack {
        const disposable = weakAsyncDisposable.get(this);
        if (!disposable) throw new TypeError("Wrong target");

        const disposableState = weakAsyncDisposableState.get(disposable);
        if (disposableState === "disposed") throw new ReferenceError("Object is disposed");
        if (disposableState !== "pending") throw new ReferenceError("Wrong target");

        const disposableResourceStack = weakAsyncDisposableResourceStack.get(disposable)!;

        const newDisposable = Object.create(AsyncDisposable.prototype) as AsyncDisposable;
        weakAsyncDisposableState.set(newDisposable, "pending");
        weakAsyncDisposableResourceStack.set(newDisposable, disposableResourceStack);
        weakAsyncDisposableResourceStack.set(disposable, []);

        const newDisposableStack = Object.create(__AsyncDisposableStack_prototype__) as AsyncDisposableStack;
        weakAsyncDisposable.set(newDisposableStack, newDisposable);
        return newDisposableStack;
    }

    /**
     * Dispose this object's resources.
     */
    async disposeAsync() {
        const disposable = weakAsyncDisposable.get(this)!;
        if (!disposable) throw new TypeError("Wrong target");

        const disposableState = weakAsyncDisposableState.get(disposable)!;
        if (disposableState === "disposed") return;
        if (disposableState !== "pending") throw new ReferenceError("Wrong target");
        weakAsyncDisposableState.set(disposable, "disposed");

        await DisposeResources("async", weakAsyncDisposableResourceStack.get(disposable), /*suppress*/ false, /*completion*/ undefined);
    }

    /**
     * Dispose this object's resources.
     */
    [AsyncDisposable.asyncDispose]() {
        return this.disposeAsync();
    }
}

const __AsyncDisposableStack_prototype__ = AsyncDisposableStack.prototype;

Object.defineProperty(__AsyncDisposableStack_prototype__, Symbol.toStringTag, { configurable: true, value: "AsyncDisposableStack" });
Object.defineProperty(__AsyncDisposableStack_prototype__, AsyncDisposable.asyncDispose, Object.getOwnPropertyDescriptor(__AsyncDisposableStack_prototype__, "disposeAsync")!);
