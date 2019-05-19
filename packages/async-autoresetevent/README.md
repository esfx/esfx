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
    while (true) {
        // do some work asynchronously...

        // indicate 'waitForActivity' can resume. Event is immediately reset to 
        // the signaled state.
        event.set();
    }
}

async function waitForActivity() {
    while (true) {
        // wait for 'doSomeActivity' to set the event...
        await event.wait();

        // do something asynchronous...
    }
}

doSomeActivity();
waitForActivity();
```

# API

```ts
import { Cancelable } from "@esfx/cancelable";

/**
 * Represents a synchronization event that, when signaled, resets automatically after releasing a
 * single waiting asynchronous operation.
 */
export declare class AutoResetEvent {
    /**
     * Initializes a new instance of the AutoResetEvent class.
     * @param initialState A value indicating whether to set the initial state to signaled.
     */
    constructor(initialState?: boolean);
    /**
     * Sets the state of the event to signaled, resolving at most one waiting Promise.
     * The event is then automatically reset.
     * @returns `true` if the operation successfully resolved a waiting Promise; otherwise, `false`.
     */
    set(): boolean;
    /**
     * Sets the state of the event to nonsignaled, causing asynchronous operations to pause.
     */
    reset(): void;
    /**
     * Asynchronously waits for the event to become signaled.
     * @param cancelable A Cancelable used to cancel the request.
     */
    wait(cancelable?: Cancelable): Promise<void>;
}
```
