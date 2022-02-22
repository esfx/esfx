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

import { Disposable } from "@esfx/disposable";

// Dynamically infer `ErrorOptions` based on whether the es2022 lib is loaded.
type ErrorOptions =
    2 extends ConstructorParameters<typeof Error>["length"] ?
        ConstructorParameters<typeof Error> extends [message?: string, options?: infer O] ?
            NonNullable<O> :
            never :
        never;

type CancelErrorExtraArgs = [ErrorOptions] extends [never] ? [] : [options?: ErrorOptions];

export class CancelError extends Error {
    static {
        Object.defineProperty(this.prototype, "name", { configurable: true, writable: true, value: "CancelError" });
    }

    constructor(message?: string, options?: ErrorOptions);
    constructor(message = "Operation was canceled", ...args: CancelErrorExtraArgs) {
        super(message, ...args);
    }
}


/**
 * An object used to unsubscribe from a cancellation signal
 */
export interface CancelSubscription extends Disposable {
    /**
     * Unsubscribes from a cancellation signal.
     */
    unsubscribe(): void;
}

export namespace CancelSubscription {
    const CancelSubscriptionPrototype: Disposable = {
        [Disposable.dispose](this: CancelSubscription) {
            this.unsubscribe();
        }
    };

    Object.defineProperty(CancelSubscriptionPrototype, Symbol.toStringTag, { configurable: true, value: "CancelSubscription" });

    /**
     * Creates a `CancelSubscription` object for an `unsubscribe` callback.
     * @param unsubscribe The callback to execute when the `unsubscribe()` method is called.
     */
    export function create(unsubscribe: () => void): CancelSubscription {
        if (typeof unsubscribe !== "function") throw new TypeError("Function expected: unsubscribe");
        return Object.setPrototypeOf({
            unsubscribe() {
                unsubscribe();
            },
        }, CancelSubscriptionPrototype);
    }
}

/**
 * An object that can be canceled from an external source.
 */
export interface Cancelable {
    /**
     * Gets the CancelSignal for this Cancelable.
     */
    [Cancelable.cancelSignal](): CancelSignal;
}

export namespace Cancelable {
    // #region Cancelable

    /**
     * A well-known symbol used to define a method to retrieve the `CancelSignal` for an object.
     */
    export const cancelSignal = Symbol.for("@esfx/cancelable:Cancelable.cancelSignal");

    // #endregion Cancelable

    const CancelSignalPrototype: Cancelable = {
        [Cancelable.cancelSignal](this: CancelableCancelSignal) {
            return this;
        }
    };

    Object.defineProperty(CancelSignalPrototype, Symbol.toStringTag, { configurable: true, value: "CancelSignal" });

    const emptySubscription: CancelSubscription = CancelSubscription.create(() => { });
    Object.freeze(emptySubscription);

    const canceledReason = new CancelError();
    Object.freeze(canceledReason);

    /**
     * A `Cancelable` that is already signaled.
     */
    export const canceled: CancelableCancelSignal = Object.setPrototypeOf({
        get signaled() {
            return true;
        },
        get reason() {
            return canceledReason;
        },
        subscribe(onSignaled: () => void) {
            onSignaled();
            return emptySubscription;
        }
    }, CancelSignalPrototype);
    Object.freeze(canceled);

    /**
     * A `Cancelable` that can never be signaled.
     */
    export const none: CancelableCancelSignal = Object.setPrototypeOf({
        get signaled() {
            return false;
        },
        get reason() {
            return undefined;
        },
        subscribe(_onSignaled: () => void) {
            return emptySubscription;
        },
    }, CancelSignalPrototype);
    Object.freeze(none);

    /**
     * Determines whether `cancelable` is in the signaled state.
     */
    export function isSignaled(cancelable: Cancelable | null | undefined) {
        if (cancelable !== null && cancelable !== undefined && !hasInstance(cancelable)) throw new TypeError("Cancelable expected: cancelable");
        if (cancelable === Cancelable.canceled) return true;
        if (cancelable === Cancelable.none || cancelable === null || cancelable === undefined) return false;
        return cancelable[Cancelable.cancelSignal]().signaled;
    }

    /**
     * Gets the reason for cancelation.
     */
    export function getReason(cancelable: Cancelable | null | undefined) {
        if (cancelable !== null && cancelable !== undefined && !hasInstance(cancelable)) throw new TypeError("Cancelable expected: cancelable");
        if (cancelable === Cancelable.canceled) return canceledReason;
        if (cancelable === Cancelable.none || cancelable === null || cancelable === undefined) return undefined;
        return cancelable[Cancelable.cancelSignal]().reason;
    }

    /**
     * Throws a `CancelError` exception if the provided `cancelable` is in the signaled state.
     */
    export function throwIfSignaled(cancelable: Cancelable | null | undefined) {
        if (isSignaled(cancelable)) {
            throw getReason(cancelable) ?? new CancelError();
        }
    }

    /**
     * Subscribes to be notified when a `cancelable` becomes signaled.
     */
    export function subscribe(cancelable: Cancelable | null | undefined, onSignaled: () => void) {
        if (cancelable !== null && cancelable !== undefined && !hasInstance(cancelable)) throw new TypeError("Cancelable expected: cancelable");
        if (cancelable === Cancelable.none || cancelable === null || cancelable === undefined) return emptySubscription;
        if (cancelable === Cancelable.canceled) return onSignaled(), emptySubscription;
        return cancelable[Cancelable.cancelSignal]().subscribe(onSignaled);
    }

    export const name = "Cancelable";

    /**
     * Determines whether a value is a `Cancelable` object.
     */
    export function hasInstance(value: unknown): value is Cancelable {
        return typeof value === "object"
            && value !== null
            && Cancelable.cancelSignal in value;
    }
}

/**
 * An object that represents a cancellation signal.
 */
export interface CancelSignal {
    /**
     * Gets a value indicating whether cancellation was signaled.
     */
    readonly signaled: boolean;

    /**
     * Gets the reason cancellation was signaled.
     */
    readonly reason: unknown;

    /**
     * Subscribes to notifications for when the object becomes signaled.
     */
    subscribe(onSignaled: () => void): CancelSubscription;
}

export interface CancelableCancelSignal extends CancelSignal {
    [Cancelable.cancelSignal](): CancelableCancelSignal;
}

/**
 * Represents an object that is a source for cancelation.
 */
export interface CancelableSource extends Cancelable {
    /**
     * Cancels the source, notifying the associated CancelSignal.
     */
    [CancelableSource.cancel](reason?: unknown): void;
}

export namespace CancelableSource {
    // #region Cancelable
    export import cancelSignal = Cancelable.cancelSignal;
    // #endregion Cancelable

    // #region CancelableSource
    export const cancel = Symbol.for("@esfx/cancelable:CancelableSource.cancel");
    // #endregion CancelableSource

    export const name = "CancelableSource";

    /**
     * Determines whether a value is a `CancelableSource` object.
     */
    export function hasInstance(value: unknown): value is CancelableSource {
        return Cancelable.hasInstance(value)
            && CancelableSource.cancel in value;
    }
}
