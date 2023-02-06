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

import /*#__INLINE__*/ { isFunction, isObject } from "@esfx/internal-guards";
import { AsyncDisposable } from "./asyncDisposable.js";
import { Disposable } from "./disposable.js";
import { AddDisposableResource, DisposeCapability, DisposeMethod, DisposeResources, GetDisposeMethod, NewDisposeCapability } from "./internal/utils.js";

const weakAsyncDisposableState = new WeakMap<AsyncDisposable, "pending" | "disposed">();
const weakDisposeCapability = new WeakMap<AsyncDisposable, DisposeCapability<"async-dispose">>();

/** @deprecated Use {@link AsyncDisposable|`AsyncDisposable | Disposable`} instead. */
export type AsyncDisposableLike = AsyncDisposable | Disposable | (() => void | PromiseLike<void>);

/**
 * A container for asynchronously disposable resources. When the stack is disposed, its containing resources are disposed in the reverse
 * of the order in which they were added.
 */
export class AsyncDisposableStack implements AsyncDisposable {
    constructor() {
        // 11.4.1.1 AsyncDisposableStack ()

        // 1. If NewTarget is *undefined*, throw a *TypeError* exception.
        // 2. Let _asyncDisposableStack_ be ? OrdinaryCreateFromConstructor(NewTarget, *"%AsyncDisposableStack.prototype%"*, « [[AsyncDisposableState]], [[DisposeCapability]] »).

        // 3. Set _asyncDisposableStack_.[[AsyncDisposableState]] to ~pending~.
        weakAsyncDisposableState.set(this, "pending");

        // 4. Set _asyncDisposableStack_.[[DisposeCapability]] to NewDisposeCapability().
        weakDisposeCapability.set(this, NewDisposeCapability());

        // 5. Return _asyncDisposableStack_.
    }

    /**
     * Gets a value indicating whether the stack has already been disposed.
     */
    get disposed() {
        // 11.4.3.1 get AsyncDisposableStack.prototype.disposed

        // 1. Let _asyncDisposableStack_ be the *this* value.

        // 2. Perform ? RequireInternalSlot(_asyncDisposableStack_, [[AsyncDisposableState]]).
        if (!weakAsyncDisposableState.has(this)) throw new TypeError("Wrong target");

        // 3. If _asyncDisposableStack_.[[AsyncDisposableState]] is ~disposed~, return *true*.
        if (weakAsyncDisposableState.get(this) === "disposed") return true;

        // 4. Otherwise, return *false*.
        return false;
    }

    /**
     * Dispose this object's resources. This method is an alias for `[Disposable.dispose]()`.
     *
     * ```ts
     * const stack = new AsyncDisposableStack();
     * for (const f of files) stack.use(openFile(f));
     * ...
     * await stack.disposeAsync();
     * ```
     */
    async disposeAsync() {
        // 11.4.3.2 AsyncDisposableStack.prototype.disposeAsync()

        // 1. Let _asyncDisposableStack_ be the *this* value.
        // 2. Let _promiseCapability_ be ! NewPromiseCapability(%Promise%).

        // 3. If _asyncDisposableStack_ does not have an [[AsyncDisposableState]] internal slot, then
        //   a. Perform ! Call(_promiseCapability_.[[Reject]], *undefined*, « a newly created *TypeError* object »).
        //   b. Return _promiseCapability_.[[Promise]].
        const disposableState = weakAsyncDisposableState.get(this);
        if (!disposableState) throw new TypeError("Wrong target");

        // 4. If _asyncDisposableStack_.[[AsyncDisposableState]] is ~disposed~, then
        //   a. Perform ! Call(_promiseCapability_.[[Resolve]], *undefined*, « *undefined* »).
        //   b. Return _promiseCapability_.[[Promise]].
        if (disposableState === "disposed") return;

        // 5. Set _asyncDisposableStack_.[[AsyncDisposableState]] to ~disposed~.
        weakAsyncDisposableState.set(this, "disposed");

        // 6. Let _result_ be DisposeResources(_asyncDisposableStack_, NormalCompletion(*undefined*)).
        // 7. IfAbruptRejectPromise(_result_, _promiseCapability_).
        // 8. Perform ! Call(_promiseCapability_.[[Resolve]], *undefined*, « _result_ »).
        // 9. Return _promiseCapability_.[[Promise]].
        const disposeCapability = weakDisposeCapability.get(this)!;
        weakDisposeCapability.delete(this);
        await DisposeResources("async-dispose", disposeCapability, /*completion*/ undefined);
    }

    /**
     * Pushes a new disposable resource onto the disposable stack stack. Resources are disposed in the reverse order they were entered.
     * @param value The resource to add.
     * @returns The resource provided.
     */
    use<T extends AsyncDisposable | Disposable | null | undefined>(value: T): T;
    /** @deprecated Use {@link defer|defer()} instead. */
    use<T extends () => void | PromiseLike<void>>(value: T): T;
    /** @deprecated Use {@link adopt|adopt()} instead. */
    use<T>(value: T, onDisposeAsync: (value: T) => void | PromiseLike<void>): T;
    use<T>(value: T, onDisposeAsync: ((value: T) => void | PromiseLike<void>) | undefined = undefined): T {
        // 11.4.3.3 AsyncDisposableStack.prototype.use( _value_ )

        // 1. Let _asyncDisposableStack_ be the *this* value.

        // 2. Perform ? RequireInternalSlot(_asyncDisposableStack_, [[AsyncDisposableState]]).
        const disposableState = weakAsyncDisposableState.get(this);
        if (!disposableState) throw new ReferenceError("Wrong target");

        // 3. If _asyncDisposableStack_.[[AsyncDisposableState]] is ~disposed~, throw a *ReferenceError* exception.
        if (disposableState === "disposed") throw new ReferenceError("Object is disposed");

        // NOTE: 1.0.0 compatibility:
        if (onDisposeAsync !== undefined) {
            return this.adopt(value, onDisposeAsync);
        }

        // NOTE: 1.0.0 compatibility:
        if (value !== null && value !== undefined && typeof value === "function" && !(AsyncDisposable.asyncDispose in value) && !(Disposable.dispose in value)) {
            this.defer(value as unknown as DisposeMethod<"async-dispose">);
            return value;
        }

        // 4. Perform ? AddDisposableResource(_asyncDisposableStack_.[[DisposeCapability]], _value_, ~async-dispose~).
        AddDisposableResource(weakDisposeCapability.get(this)!, value, "async-dispose");

        // 5. Return _value_.
        return value;
    }

    /**
     * Pushes a non-disposable resource onto the stack with the provided async disposal callback.
     * @param value The resource to add.
     * @param onDisposeAsync The callback to execute when the resource is disposed.
     * @returns The resource provided.
     */
    adopt<T>(value: T, onDisposeAsync: (value: T) => void | PromiseLike<void>): T {
        // 11.4.3.4 AsyncDisposableStack.prototype.adopt( _value_, _onDisposeAsync_ )

        // 1. Let _asyncDisposableStack_ be the *this* value.

        // 2. Perform ? RequireInternalSlot(_asyncDisposableStack_, [[AsyncDisposableState]]).
        const disposableState = weakAsyncDisposableState.get(this);
        if (!disposableState) throw new ReferenceError("Wrong target");

        // 3. If _asyncDisposableStack_.[[AsyncDisposableState]] is ~disposed~, throw a *ReferenceError* exception.
        if (disposableState === "disposed") throw new ReferenceError("Object is disposed");

        // 4. If IsCallable(_onDisposeAsync_) is *false*, throw a *TypeError* exception.
        if (!isFunction(onDisposeAsync)) throw new TypeError("Function expected: onDisposeAsync");

        // 5. Let _closure_ be a Abstract Closure with no parameters that captures _value_ and _onDisposeAsync_ and performs the following steps when called:
        //    1. Return ? Call(_onDisposeAsync_, *undefined*, « _value_ »).
        // 6. Let _F_ be CreateBuiltinFunction(_closure_, 0, *""*, , « »).
        const F = () => onDisposeAsync(value);

        // 7. Perform ? AddDisposableResource(_asyncDisposableStack_.[[DisposeCapability]], *undefined*, ~async-dispose~, _F_).
        AddDisposableResource(weakDisposeCapability.get(this)!, undefined, "async-dispose", F);

        // 8. Return _value_.
        return value;
    }

    /**
     * Pushes a resourceless async disposal callback onto the stack.
     * @param onDisposeAsync The callback to execute when the stack is disposed.
     */
    defer(onDisposeAsync: () => void | PromiseLike<void>) {
        // 11.4.3.5 AsyncDisposableStack.prototype.defer( _onDisposeAsync_ )

        // 1. Let _asyncDisposableStack_ be the *this* value.

        // 2. Perform ? RequireInternalSlot(_asyncDisposableStack_, [[AsyncDisposableState]]).
        const disposableState = weakAsyncDisposableState.get(this);
        if (!disposableState) throw new ReferenceError("Wrong target");

        // 3. If _asyncDisposableStack_.[[AsyncDisposableState]] is ~disposed~, throw a *ReferenceError* exception.
        if (disposableState === "disposed") throw new ReferenceError("Object is disposed");

        // 4. If IsCallable(_onDisposeAsync_) is *false*, throw a *TypeError* exception.
        if (!isFunction(onDisposeAsync)) throw new TypeError("Function expected: onDisposeAsync");

        // 5. Perform ? AddDisposableResource(_asyncDisposableStack_.[[DisposeCapability]], *undefined*, ~async-dispose~, _onDisposeAsync_).
        AddDisposableResource(weakDisposeCapability.get(this)!, undefined, "async-dispose", onDisposeAsync);

        // 6. Return *undefined*.
    }

    /**
     * Moves all resources out of this `AsyncDisposableStack` and into a new `AsyncDisposableStack` and returns it.
     */
    move(): AsyncDisposableStack {
        // 11.4.3.6 AsyncDisposableStack.prototype.move()

        // 1. Let _asyncDisposableStack_ be the *this* value.

        // 2. Perform ? RequireInternalSlot(_asyncDisposableStack_, [[AsyncDisposableState]]).
        const disposableState = weakAsyncDisposableState.get(this);
        if (!disposableState) throw new ReferenceError("Wrong target");

        // 3. If _asyncDisposableStack_.[[AsyncDisposableState]] is ~disposed~, throw a *ReferenceError* exception.
        if (disposableState === "disposed") throw new ReferenceError("Object is disposed");

        // 4. Let _newAsyncDisposableStack_ be ? OrdinaryCreateFromConstructor(%AsyncDisposableStack%, "%AsyncDisposableStack.prototype%", « [[AsyncDisposableState]], [[DisposeCapability]] »).
        // 5. Set _newAsyncDisposableStack_.[[AsyncDisposableState]] to ~pending~.
        const newAsyncDisposableStack = new AsyncDisposableStack();

        // 6. Set _newAsyncDisposableStack_.[[DisposeCapability]] to _asyncDisposableStack_.[[DisposeCapability]].
        weakDisposeCapability.set(newAsyncDisposableStack, weakDisposeCapability.get(this)!);

        // 7. Set _asyncDisposableStack_.[[DisposeCapability]] to NewDisposeCapability().
        weakDisposeCapability.set(this, NewDisposeCapability());

        // 8. Set _asyncDisposableStack_.[[AsyncDisposableState]] to ~disposed~.
        weakAsyncDisposableState.set(this, "disposed");

        // 11. Return _newAsyncDisposableStack_.
        return newAsyncDisposableStack;
    }

    /**
     * Dispose this object's resources.
     */
    [AsyncDisposable.asyncDispose]() { return this.disposeAsync(); }
    static {
        // 11.4.3.7 AsyncDisposableStack.prototype [ @@asyncDispose ] ()

        // The initial value of the @@asyncDispose property is %AsyncDisposableStack.prototype.disposeAsync%, defined in 11.4.3.2.
        this.prototype[AsyncDisposable.asyncDispose] = this.prototype.disposeAsync;
    }

    declare [Symbol.toStringTag]: string;
    static {
        // 11.4.3.8 AsyncDisposableStack.prototype [ @@toStringTag ]

        // The initial value of the @@toStringTag property is the String value "AsyncDisposableStack".

        // This property has the attributes { [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]: true }.
        Object.defineProperty(this, Symbol.toStringTag, { configurable: true, value: "AsyncDisposableStack" });
    }
}
