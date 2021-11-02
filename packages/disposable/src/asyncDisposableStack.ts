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

import { AsyncDisposable } from "./asyncDisposable";
import { Disposable } from "./disposable";
import { weakAsyncDisposableResourceStack, weakAsyncDisposableState } from "./internal/asyncDisposable";
import { AddDisposableResource } from "./internal/utils";

const weakAsyncDisposable = new WeakMap<AsyncDisposableStack, AsyncDisposable>();

/**
 * Emulates Python's `AsyncExitStack`
 */
export class AsyncDisposableStack implements AsyncDisposable {
    declare [Symbol.toStringTag]: string;

    constructor() {
        const disposable = Object.create(AsyncDisposable.prototype) as AsyncDisposable;
        weakAsyncDisposableState.set(disposable, "pending-stack");
        weakAsyncDisposableResourceStack.set(disposable, []);
        weakAsyncDisposable.set(this, disposable);
    }

    /**
     * Pushes a new disposable resource onto the disposable stack stack. Resources are disposed in the reverse order they were entered.
     * @param value The resource to add.
     * @returns The resource provided.
     */
    enter<T extends AsyncDisposable | Disposable | (() => void | PromiseLike<void>) | null | undefined>(value: T): T;
    /**
     * Pushes a new disposable resource onto the disposable stack stack. Resources are disposed in the reverse order they were entered.
     * @param value The resource to add.
     * @param onDispose The operation to perform when the resource is disposed. Not invoked if `value` is `null` or `undefined`.
     * @returns The resource provided.
     */
    enter<T>(value: T, onDispose: (value: NonNullable<T>) => void | PromiseLike<void>): T;
    enter<T>(value: T, onDispose: ((value: NonNullable<T>) => void | PromiseLike<void>) | undefined = undefined): T {
        if (!weakAsyncDisposable.has(this)) throw new TypeError("Wrong target");
        const disposable = weakAsyncDisposable.get(this)!;
        const state = weakAsyncDisposableState.get(disposable)!;
        const stack = weakAsyncDisposableResourceStack.get(disposable)!;
        if (state === "disposed") throw new ReferenceError("Object is disposed");
        if (state !== "pending-stack") throw new ReferenceError("Wrong target");
        if (value !== null && value !== undefined) {
            AddDisposableResource(stack, onDispose ? () => onDispose(value!) : value, "async");
        }
        return value;
    }

    /**
     * Moves all resources out of this `DisposableStack` and into a new `DisposableStack` and returns it.
     */
    move(): AsyncDisposableStack {
        if (!weakAsyncDisposable.has(this)) throw new TypeError("Wrong target");
        const disposable = weakAsyncDisposable.get(this)!;
        const state = weakAsyncDisposableState.get(disposable)!;
        const stack = weakAsyncDisposableResourceStack.get(disposable)!;
        if (state === "disposed") throw new ReferenceError("Object is disposed");
        if (state !== "pending-stack") throw new ReferenceError("Wrong target");

        const newExitStack = Object.create(AsyncDisposableStack.prototype) as AsyncDisposableStack;
        const newDisposable = Object.create(AsyncDisposable.prototype) as AsyncDisposable;
        weakAsyncDisposableState.set(newDisposable, "pending-stack");
        weakAsyncDisposableResourceStack.set(newDisposable, stack.slice());
        weakAsyncDisposable.set(newExitStack, newDisposable);
        stack.length = 0;
        return newExitStack;
    }

    /**
     * Dispose this object's resources.
     */
    async disposeAsync() {
        if (!weakAsyncDisposable.has(this)) throw new TypeError("Wrong target");
        const disposable = weakAsyncDisposable.get(this)!;
        const state = weakAsyncDisposableState.get(disposable)!;
        if (state === "disposed") return;
        await disposable[AsyncDisposable.asyncDispose]();
    }

    /**
     * Dispose this object's resources.
     */
    async [AsyncDisposable.asyncDispose]() {
        await this.disposeAsync();
    }
}

Object.defineProperty(AsyncDisposableStack.prototype, Symbol.toStringTag, { configurable: true, value: "AsyncDisposableStack" });
Object.defineProperty(AsyncDisposableStack.prototype, AsyncDisposable.asyncDispose, Object.getOwnPropertyDescriptor(AsyncDisposableStack.prototype, "disposeAsync")!);
