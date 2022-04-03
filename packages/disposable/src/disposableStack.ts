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
import { Disposable } from "./disposable.js";
import { AddDisposableResource, DisposableResourceRecord, DisposeMethod, DisposeResources, GetDisposeMethod, GetMethod, SpeciesConstructor } from "./internal/utils.js";

const weakDisposableState = new WeakMap<Disposable, "pending" | "disposed">();
const weakDisposableResourceStack = new WeakMap<Disposable, DisposableResourceRecord<"sync">[]>();
const weakBoundDispose = new WeakMap<DisposableStack, (() => void) | undefined>();

export type DisposableLike = Disposable | (() => void);

/**
 * Emulates Python's `ExitStack`
 */
export class DisposableStack {
    declare [Symbol.toStringTag]: string;

    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, value: "DisposableStack" });
    }

    /**
     * Creates a new DisposableStack.
     */
    constructor() {
        // 9.3.1.1 DisposableStack()

        // 1. If NewTarget is `undefined` throw a *TypeError* exception.
        // 2. Let _disposableStack_ be ? OrdinaryCreateFromConstructor(NewTarget, *"%DisposableStack.prototype%"*, « [[DisposableState]], [[DisposableResourceStack]], [[BoundDispose]] »).

        // 3. Set _disposableStack_.[[DisposableState]] to ~pending~.
        weakDisposableState.set(this, "pending");

        // 4. Set _disposableStack_.[[DisposableResourceStack]] to a new empty List.
        weakDisposableResourceStack.set(this, []);

        // 5. Set _disposableStack_.[[BoundDispose]] to *undefined*.
        weakBoundDispose.set(this, undefined);

        // 6. Return _disposableStack_.
    }

    static get [Symbol.species]() {
        // 9.3.2.1 get DisposableStack[@@species]]

        // 1. Return the *this* value.
        return this;
    }

    /**
     * Dispose this object's resources.
     *
     * NOTE: `dispose` returns a bound method, so it can be extracted from `DisposableStack` and called independently:
     *
     * ```ts
     * const stack = new DisposableStack();
     * for (const f of files) stack.use(openFile(f));
     * const closeFiles = stack.dispose;
     * ...
     * closeFiles();
     * ```
     */
    get dispose() {
        // 9.3.3.1 get DisposableStack.prototype.dispose

        // 1. Let _disposableStack_ be the *this* value.

        // 2. Perform ? RequireInternalSlot(_disposableStack_, [[DisposableState]]).
        if (!weakDisposableState.has(this)) throw new TypeError("Wrong target");

        // 3. If _disposableStack_.[[BoundDispose]] is *undefined*, then
        if (weakBoundDispose.get(this) === undefined) {
            // a. Let _dispose_ be GetMethod(_disposableStack_, @@dispose).
            const dispose = GetMethod(this, Disposable.dispose);

            // b. If _dispose_ is *undefined*, throw a *TypeError* exception.
            if (dispose === undefined) throw new TypeError(`Method not found: ${Disposable.dispose.toString()}`);

            // c. Let _F_ be a new built-in function object as defined in 9.3.3.1.1
            // d. Set _F_.[[DisposableStack]] to _disposableStack_.
            // e. Set _F_.[[DisposeMethod]] to _dispose_.
            const F = dispose.bind(this);

            // f. Set _disposableStack_.[[BoundDispose]] to _F_.
            weakBoundDispose.set(this, F);
        }

        // 4. Return _disposableStack_.[[BoundDispose]].
        return weakBoundDispose.get(this)!;
    }

    /**
     * Pushes a new disposable resource onto the disposable stack stack. Resources are disposed in the reverse order they were entered.
     * @param value The resource to add.
     * @returns The resource provided.
     */
    use<T extends DisposableLike | null | undefined>(value: T): T;
    /**
     * Pushes a new disposable resource onto the disposable stack stack. Resources are disposed in the reverse order they were entered.
     * @param value The resource to add.
     * @param onDispose The operation to perform when the resource is disposed.
     * @returns The resource provided.
     */
    use<T>(value: T, onDispose: (value: T) => void): T;
    use<T>(value: T, onDispose: ((value: T) => void) | undefined = undefined): T {
        // 9.3.3.2 DisposableStack.prototype.use ( _value_ [ , _onDispose_ ] )

        // 1. Let _disposableStack_ be the *this* value.

        // 2. Perform ? RequireInternalSlot(_disposableStack_, [[DisposableState]]).
        const disposableState = weakDisposableState.get(this);
        if (!disposableState) throw new TypeError("Wrong target");

        // 3. If _disposableStack_.[[DisposableState]] is ~disposed~, throw a *ReferenceError* exception.
        if (disposableState === "disposed") throw new ReferenceError("Object is disposed");

        // 4. If _onDispose_ is not *undefined*, then
        if (onDispose !== undefined) {
            // a. If IsCallable(_onDispose_) is *false*, throw a *TypeError* exception.
            if (!isFunction(onDispose)) throw new TypeError("Function expected: onDispose");

            // b. Let _F_ be a new built-in function object as defined in 9.3.3.2.1.
            // c. Set _F_.[[Argument]] to _value_.
            // d. Set _F_.[[OnDisposeCallback]] to _onDispose_.
            const F = () => onDispose(value);

            // e. Perform ? AddDisposableResource(_disposableStack_, *undefined*, ~sync~, _F_).
            AddDisposableResource(weakDisposableResourceStack.get(this)!, undefined, "sync", F);
        }

        // 5. Else, if _value_ is neither *null* nor *undefined*, then
        else if (value !== null && value !== undefined) {
            // a. If Type(_value_) is not Object, throw a *TypeError* exception.
            if (!isObject(value)) throw new TypeError("Object expected: value");

            // b. Let _method_ be GetDisposeMethod(_value_, ~sync~).
            const method = GetDisposeMethod(value as T & object, "sync");

            // c. If _method_ is undefined, then
            if (method === undefined) {
                // i. If IsCallable(_value_) is true, then
                if (isFunction(value)) {
                    // 1. Perform ? AddDisposableResource(_disposableStack_, *undefined*, ~sync~, _value_).
                    AddDisposableResource(weakDisposableResourceStack.get(this)!, undefined, "sync", value as T & DisposeMethod<"sync">);
                }

                // ii. Else,
                else {
                    // 1. Throw a TypeError exception.
                    throw new TypeError("Function expected: value");
                }
            }

            // d. Else,
            else {
                // i. Perform ? AddDisposableResource(_disposableStack_, _value_, ~sync~, _method_).
                AddDisposableResource(weakDisposableResourceStack.get(this)!, value, "sync", method);
            }
        }

        // 6. Return _value_.
        return value;
    }

    /**
     * Moves all resources out of this `DisposableStack` and into a new `DisposableStack` and returns it.
     */
    move(): DisposableStack {
        // 9.3.3.3 DisposableStack.prototype.move()

        // 1. Let _disposableStack_ be the *this* value.

        // 2. Perform ? RequireInternalSlot(_disposableStack_, [[DisposableState]]).
        const disposableState = weakDisposableState.get(this);
        if (!disposableState) throw new TypeError("Wrong target");

        // 3. If _disposableStack_.[[DisposableState]] is ~disposed~, throw a *ReferenceError* exception.
        if (disposableState === "disposed") throw new ReferenceError("Object is disposed");

        // 4. Let _C_ be ? SpeciesConstructor(_disposableStack_, %DisposableStack%).
        // 5. Assert: IsConstructor(_C_) is *true*.
        const C = SpeciesConstructor(this, DisposableStack);

        // 6. Let _newDisposableStack_ be ? Construct(_C_, « »).
        const newDisposableStack = new C();

        // 7. Perform ? RequireInternalSlot(_newDisposableStack_, [[DisposableState]]).
        if (!weakDisposableState.has(newDisposableStack)) throw new TypeError("Wrong target");

        // 8. If _newDisposableStack_.[[DisposableState]] is not ~pending~, throw a *TypeError* exception.
        if (weakDisposableState.get(newDisposableStack) !== "pending") throw new TypeError("Expected new DisposableStack to be pending");

        // 9. Append each element of _disposableStack_.[[DisposableResourceStack]] to _newDisposableStack_.[[DisposableResourceStack]].
        // 10. Set _disposableStack_.[[DisposableResourceStack]] to a new empty List.
        const disposableResourceStack = weakDisposableResourceStack.get(this)!;
        const newDisposableResourceStack = weakDisposableResourceStack.get(newDisposableStack)!;
        newDisposableResourceStack.push(...disposableResourceStack.splice(0, disposableResourceStack.length));

        // 11. Return _newDisposableStack_.
        return newDisposableStack;
    }

    /**
     * Dispose this object's resources.
     */
    [Disposable.dispose]() {
        // 9.3.3.4 DisposableStack.prototype [ @@dispose ] ()

        // 1. Let _disposableStack_ be the *this* value.
        
        // 2. Perform ? RequireInternalSlot(_disposableStack_, [[DisposableState]]).
        const disposableState = weakDisposableState.get(this);
        if (!disposableState) throw new TypeError("Wrong target");

        // 3. If _disposableStack_.[[DisposableState]] is ~disposed~, return *undefined*.
        if (disposableState === "disposed") return;

        // 4. Set _disposableStack_.[[DisposableState]] to ~disposed~.
        weakDisposableState.set(this, "disposed");

        // 5. Return DisposeResources(_disposableStack_, NormalCompletion(*undefined*)).
        const disposableResourceStack = weakDisposableResourceStack.get(this)!;
        DisposeResources("sync", disposableResourceStack.splice(0, disposableResourceStack.length), /*completion*/ undefined);
    }
}
