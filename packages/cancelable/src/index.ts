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

const cancelSubscriptionPrototype: Disposable = {
    [Disposable.dispose](this: CancelSubscription) {
        this.unsubscribe();
    },
};
Object.defineProperty(cancelSubscriptionPrototype, Symbol.toStringTag, { configurable: true, value: "CancelSubscription" });

function createCancelSubscription(unsubscribe: () => void): CancelSubscription {
    return Object.setPrototypeOf({
        unsubscribe() {
            unsubscribe();
        },
    }, cancelSubscriptionPrototype);
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

    const cancelSignalPrototype: Cancelable = {
        [Cancelable.cancelSignal](this: CancelableCancelSignal) {
            return this;
        }
    };
    Object.defineProperty(cancelSignalPrototype, Symbol.toStringTag, { configurable: true, value: "CancelSignal" });

    const emptySubscription: CancelSubscription = createCancelSubscription(() => { });
    Object.freeze(emptySubscription);

    /**
     * A `Cancelable` that is already signaled.
     */
    export const canceled: CancelableCancelSignal = Object.setPrototypeOf({
        get signaled() {
            return true;
        },
        subscribe(onSignaled: () => void) {
            onSignaled();
            return emptySubscription;
        }
    }, cancelSignalPrototype);

    Object.freeze(canceled);

    /**
     * A `Cancelable` that can never be signaled.
     */
    export const none: CancelableCancelSignal = Object.setPrototypeOf({
        get signaled() {
            return false;
        },
        subscribe(_onSignaled: () => void) {
            return emptySubscription;
        },
    }, cancelSignalPrototype);

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
     * Throws a `CancelError` exception if the provided `cancelable` is in the signaled state.
     */
    export function throwIfSignaled(cancelable: Cancelable | null | undefined) {
        if (isSignaled(cancelable)) {
            throw new CancelError();
        }
    }

    /**
     * Subscribes to be notified when a `cancelable` becomes signaled.
     */
    export function subscribe(cancelable: Cancelable | null | undefined, onSignaled: () => void) {
        if (cancelable !== null && cancelable !== undefined && !hasInstance(cancelable)) throw new TypeError("Cancelable expected: cancelable");
        if (cancelable === Cancelable.canceled) return Cancelable.canceled.subscribe(onSignaled);
        if (cancelable === Cancelable.none || cancelable === null || cancelable === undefined) return Cancelable.none.subscribe(onSignaled);
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
     * Subscribes to notifications for when the object becomes signaled.
     */
    subscribe(onSignaled: () => void): CancelSubscription;
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
    /**
     * Creates a `CancelSubscription` object for an `unsubscribe` callback.
     * @param unsubscribe The callback to execute when the `unsubscribe()` method is called.
     */
    export function create(unsubscribe: () => void): CancelSubscription {
        if (typeof unsubscribe !== "function") throw new TypeError("Function expected: unsubscribe");
        return createCancelSubscription(unsubscribe);
    }
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
    [CancelableSource.cancel](): void;
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

export class CancelError extends Error {
    constructor(message?: string, options?: ErrorOptions) {
        super(message || "Operation was canceled", options);
    }
}

Object.defineProperty(CancelError.prototype, "name", {
    enumerable: false,
    configurable: true,
    writable: true,
    value: "CancelError",
});
