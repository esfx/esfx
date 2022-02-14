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
import { AddDisposableResource, DisposableResourceRecord, DisposeMethod, DisposeResources, GetDisposeMethod, GetMethod, SpeciesConstructor } from "./internal/utils";

const weakAsyncDisposableState = new WeakMap<AsyncDisposable, "pending" | "disposed">();
const weakAsyncDisposableResourceStack = new WeakMap<AsyncDisposable, DisposableResourceRecord<"async">[]>();
const weakBoundDisposeAsync = new WeakMap<AsyncDisposableStack, (() => Promise<void>) | undefined>();

export type AsyncDisposableLike = AsyncDisposable | Disposable | (() => void | PromiseLike<void>);

/**
 * Emulates Python's `AsyncExitStack`
 */
export class AsyncDisposableStack implements AsyncDisposable {
    declare [Symbol.toStringTag]: string;

    static {
        Object.defineProperty(this, Symbol.toStringTag, { configurable: true, value: "AsyncDisposableStack" });
    }

    constructor() {
        // 9.4.4.1 AsyncDisposableStack ()

        // 1. If NewTarget is *undefined*, throw a *TypeError* exception.
        // 2. Let _asyncDisposableStack_ be ? OrdinaryCreateFromConstructor(NewTarget, *"%AsyncDisposableStack.prototype%"*, « [[AsyncDisposableState]], [[DisposableResourceStack]], [[BoundDisposeAsync]] »).

        // 3. Set _asyncDisposableStack_.[[AsyncDisposableState]] to ~pending~.
        weakAsyncDisposableState.set(this, "pending");

        // 4. Set _asyncDisposableStack_.[[DisposableResourceStack]] to a new empty List.
        weakAsyncDisposableResourceStack.set(this, []);

        // 5. Set _asyncDisposableStack_.[[BoundDisposeAsync]] to *undefined*.
        weakBoundDisposeAsync.set(this, undefined);

        // 6. Return _asyncDisposableStack_.
    }

    static get [Symbol.species]() {
        // 9.4.2.1 get AsyncDisposableStack [ @@species ]

        // 1. Return the *this* value.
        return this;
    }

    /**
     * Dispose this object's resources.
     *
     * NOTE: `disposeAsync` returns a bound method, so it can be extracted from `AsyncDisposableStack` and called independently:
     *
     * ```ts
     * const stack = new AsyncDisposableStack();
     * for (const f of files) stack.use(openFile(f));
     * const closeFiles = stack.disposeAsync;
     * ...
     * closeFiles();
     * ```
     */
    get disposeAsync() {
        // 9.4.3.1 get AsyncDisposableStack.prototype.disposeAsync

        // 1. Let _asyncDisposableStack_ be the *this* value.

        // 2. Perform ? RequireInternalSlot(_asyncDisposableStack_, [[AsyncDisposableState]]).
        if (!weakAsyncDisposableState.has(this)) throw new TypeError("Wrong target");

        // 3. If _asyncDisposableStack_.[[BoundDisposeAsync]] is *undefined*, then
        if (weakBoundDisposeAsync.get(this) === undefined) {
            // a. Let _disposeAsync_ be GetMethod(_asyncDisposableStack_, @@asyncDispose).
            const disposeAsync = GetMethod(this, AsyncDisposable.asyncDispose);

            // b. If _disposeAsync_ is *undefined*, throw a *TypeError* exception.
            if (disposeAsync === undefined) throw new TypeError(`Method not found: ${AsyncDisposable.asyncDispose.toString()}`);

            // c. Let _F_ be a new built-in function object as defined in 9.4.3.1.1.
            // d. Set _F_.[[AsyncDisposableStack]] to _asyncDisposableStack_.
            // e. Set _F_.[[DisposeAsyncMethod]] to _disposeAsync_.
            const F = disposeAsync.bind(this);

            // f. Set _asyncDisposableStack_.[[BoundDisposeAsync]] to _F_.
            weakBoundDisposeAsync.set(this, F);
        }

        // 4. Return _asyncDisposableStack_.[[BoundDisposeAsync]].
        return weakBoundDisposeAsync.get(this)!;
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
    use<T>(value: T, onDisposeAsync: (value: T) => void | PromiseLike<void>): T;
    use<T>(value: T, onDisposeAsync: ((value: T) => void | PromiseLike<void>) | undefined = undefined): T {
        // 9.4.3.2 AsyncDisposableStack.prototype.use( _value_ [, _onDisposeAsync_ ] )

        // 1. Let _asyncDisposableStack_ be the *this* value.

        // 2. Perform ? RequireInternalSlot(_asyncDisposableStack_, [[AsyncDisposableState]]).
        const disposableState = weakAsyncDisposableState.get(this);
        if (!disposableState) throw new ReferenceError("Wrong target");

        // 3. If _asyncDisposableStack_.[[AsyncDisposableState]] is ~disposed~, throw a *ReferenceError* exception.
        if (disposableState === "disposed") throw new ReferenceError("Object is disposed");

        // 4. If _onDisposeAsync_ is not *undefined*, then
        if (onDisposeAsync !== undefined) {
            // a. If IsCallable(_onDisposeAsync_) is *false*, throw a *TypeError* exception.
            if (typeof onDisposeAsync !== "function") throw new TypeError("Function expected: onDisposeAsync");

            // b. Let _F_ be a new built-in function object as defined in 9.4.3.2.1.
            // c. Set _F_.[[Argument]] to _value_.
            // d. Set _F_.[[OnDisposeAsyncCallback]] to _onDisposeAsync_.
            const F = () => onDisposeAsync(value);

            // e. Perform ? AddDisposableResource(_asyncDisposableStack_, *undefined*, ~async~, _F_).
            AddDisposableResource(weakAsyncDisposableResourceStack.get(this)!, undefined, "async", F);
        }

        // 5. Else, if value is neither null nor undefined, then
        else if (value !== null && value !== undefined) {
            // a. If Type(_value_) is not Object, throw a *TypeError* exception.
            if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected: value");

            // b. Let _method_ be GetDisposeMethod(_value_, ~async~).
            const method = GetDisposeMethod(value as T & object, "async");

            // c. If _method_ is *undefined*, then
            if (method === undefined) {
                // i. If IsCallable(_value_) is *true*, then
                if (typeof value === "function") {
                    // 1. Perform ? AddDisposableResource(_disposableStack_, *undefined*, ~async~, _value_).
                    AddDisposableResource(weakAsyncDisposableResourceStack.get(this)!, undefined, "async", value as T & DisposeMethod<"async">);
                }

                // ii. Else,
                else {
                    // 1. Throw a *TypeError* exception.
                    throw new TypeError("Function expected: value");
                }
            }

            // d. Else,
            else {
                // i. Perform ? AddDisposableResource(_disposableStack_, _value_, ~async~, _method_).
                AddDisposableResource(weakAsyncDisposableResourceStack.get(this)!, value, "async", method);
            }
        }

        // 6. Return _value_.
        return value;
    }

    /**
     * Moves all resources out of this `AsyncDisposableStack` and into a new `AsyncDisposableStack` and returns it.
     */
    move(): AsyncDisposableStack {
        // 9.4.3.3 AsyncDisposableStack.prototype.move()

        // 1. Let _asyncDisposableStack_ be the *this* value.

        // 2. Perform ? RequireInternalSlot(_asyncDisposableStack_, [[AsyncDisposableState]]).
        const disposableState = weakAsyncDisposableState.get(this);
        if (!disposableState) throw new ReferenceError("Wrong target");

        // 3. If _asyncDisposableStack_.[[AsyncDisposableState]] is ~disposed~, throw a *ReferenceError* exception.
        if (disposableState === "disposed") throw new ReferenceError("Object is disposed");

        // 4. Let _C_ be ? SpeciesConstructor(_asyncDisposableStack_, %AsyncDisposableStack%).
        // 5. Assert: IsConstructor(_C_) is *true*.
        const C = SpeciesConstructor(this, AsyncDisposableStack);

        // 6. Let _newAsyncDisposableStack_ be ? Construct(_C_, « »).
        const newAsyncDisposableStack = new C();

        // 7. Perform ? RequireInternalSlot(_newAsyncDisposableStack_, [[AsyncDisposableState]]).
        if (!weakAsyncDisposableState.has(newAsyncDisposableStack)) throw new TypeError("Wrong target");

        // 8. If _newAsyncDisposableStack_.[[AsyncDisposableState]] is not ~pending~, throw a *TypeError* exception.
        if (weakAsyncDisposableState.get(newAsyncDisposableStack) !== "pending") throw new TypeError("Expected new AsyncDisposableStack to be pending");

        // 9. Append each element of _asyncDisposableStack_.[[DisposableResourceStack]] to _newAsyncDisposableStack_.[[DisposableResourceStack]].
        // 10. Set _asyncDisposableStack_.[[DisposableResourceStack]] to a new empty List.
        const asyncDisposableResourceStack = weakAsyncDisposableResourceStack.get(this)!;
        const newDisposableResourceStack = weakAsyncDisposableResourceStack.get(newAsyncDisposableStack)!;
        newDisposableResourceStack.push(...asyncDisposableResourceStack.splice(0, asyncDisposableResourceStack.length));

        // 11. Return _newAsyncDisposableStack_.
        return newAsyncDisposableStack;
    }

    /**
     * Dispose this object's resources.
     */
    async [AsyncDisposable.asyncDispose]() {
        // 9.4.3.4 AsyncDisposableStack.prototype [ @@asyncDispose ] ()

        // 1. Let _asyncDisposableStack_ be the *this* value.

        // 2. Let _promiseCapability_ be ! NewPromiseCapability(%Promise%).
        // 3. If _asyncDisposableStack_ does not have a [[DisposableState]] internal slot, then
            // a. Perform ! Call(_promiseCapability_.[[Reject]], *undefined*, « a newly created *TypeError* object »).
            // b. Return _promiseCapability_.[[Promise]].
        const disposableState = weakAsyncDisposableState.get(this)!;
        if (!disposableState) throw new TypeError("Wrong target");

        // 4. If _asyncDisposableStack_.[[DisposableState]] is ~disposed~, then
            // a. Perform ! Call(_promiseCapability_.[[Resolve]], *undefined*, « *undefined* »).
            // b. Return _promiseCapability_.[[Promise]].
        if (disposableState === "disposed") return;

        // 5. Set _asyncDisposableStack_.[[DisposableState]] to ~disposed~.
        weakAsyncDisposableState.set(this, "disposed");

        // 6. Let _result_ be DisposeResources(_asyncDisposableStack_, NormalCompletion(*undefined*)).
        // 7. IfAbruptRejectPromise(_result_, _promiseCapability_).
        // 8. Perform ! Call(_promiseCapability_.[[Resolve]], *undefined*, « _result_ »).
        // 9. Return _promiseCapability_.[[Promise]].
        const asyncDisposableResourceStack = weakAsyncDisposableResourceStack.get(this)!;
        await DisposeResources("async", asyncDisposableResourceStack.splice(0, asyncDisposableResourceStack.length), /*completion*/ undefined);
    }
}
