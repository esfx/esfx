# `@esfx/async-waitqueue`

The `@esfx/async-waitqueue` package provides the `WaitQueue` class, an async coordination primitive used to queue and resolve promises.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-waitqueue
```

# Usage

```ts
import { WaitQueue } from "@esfx/async-waitqueue";

async function main() {
    const queue = new WaitQueue();

    // Create two pending "waiters" in the queue
    const p1 = queue.wait();
    const p2 = queue.wait();

    // Resolve the two pending "waiters" in the queue
    queue.resolveOne(1);
    queue.resolveOne(2);

    await p1; // 1
    await p2; // 2
}
```

# API

```ts
import { Cancelable } from "@esfx/cancelable";

/**
 * An async coordination primitive that provides a queue of Promises.
 */
export declare class WaitQueue<T> {
    /**
     * Gets the number of pending entries in the queue.
     */
    readonly size: number;
    /**
     * Returns a `Promise` for the next value to be added to the queue.
     * @param cancelable A `Cancelable` used to cancel the request.
     */
    wait(cancelable?: Cancelable): Promise<T>;
    /**
     * Resolves a pending `wait()` operation with the provided value.
     * @returns `true` if a pending `wait()` operation was resolved; otherwise, `false`.
     */
    resolveOne(value: T | PromiseLike<T>): boolean;
    /**
     * Resolves all pending `wait()` operations with the provided value.
     * @returns The number of pending `wait()` operations that were resolved.
     */
    resolveAll(value: T | PromiseLike<T>): number;
    /**
     * Rejects the next pending `wait()` operation with the provided reason.
     * @returns `true` if a pending `wait()` operation was rejected; otherwise, `false`.
     */
    rejectOne(reason: unknown): boolean;
    /**
     * Rejects all pending `wait()` operations with the provided reason.
     * @returns The number of pending `wait()` operations that were rejected.
     */
    rejectAll(reason: unknown): number;
    /**
     * Rejects the next pending `wait()` operation with a `CancelError`.
     * @returns `true` if a pending `wait()` operation was rejected; otherwise, `false`.
     */
    cancelOne(): boolean;
    /**
     * Rejects all pending `wait()` operations with a `CancelError`.
     * @returns The number of pending `wait()` operations that were rejected.
     */
    cancelAll(): number;
}
```
