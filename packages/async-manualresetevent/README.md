# `@esfx/async-manualresetevent`

The `@esfx/async-manualresetevent` package provides the `ManualResetEvent` class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-manualresetevent
```

# Usage

```ts
import { ManualResetEvent } from "@esfx/async-manualresetevent";

const event = new ManualResetEvent();

async function doSomeActivity() {
    // do some work asynchronously...

    // signal completion of the activity
    event.set();
}

async function doSomeOtherActivity() {
    // do some work asynchronously...

    // wait for 'doSomeActivity' to finish
    await event.wait();

    // keep working now that both activities have synchronized...
}

// start some work
doSomeActivity();

// start some other work
doSomeOtherActivity();
```

# API

```ts
import { Cancelable } from "@esfx/cancelable";
/**
 * Asynchronously notifies one or more waiting Promises that an event has occurred.
 */
export declare class ManualResetEvent {
    /**
     * Initializes a new instance of the ManualResetEvent class.
     *
     * @param initialState A value indicating whether to set the initial state to signaled.
     */
    constructor(initialState?: boolean);
    /**
     * Gets a value indicating whether the event is signaled.
     */
    readonly isSet: boolean;
    /**
     * Sets the state of the event to signaled, resolving one or more waiting Promises.
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
