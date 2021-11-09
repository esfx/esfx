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

import { Disposable, DisposableLike, __Disposable_prototype__ } from "./disposable";
import { weakDisposableResourceStack, weakDisposableState } from "./internal/disposable";
import { AddDisposableResource, createDeprecation, DisposeResources } from "./internal/utils";

const weakDisposable = new WeakMap<DisposableStack, Disposable>();
const weakDispose = new WeakMap<DisposableStack, (() => void) | null>();
const reportDisposableStackEnterDeprecation = createDeprecation("Use 'DisposableStack.use()' instead.");

/**
 * Emulates Python's `ExitStack`
 */
export class DisposableStack {
    declare [Symbol.toStringTag]: string;

    /**
     * Creates a new DisposableStack.
     */
    constructor() {
        const disposable = Object.create(__Disposable_prototype__) as Disposable;
        weakDisposableState.set(disposable, "pending");
        weakDisposableResourceStack.set(disposable, []);
        weakDisposable.set(this, disposable);
        weakDispose.set(this, null);
    }

    /**
     * Dispose this object's resources.
     *
     * NOTE: `dispose` returns a bound method, so it can be extracted from `DisposableStack` and called independently:
     * 
     * ```ts
     * const stack = new DisposableStack();
     * for (const f of files) stack.use(openFile(f));
     * const closeFiles = stack.disposeAsync;
     * ...
     * closeFiles();
     * ```
     */
    get dispose() {
        let dispose = weakDispose.get(this);
        if (dispose === undefined) throw new TypeError("Wrong target");
        if (dispose === null) {
            dispose = __DisposableStack_prototype_dispose__.bind(this);
            weakDispose.set(this, dispose);
        }
        return dispose;
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
        const disposable = weakDisposable.get(this);
        if (!disposable) throw new TypeError("Wrong target");

        const disposableState = weakDisposableState.get(disposable);
        if (disposableState === "disposed") throw new ReferenceError("Object is disposed");
        if (disposableState !== "pending") throw new TypeError("Wrong target");

        if (value !== null && value !== undefined || onDispose) {
            const disposableResourceStack = weakDisposableResourceStack.get(disposable)!;
            AddDisposableResource(disposableResourceStack, onDispose ? () => onDispose(value) : value, "sync");
        }

        return value;
    }

    /**
     * Pushes a new disposable resource onto the disposable stack stack. Resources are disposed in the reverse order they were entered.
     * @param value The resource to add.
     * @returns The resource provided.
     * @deprecated Use {@link use `DisposableStack.use`} instead.
     */
    enter<T extends DisposableLike | null | undefined>(value: T): T;
    /**
     * Pushes a new disposable resource onto the disposable stack stack. Resources are disposed in the reverse order they were entered.
     * @param value The resource to add.
     * @param onDispose The operation to perform when the resource is disposed.
     * @returns The resource provided.
     * @deprecated Use {@link use `DisposableStack.use`} instead.
     */
    enter<T>(value: T, onDispose: (value: T) => void): T;
    enter<T>(value: T, onDispose: ((value: T) => void) | undefined = undefined): T {
        reportDisposableStackEnterDeprecation();
        return this.use(value, onDispose!);
    }

    /**
     * Moves all resources out of this `DisposableStack` and into a new `DisposableStack` and returns it.
     */
    move(): DisposableStack {
        const disposable = weakDisposable.get(this);
        if (!disposable) throw new TypeError("Wrong target");

        const disposableState = weakDisposableState.get(disposable);
        if (disposableState === "disposed") throw new ReferenceError("Object is disposed");
        if (disposableState !== "pending") throw new TypeError("Wrong target");

        const disposableResourceStack = weakDisposableResourceStack.get(disposable)!;

        const newDisposable = Object.create(__Disposable_prototype__) as Disposable;
        weakDisposableState.set(newDisposable, "pending");
        weakDisposableResourceStack.set(newDisposable, disposableResourceStack);
        weakDisposableResourceStack.set(disposable, []);

        const newDisposableStack = Object.create(__DisposableStack_prototype__) as DisposableStack;
        weakDisposable.set(newDisposableStack, newDisposable);
        weakDispose.set(newDisposableStack, null);
        return newDisposableStack;
    }

    /**
     * Dispose this object's resources.
     */
    [Disposable.dispose]() {
        const disposable = weakDisposable.get(this);
        if (!disposable) throw new TypeError("Wrong target");

        const disposableState = weakDisposableState.get(disposable);
        if (disposableState === "disposed") return;
        if (disposableState !== "pending") throw new TypeError("Wrong target");
        weakDisposableState.set(disposable, "disposed");

        DisposeResources("sync", weakDisposableResourceStack.get(disposable), /*suppress*/ false, /*completion*/ undefined);
    }
}

const __DisposableStack_prototype__ = DisposableStack.prototype;
const __DisposableStack_prototype_dispose__ = DisposableStack.prototype[Disposable.dispose];

Object.defineProperty(__DisposableStack_prototype__, Symbol.toStringTag, { configurable: true, value: "DisposableStack" });
