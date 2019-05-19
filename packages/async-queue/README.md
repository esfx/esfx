# `@esfx/async-queue`

The `@esfx/async-queue` package provides the `AsyncQueue` class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-queue
```

# Usage

```ts
import { AsyncQueue } from "@esfx/async-queue";

async function main() {
    const queue = new AsyncQueue();

    // put two items on the queue
    queue.put(1);
    queue.put(2);

    // take two items from the queue
    await queue.get(); // 1
    await queue.get(); // 2

    // take two more pending items from the queue
    const p3 = queue.get();
    const p4 = queue.get();

    // put two more items on the queue
    queue.put(3);
    queue.put(4);

    await p3; // 3
    await p4; // 4
}
```

# API

```ts
import { Cancelable } from "@esfx/cancelable";
/**
 * An asynchronous queue.
 */
export declare class AsyncQueue<T> {
    /**
     * Initializes a new instance of the AsyncQueue class.
     *
     * @param iterable An optional iterable of values or promises.
     */
    constructor(iterable?: Iterable<T | PromiseLike<T>>);
    /**
     * Gets a value indicating whether new items can be added to the queue.
     */
    readonly writable: boolean;
    /**
     * Gets a value indicating whether items can be read from the queue.
     */
    readonly readable: boolean;
    /**
     * Gets a value indicating whether the queue has ended and there are no more items available.
     */
    readonly done: boolean;
    /**
     * Gets the number of entries in the queue.
     * When positive, indicates the number of entries available to get.
     * When negative, indicates the number of requests waiting to be fulfilled.
     */
    readonly size: number;
    /**
     * Removes and returns a `Promise` for the first value in the queue. If the queue is empty,
     * returns a `Promise` for the next value to be added to the queue.
     *
     * @param cancelable A `Cancelable` used to cancel the request.
     */
    get(cancelable?: Cancelable): Promise<T>;
    /**
     * Adds a value to the end of the queue. If the queue is empty but has a pending
     * dequeue request, the value will be dequeued and the request fulfilled.
     *
     * @param value A value or promise to add to the queue.
     */
    put(value: T | PromiseLike<T>): void;
    /**
     * Adds a value to the end of the queue. If the queue is empty but has a pending
     * dequeue request, the value will be dequeued and the request fulfilled.
     */
    put(this: AsyncQueue<void>): void;
    /**
     * Blocks attempts to read from the queue until it is empty. Available items in the queue
     * can still be read until the queue is empty.
     */
    doneReading(): void;
    /**
     * Blocks attempts to write to the queue. Pending requests in the queue can still be
     * resolved until the queue is empty.
     */
    doneWriting(): void;
    /**
     * Blocks future attempts to read or write from the queue. Available items in the queue
     * can still be read until the queue is empty. Pending reads from the queue are rejected
     * with a `CancelError`.
     */
    end(): void;
}
```
