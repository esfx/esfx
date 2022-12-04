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
import { AddDisposableResource, DisposableResourceRecord, DisposeMethod, DisposeResources, GetDisposeMethod, GetMethod, SpeciesConstructor } from "./internal/utils.js";

const weakAsyncDisposableState = new WeakMap<AsyncDisposable, "pending" | "disposed">();
const weakAsyncDisposableResourceStack = new WeakMap<AsyncDisposable, DisposableResourceRecord<"async">[]>();

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
        // 2. Let _asyncDisposableStack_ be ? OrdinaryCreateFromConstructor(NewTarget, *"%AsyncDisposableStack.prototype%"*, « [[AsyncDisposableState]], [[DisposableResourceStack]], [[BoundDisposeAsync]] »).

        // 3. Set _asyncDisposableStack_.[[AsyncDisposableState]] to ~pending~.
        weakAsyncDisposableState.set(this, "pending");

        // 4. Set _asyncDisposableStack_.[[DisposableResourceStack]] to a new empty List.
        weakAsyncDisposableResourceStack.set(this, []);

        // 5. Return _asyncDisposableStack_.
    }

    /**
     * Gets a value indicating whether the stack has already been disposed.
     */
    get disposed() {
        // 11.4.3.1 get AsyncDisposableStack.prototype.disposed

        // 1. Let _disposableStack_ be the *this* value.

        // 2. Perform ? RequireInternalSlot(_disposableStack_, [[AsyncDisposableState]]).
        if (!weakAsyncDisposableState.has(this)) throw new TypeError("Wrong target");

        // 3. If _disposableStack_.[[AsyncDisposableState]] is ~disposed~, return *true*.
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
        const asyncDisposableResourceStack = weakAsyncDisposableResourceStack.get(this)!;
        await DisposeResources("async", asyncDisposableResourceStack.splice(0, asyncDisposableResourceStack.length), /*completion*/ undefined);
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

        // 4. If _value_ is neither *null* nor *undefined*, then
        if (value !== null && value !== undefined) {
            // a. If Type(_value_) is not Object, throw a *TypeError* exception.
            if (!isObject(value)) throw new TypeError("Object expected: value");

            // b. Let _method_ be GetDisposeMethod(_value_, ~async~).
            const method = GetDisposeMethod(value, "async");

            // c. If _method_ is *undefined*, then
            if (method === undefined) {
                // NOTE: 1.0.0 compatibility
                if (isFunction(value)) {
                    this.defer(value as DisposeMethod<"async">);
                    return value;
                }

                // i. Throw a *TypeError* exception.
                throw new TypeError("Object is not disposable");
            }

            // d. Else,
            else {
                // i. Perform ? AddDisposableResource(_disposableStack_, _value_, ~async~, _method_).
                AddDisposableResource(weakAsyncDisposableResourceStack.get(this)!, value, "async", method);
            }
        }

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

        // 5. Let _F_ be a new built-in function object as defined in 11.4.3.4.1.
        // 6. Set _F_.[[Argument]] to _value_.
        // 7. Set _F_.[[OnDisposeAsyncCallback]] to _onDisposeAsync_.
        const F = () => {
            // 11.4.3.4.1 AsyncDisposableStack Adopt Callback Functions

            // 1. Let F be the active function object.
            // 2. Assert: IsCallable(F.[[OnDisposeAsyncCallback]]) is true.
            // 3. Return Call(F.[[OnDisposeAsyncCallback]], undefined, « F.[[Argument]] »).
            return onDisposeAsync(value);
        };

        // 8. Perform ? AddDisposableResource(_asyncDisposableStack_, *undefined*, ~async~, _F_).
        AddDisposableResource(weakAsyncDisposableResourceStack.get(this)!, undefined, "async", F);

        // 9. Return _value_.
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

        // 5. Perform ? AddDisposableResource(_disposableStack_, *undefined*, ~async~, _onDisposeAsync_).
        AddDisposableResource(weakAsyncDisposableResourceStack.get(this)!, undefined, "async", onDisposeAsync);

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

        // 4. Let _newAsyncDisposableStack_ be ? OrdinaryCreateFromConstructor(%AsyncDisposableStack%, "%AsyncDisposableStack.prototype%", « [[AsyncDisposableState]], [[DisposableResourceStack]] »).
        // 5. Set _newAsyncDisposableStack_.[[DisposableState]] to ~pending~.
        const newAsyncDisposableStack = new AsyncDisposableStack();

        // 6. Set _newAsyncDisposableStack_.[[DisposableResourceStack]] to _asyncDisposableStack_.[[DisposableResourceStack]].
        weakAsyncDisposableResourceStack.set(newAsyncDisposableStack, weakAsyncDisposableResourceStack.get(this)!);

        // 7. Set _asyncDisposableStack_.[[DisposableResourceStack]] to a new empty List.
        weakAsyncDisposableResourceStack.set(this, []);

        // 8. Set _asyncDisposableStack_.[[DisposableState]] to ~disposed~.
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
