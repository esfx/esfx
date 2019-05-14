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

/**
 * An object that represents a cancellation signal.
 */
export interface CancelSignal {
    /**
     * Gets a value indicating whether cancellation was signalled.
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
export interface CancelSubscription {
    /**
     * Unsubscribes from a cancellation signal.
     */
    unsubscribe(): void;
}

/**
 * An object that can be canceled from an external source.
 */
export interface Cancelable {
    /**
     * Gets the [[CancelSignal]] for this [[Cancelable]].
     */
    [Cancelable.cancelSignal](): CancelSignal;
}

export namespace Cancelable {
    // Cancelable
    export const cancelSignal = Symbol.for("@esfx/cancelable:Cancelable.cancelSignal");

    export function isCancelable(value: unknown): value is Cancelable {
        return typeof value === "object"
            && value !== null
            && cancelSignal in value;
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
     * Cancels the source, notifying the associated [[CancelSignal]].
     */
    [CancelableSource.cancel](): void;
}

export namespace CancelableSource {
    // Cancelable
    export import cancelSignal = Cancelable.cancelSignal;
    export import isCancelable = Cancelable.isCancelable;

    // CancelableSource
    export const cancel = Symbol.for("@esfx/cancelable:CancelableSource.cancel");

    export function isCancelableSource(value: unknown): value is CancelableSource {
        return isCancelable(value)
            && cancel in value;
    }
}

export class CancelError extends Error {
    constructor(message?: string) {
        super(message || "Operation was canceled");
    }
}

Object.defineProperty(CancelError.prototype, "name", {
    enumerable: false,
    configurable: true,
    writable: true,
    value: "CancelError",
});