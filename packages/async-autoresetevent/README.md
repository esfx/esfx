# `@esfx/async-autoresetevent`

The `@esfx/async-autoresetevent` package provides the `AutoResetEvent` class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-autoresetevent
```

# Usage

```ts
import { AutoResetEvent } from "@esfx/async-autoresetevent";

const event = new AutoResetEvent();

async function doSomeActivity() {
    // do some work asynchronously...

    // indicate continuous work can resume
    event.set();

    // do some more work asynchronously...

    // indicate continuous work can resume
    event.set();
}

async function doSomeActivityContinuously() {
    while (true) {
        // wait for 'doSomeActivity' to set the event...
        await event.wait();

        // do something asynchronous...
    }
}

doSomeActivityContinuously();
doSomeActivity();
```

# API

```ts
import { Cancelable } from "@esfx/cancelable";
/**
 * Asynchronously notifies one or more waiting Promises that an event has occurred.
 */
export declare class AutoResetEvent {
    private _signaled;
    private _waiters;
    /**
     * Initializes a new instance of the AutoResetEvent class.
     *
     * @param initialState A value indicating whether to set the initial state to signaled.
     */
    constructor(initialState?: boolean);
    /**
     * Sets the state of the event to signaled, resolving one or more waiting Promises.
     * The event is then automatically reset.
     */
    set(): void;
    /**
     * Sets the state of the event to nonsignaled, causing asynchronous operations to pause.
     */
    reset(): void;
    /**
     * Asynchronously waits for the event to become signaled.
     *
     * @param cancelable A Cancelable used to cancel the request.
     */
    wait(cancelable?: Cancelable): Promise<void>;
}
```
