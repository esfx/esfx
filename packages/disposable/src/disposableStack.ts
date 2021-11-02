import { Disposable } from "./disposable";
import { weakDisposableResourceStack, weakDisposableState } from "./internal/disposable";
import { AddDisposableResource } from "./internal/utils";

const weakDisposable = new WeakMap<DisposableStack, Disposable>();

/**
 * Emulates Python's `ExitStack`
 */
export class DisposableStack {
    declare [Symbol.toStringTag]: string;

    constructor() {
        const disposable = Object.create(Disposable.prototype) as Disposable;
        weakDisposableState.set(disposable, "pending-stack");
        weakDisposableResourceStack.set(disposable, []);
        weakDisposable.set(this, disposable);
    }

    /**
     * Pushes a new disposable resource onto the disposable stack stack. Resources are disposed in the reverse order they were entered.
     * @param value The resource to add.
     * @returns The resource provided.
     */
    enter<T extends Disposable | (() => void) | null | undefined>(value: T): T;
    /**
     * Pushes a new disposable resource onto the disposable stack stack. Resources are disposed in the reverse order they were entered.
     * @param value The resource to add.
     * @param onDispose The operation to perform when the resource is disposed. Not invoked if `value` is `null` or `undefined`.
     * @returns The resource provided.
     */
    enter<T>(value: T, onDispose: (value: NonNullable<T>) => void): T;
    enter<T>(value: T, onDispose: ((value: NonNullable<T>) => void) | undefined = undefined): T {
        if (!weakDisposable.has(this)) throw new TypeError("Wrong target");
        const disposable = weakDisposable.get(this)!;
        const state = weakDisposableState.get(disposable)!;
        const stack = weakDisposableResourceStack.get(disposable)!;
        if (state === "disposed") throw new ReferenceError("Object is disposed");
        if (state !== "pending-stack") throw new ReferenceError("Wrong target");
        if (value !== null && value !== undefined) {
            AddDisposableResource(stack, onDispose ? () => onDispose(value!) : value, "sync");
        }
        return value;
    }

    /**
     * Moves all resources out of this `DisposableStack` and into a new `DisposableStack` and returns it.
     */
    move(): DisposableStack {
        if (!weakDisposable.has(this)) throw new TypeError("Wrong target");
        const disposable = weakDisposable.get(this)!;
        const state = weakDisposableState.get(disposable)!;
        const stack = weakDisposableResourceStack.get(disposable)!;
        if (state === "disposed") throw new ReferenceError("Object is disposed");
        if (state !== "pending-stack") throw new ReferenceError("Wrong target");

        const newExitStack = Object.create(DisposableStack.prototype) as DisposableStack;
        const newDisposable = Object.create(Disposable.prototype) as Disposable;
        weakDisposableState.set(newDisposable, "pending-stack");
        weakDisposableResourceStack.set(newDisposable, stack.slice());
        weakDisposable.set(newExitStack, newDisposable);
        stack.length = 0;
        return newExitStack;
    }

    /**
     * Dispose this object's resources.
     */
    dispose() {
        if (!weakDisposable.has(this)) throw new TypeError("Wrong target");
        const disposable = weakDisposable.get(this)!;
        disposable[Disposable.dispose]();
    }

    /**
     * Dispose this object's resources.
     */
    [Disposable.dispose]() {
        this.dispose();
    }
}

Object.defineProperty(DisposableStack.prototype, Symbol.toStringTag, { configurable: true, value: "DisposableStack" });
Object.defineProperty(DisposableStack.prototype, Disposable.dispose, Object.getOwnPropertyDescriptor(DisposableStack.prototype, "dispose")!);