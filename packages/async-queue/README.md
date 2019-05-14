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
     * Gets the number of entries in the queue.
     * When positive, indicates the number of entries available to get.
     * When negative, indicates the number of requests waiting to be fulfilled.
     */
    readonly size: number;
    /**
     * Adds a value to the end of the queue. If the queue is empty but has a pending
     * dequeue request, the value will be dequeued and the request fulfilled.
     *
     * @param value A value or promise to add to the queue.
     */
    put(value: T | PromiseLike<T>): void;
    /**
     * Removes and returns a Promise for the first value in the queue. If the queue is empty,
     * returns a Promise for the next value to be added to the queue.
     *
     * @param cancelable A Cancelable used to cancel the request.
     */
    get(cancelable?: Cancelable): Promise<T>;
}
```
