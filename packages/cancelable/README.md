# `@esfx/cancelable`

The `@esfx/cancelable` package provides a low-level Symbol-based API for defining a common cancellation protocol.

> NOTE: This package does not contain an *implementation* of cancellation signals, but rather provides only a
> protocol for interoperable libraries that depend on cancellation.
>
> For an implementation of this protocol, please consider the following packages:
> - [`@esfx/async-canceltoken`](../packages/async-canceltoken#readme)
> - [`@esfx/cancelable-dom`](../packages/cancelable-dom#readme)
> - [`@esfx/cancelable-dom-shim`](../packages/cancelable-dom-shim#readme)
> - [`prex`](https://github.com/rbuckton/prex#readme) (version 0.4.6 or later)

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/cancelable
```

# Usage

```ts
import { Cancelable } from "@esfx/cancelable";

function doSomeWork(cancelable: Cancelable) {
    return new Promise((resolve, reject) => {
        const cancelSignal = cancelable[Cancelable.cancelSignal]();
        if (cancelSignal.signaled) throw new Error("Operation canceled.");

        const child = fork("worker.js");
        const subscription = cancelSignal.subscribe(() => {
            // cancellation requested, abort worker
            worker.kill();
            reject(new Error("Operation canceled."));
        });

        worker.on("exit", () => {
            subscription.unsubscribe();
            resolve();
        });
    });
}
```

# API

```ts
import { Disposable } from "@esfx/disposable";

/**
 * An object that can be canceled from an external source.
 */
export interface Cancelable {
    /**
     * Gets the `CancelSignal` for this `Cancelable`.
     */
    [Cancelable.cancelSignal](): CancelSignal;
}

export declare namespace Cancelable {
    /**
     * A well-known symbol used to define a method to retrieve the `CancelSignal` for an object.
     */
    export const cancelSignal: unique symbol;
    /**
     * A `Cancelable` that is already signaled.
     */
    export const canceled: CancelableCancelSignal;
    /**
     * A `Cancelable` that can never be signaled.
     */
    export const none: CancelableCancelSignal;
    /**
     * Determines whether a value is a `Cancelable` object.
     */
    export function isCancelable(value: unknown): value is Cancelable;
    /**
     * Determines whether `cancelable` is in the signaled state.
     */
    export function isSignaled(cancelable: Cancelable | undefined): boolean;
    /**
     * Throws a `CancelError` exception if the provided `cancelable` is in the signaled state.
     */
    export function throwIfSignaled(cancelable: Cancelable | undefined): void;
    /**
     * Subscribes to be notified when `cancelable` becomes signaled.
     */
    export function subscribe(cancelable: Cancelable | undefined, onSignaled: () => void): CancelSubscription;
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

export interface CancelableCancelSignal extends CancelSignal {
    [Cancelable.cancelSignal](): CancelableCancelSignal;
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

export declare namespace CancelSubscription {
    /**
     * Creates a `CancelSubscription` object for an `unsubscribe` callback.
     * @param unsubscribe The callback to execute when the `unsubscribe()` method is called.
     */
    export function create(unsubscribe: () => void): CancelSubscription;
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

export declare namespace CancelableSource {
    export import cancelSignal = Cancelable.cancelSignal;
    export import isCancelable = Cancelable.isCancelable;
    export const cancel: unique symbol;
    /**
     * Determines whether a value is a `CancelableSource` object.
     */
    export function isCancelableSource(value: unknown): value is CancelableSource;
}

export declare class CancelError extends Error {
    constructor(message?: string);
}
```
