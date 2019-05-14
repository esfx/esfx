# `@esfx/async-deferred`

The `@esfx/async-deferred` package provides the `Deferred` class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-deferred
```

# Usage

```ts
import { Deferred } from "@esfx/async-deferred";

const deferred = new Deferred();

// to resolve the deferred:
deferred.resolve(value);

// to reject the deferred:
deferred.reject(error);

// get the promise for the deferred:
deferred.promise;
```

# API

```ts
/**
 * Encapsulates a Promise and exposes its resolve and reject callbacks.
 */
export declare class Deferred<T> {
    /**
     * Initializes a new instance of the Deferred class.
     */
    constructor();
    /**
     * Gets the promise.
     */
    readonly promise: Promise<T>;
    /**
     * Gets the callback used to resolve the promise.
     */
    readonly resolve: (value?: T | PromiseLike<T> | undefined) => void;
    /**
     * Gets the callback used to reject the promise.
     */
    readonly reject: (reason: any) => void;
    /**
     * Gets a NodeJS-style callback that can be used to resolve or reject the promise.
     */
    readonly callback: T extends void ? (err: Error | null | undefined) => void : (err: Error | null | undefined, value: T) => void;
    /**
     * Creates a NodeJS-style callback that can be used to resolve or reject the promise with multiple values.
     */
    createCallback<A extends any[]>(selector: (...args: A) => T): (err: Error | null | undefined, ...args: A) => void;
}
```
