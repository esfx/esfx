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
import { AddDisposableResource, DisposeCapability, DisposeMethod, DisposeResources, GetDisposeMethod, NewDisposeCapability } from "./internal/utils.js";

const weakDisposableState = new WeakMap<Disposable, "pending" | "disposed">();
const weakDisposeCapability = new WeakMap<Disposable, DisposeCapability<"sync-dispose">>();

/** @deprecated Use {@link Disposable} instead. */
export type DisposableLike = Disposable | (() => void);

/**
 * A container for disposable resources. When the stack is disposed, its containing resources are disposed in the reverse
 * of the order in which they were added.
 */
export class DisposableStack {

    /**
     * Creates a new DisposableStack.
     */
    constructor() {
        // 11.3.1.1 DisposableStack()

        // 1. If NewTarget is `undefined` throw a *TypeError* exception.
        // 2. Let _disposableStack_ be ? OrdinaryCreateFromConstructor(NewTarget, *"%DisposableStack.prototype%"*, « [[DisposableState]], [[DisposeCapability]] »).

        // 3. Set _disposableStack_.[[DisposableState]] to ~pending~.
        weakDisposableState.set(this, "pending");

        // 4. Set _disposableStack_.[[DisposeCapability]] to NewDisposeCapability().
        weakDisposeCapability.set(this, NewDisposeCapability());

        // 5. Return _disposableStack_.
    }

    /**
     * Gets a value indicating whether the stack has already been disposed.
     */
    get disposed() {
        // 11.3.3.1 get DisposableStack.prototype.disposed

        // 1. Let _disposableStack_ be the *this* value.

        // 2. Perform ? RequireInternalSlot(_disposableStack_, [[DisposableState]]).
        if (!weakDisposableState.has(this)) throw new TypeError("Wrong target");

        // 3. If _disposableStack_.[[DisposableState]] is ~disposed~, return *true*.
        if (weakDisposableState.get(this) === "disposed") return true;

        // 4. Otherwise, return *false*.
        return false;
    }

    /**
     * Dispose this object's resources. This method is an alias for `[Disposable.dispose]()`.
     *
     * ```ts
     * const stack = new DisposableStack();
     * for (const f of files) stack.use(openFile(f));
     * ...
     * stack.dispose();
     * ```
     */
    dispose() {
        // 11.3.3.2 DisposableStack.prototype.dispose()

        // 1. Let _disposableStack_ be the *this* value.

        // 2. Perform ? RequireInternalSlot(_disposableStack_, [[DisposableState]]).
        const disposableState = weakDisposableState.get(this);
        if (!disposableState) throw new TypeError("Wrong target");

        // 3. If _disposableStack_.[[DisposableState]] is ~disposed~, return *undefined*.
        if (disposableState === "disposed") return;

        // 4. Set _disposableStack_.[[DisposableState]] to ~disposed~.
        weakDisposableState.set(this, "disposed");

        // 5. Return ? DisposeResources(_disposableStack_, NormalCompletion(*undefined*)).
        const disposeCapability = weakDisposeCapability.get(this)!;
        weakDisposeCapability.delete(this);
        DisposeResources("sync-dispose", disposeCapability, /*completion*/ undefined);
    }

    /**
     * Pushes a disposable resource onto the disposable stack stack. Resources are disposed in the reverse order they were entered.
     * @param value The resource to add.
     * @returns The resource provided.
     */
    use<T extends Disposable | null | undefined>(value: T): T;
    /** @deprecated Use {@link defer|defer()} instead. */
    use<T extends () => void>(value: T): T;
    /** @deprecated Use {@link adopt|adopt()} instead. */
    use<T>(value: T, onDispose: (value: T) => void): T;
    use<T>(value: T, onDispose: ((value: T) => void) | undefined = undefined): T {
        // 11.3.3.3 DisposableStack.prototype.use ( _value_ )

        // 1. Let _disposableStack_ be the *this* value.

        // 2. Perform ? RequireInternalSlot(_disposableStack_, [[DisposableState]]).
        const disposableState = weakDisposableState.get(this);
        if (!disposableState) throw new TypeError("Wrong target");

        // 3. If _disposableStack_.[[DisposableState]] is ~disposed~, throw a *ReferenceError* exception.
        if (disposableState === "disposed") throw new ReferenceError("Object is disposed");

        // NOTE: 1.0.0 compatibility:
        if (onDispose !== undefined) {
            return this.adopt(value, onDispose);
        }

        // NOTE: 1.0.0 compatibility:
        if (value !== null && value !== undefined && typeof value === "function" && !(Disposable.dispose in value)) {
            this.defer(value as unknown as DisposeMethod<"sync-dispose">);
            return value;
        }

        // 4. Perform ? AddDisposableResource(_disposableStack_.[[DisposeCapability]], _value_, ~sync-dispose~).
        AddDisposableResource(weakDisposeCapability.get(this)!, value, "sync-dispose");

        // 5. Return _value_.
        return value;
    }

    /**
     * Pushes a non-disposable resource onto the stack with the provided disposal callback.
     * @param value The resource to add.
     * @param onDispose The callback to execute when the resource is disposed.
     * @returns The resource provided.
     */
    adopt<T>(value: T, onDispose: (value: T) => void): T {
        // 11.3.3.4 DisposableStack.prototype.adopt ( _value_, _onDispose_ )

        // 1. Let _disposableStack_ be the *this* value.

        // 2. Perform ? RequireInternalSlot(_disposableStack_, [[DisposableState]]).
        const disposableState = weakDisposableState.get(this);
        if (!disposableState) throw new TypeError("Wrong target");

        // 3. If _disposableStack_.[[DisposableState]] is ~disposed~, throw a *ReferenceError* exception.
        if (disposableState === "disposed") throw new ReferenceError("Object is disposed");

        // 4. If IsCallable(_onDispose_) is *false*, throw a *TypeError* exception.
        if (!isFunction(onDispose)) throw new TypeError("Function expected: onDispose");

        // 5. Let _closure_ be a Abstract Closure with no parameters that captures _value_ and _onDispose_ and performs the following steps when called:
        //    1. Return ? Call(_onDispose_, *undefined*, « _value_ »).
        // 6. Let _F_ be CreateBuiltinFunction(_closure_, 0, *""*, , « »).
        const F = () => { onDispose(value); };

        // 7. Perform ? AddDisposableResource(_disposableStack_.[[DisposeCapability]], *undefined*, ~sync-dispose~, _F_).
        AddDisposableResource(weakDisposeCapability.get(this)!, undefined, "sync-dispose", F);

        // 8. Return _value_.
        return value;
    }

    /**
     * Pushes a resourceless disposal callback onto the stack.
     * @param onDispose The callback to execute when the stack is disposed.
     */
    defer(onDispose: () => void): void {
        // 11.3.3.5 DisposableStack.prototype.defer( _onDispose_ )

        // 1. Let _disposableStack_ be the *this* value.

        // 2. Perform ? RequireInternalSlot(_disposableStack_, [[DisposableState]]).
        const disposableState = weakDisposableState.get(this);
        if (!disposableState) throw new TypeError("Wrong target");

        // 3. If _disposableStack_.[[DisposableState]] is ~disposed~, throw a *ReferenceError* exception.
        if (disposableState === "disposed") throw new ReferenceError("Object is disposed");

        // 4. If IsCallable(_onDispose_) is *false*, throw a *TypeError* exception.
        if (!isFunction(onDispose)) throw new TypeError("Function expected: onDispose");

        // 5. Perform ? AddDisposableResource(_disposableStack_.[[DisposeCapability]], *undefined*, ~sync-dispose~, _onDispose_).
        AddDisposableResource(weakDisposeCapability.get(this)!, undefined, "sync-dispose", onDispose);

        // 6. Return *undefined*.
    }

    /**
     * Moves all resources out of this `DisposableStack` and into a new `DisposableStack` and returns it.
     */
    move(): DisposableStack {
        // 11.3.3.6 DisposableStack.prototype.move()

        // 1. Let _disposableStack_ be the *this* value.

        // 2. Perform ? RequireInternalSlot(_disposableStack_, [[DisposableState]]).
        const disposableState = weakDisposableState.get(this);
        if (!disposableState) throw new TypeError("Wrong target");

        // 3. If _disposableStack_.[[DisposableState]] is ~disposed~, throw a *ReferenceError* exception.
        if (disposableState === "disposed") throw new ReferenceError("Object is disposed");

        // 4. Let _newDisposableStack_ be ? OrdinaryCreateFromConstructor(%DisposableStack%, "%DisposableStack.prototype%", « [[DisposableState]], [[DisposeCapability]] »).
        // 5. Set _newDisposableStack_.[[DisposableState]] to ~pending~.
        const newDisposableStack = new DisposableStack();

        // 6. Set _newDisposableStack_.[[DisposeCapability]] to _disposableStack_.[[DisposeCapability]].
        weakDisposeCapability.set(newDisposableStack, weakDisposeCapability.get(this)!);

        // 7. Set _disposableStack_.[[DisposeCapability]] to NewDisposeCapability().
        weakDisposeCapability.set(this, NewDisposeCapability());

        // 8. Set _disposableStack_.[[DisposableState]] to ~disposed~.
        weakDisposableState.set(this, "disposed");

        // 9. Return _newDisposableStack_.
        return newDisposableStack;
    }

    /**
     * Dispose this object's resources.
     */
    [Disposable.dispose]() { return this.dispose(); }
    static {
        // 11.3.3.7 DisposableStack.prototype [ @@dispose ] ()

        // The initial value of the @@dispose property is %DisposableStack.prototype.dispose%, defined in 11.3.3.2.
        this.prototype[Disposable.dispose] = this.prototype.dispose;
    }

    declare [Symbol.toStringTag]: string;
    static {
        // 11.3.3.8 DisposableStack.prototype [ @@toStringTag ]

        // The initial value of the @@toStringTag property is the String value "DisposableStack".

        // This property has the attributes { [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]: true }.
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, value: "DisposableStack" });
    }
}
