# `@esfx/cancelable`

The `@esfx/cancelable` package provides a low-level Symbol-based API for defining a common cancellation protocol.

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
/**
 * An object that represents a cancellation signal.
 */
export interface CancelSignal {
    /**
     * Gets a value indicating whether cancellation was signalled.
     */
    readonly signaled: boolean;
    /**
     * Subscribes to notifications for when cancellation has been requested.
     */
    subscribe(onCancellationRequested: () => void): CancelSubscription;
}
/**
 * An object used to unsubscribe from a cancellation signal.
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
export declare namespace Cancelable {
    const cancelSignal: unique symbol;
    function isCancelable(value: unknown): value is Cancelable;
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
    const cancel: unique symbol;
    function isCancelableSource(value: unknown): value is CancelableSource;
}
```
