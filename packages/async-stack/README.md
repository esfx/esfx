# `@esfx/async-stack`

The `@esfx/async-stack` package provides the `AsyncStack` class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-stack
```

# Usage

```ts
import { AsyncStack } from "@esfx/async-stack";

async function main() {
    const stack = new AsyncStack();

    // push two items on the stack
    stack.push(1);
    stack.push(2);

    // take two items from the stack
    await stack.pop(); // 2
    await stack.pop(); // 1

    // take two more pending items from the stack
    const p3 = stack.get();
    const p4 = stack.get();

    // put two more items on the stack
    stack.put(3);
    stack.put(4);

    await p3; // 3
    await p4; // 4
}
```

# API

```ts
import { Cancelable } from "@esfx/cancelable";

/**
 * An asynchronous Stack.
 */
export declare class AsyncStack<T> {
    /**
     * Initializes a new instance of the AsyncStack class.
     * @param iterable An optional iterable of values or promises.
     */
    constructor(iterable?: Iterable<T | PromiseLike<T>>);
    /**
     * Gets a value indicating whether new items can be added to the stack.
     */
    readonly writable: boolean;
    /**
     * Gets a value indicating whether items can be read from the stack.
     */
    readonly readable: boolean;
    /**
     * Gets a value indicating whether the stack has ended and there are no more items available.
     */
    readonly done: boolean;
    /**
     * Gets the number of entries in the stack.
     * When positive, indicates the number of entries available to get.
     * When negative, indicates the number of requests waiting to be fulfilled.
     */
    readonly size: number;
    /**
     * Removes and returns a Promise for the top value of the stack. If the stack is empty,
     * returns a Promise for the next value to be pushed on to the stack.
     * @param cancelable A Cancelable used to cancel the request.
     */
    pop(cancelable?: Cancelable): Promise<T>;
    /**
     * Adds a value to the top of the stack. If the stack is empty but has a pending
     * pop request, the value will be popped and the request fulfilled.
     */
    push(this: AsyncStack<void>): void;
    /**
     * Adds a value to the top of the stack. If the stack is empty but has a pending
     * pop request, the value will be popped and the request fulfilled.
     * @param value A value or promise to add to the stack.
     */
    push(value: T | PromiseLike<T>): void;
    /**
     * Blocks attempts to read from the stack until it is empty. Available items in the stack
     * can still be read until the stack is empty.
     */
    doneReading(): void;
    /**
     * Blocks attempts to write to the stack. Pending requests in the stack can still be
     * resolved until the stack is empty.
     */
    doneWriting(): void;
    /**
     * Blocks future attempts to read or write from the stack. Available items in the stack
     * can still be read until the stack is empty. Pending reads from the stack are rejected
     * with a `CancelError`.
     */
    end(): void;
}
```
