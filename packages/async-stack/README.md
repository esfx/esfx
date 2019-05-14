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
     *
     * @param iterable An optional iterable of values or promises.
     */
    constructor(iterable?: Iterable<T | PromiseLike<T>>);
    /**
     * Gets the number of entries in the stack.
     * When positive, indicates the number of entries available to get.
     * When negative, indicates the number of requests waiting to be fulfilled.
     */
    readonly size: number;
    /**
     * Adds a value to the top of the stack. If the stack is empty but has a pending
     * pop request, the value will be popped and the request fulfilled.
     *
     * @param value A value or promise to add to the stack.
     */
    push(value: T | PromiseLike<T>): void;
    /**
     * Removes and returns a Promise for the top value of the stack. If the stack is empty,
     * returns a Promise for the next value to be pushed on to the stack.
     *
     * @param cancelable A Cancelable used to cancel the request.
     */
    pop(cancelable?: Cancelable): Promise<T>;
}
```
