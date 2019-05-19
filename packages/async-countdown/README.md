# `@esfx/async-countdown`

The `@esfx/async-countdown` package provides the `Countdown` class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-countdown
```

# Usage

```ts
import { CountdownEvent } from "@esfx/cancelable";

async function main() {
    // create a CountdownEvent with 4 participants
    const countdown = new CountdownEvent(4);
    
    const worker = async () => {
        // dome some work async...

        // signal completion
        countdown.signal();
    }

    // start 4 workers
    worker();
    worker();
    worker();
    worker();

    // wait for all 4 workers to signal completion...
    await countdown.wait();
}

main().catch(e => console.error(e));
```

# API

```ts
import { Cancelable } from "@esfx/cancelable";
/**
 * An event that is set when all participants have signaled.
 */
export declare class CountdownEvent {
    /**
     * Initializes a new instance of the CountdownEvent class.
     *
     * @param initialCount The initial participant count.
     */
    constructor(initialCount: number);
    /**
     * Gets the number of signals initially required to set the event.
     */
    readonly initialCount: number;
    /**
     * Gets the number of remaining signals required to set the event.
     */
    readonly remainingCount: number;
    /**
     * Increments the event's current count by one or more.
     *
     * @param count An optional count specifying the additional number of signals for which the event will wait.
     */
    add(count?: number): void;
    /**
     * Resets the remaining and initial count to the specified value, or the initial count.
     *
     * @param count An optional count specifying the number of required signals.
     */
    reset(count?: number): void;
    /**
     * Registers one or more signals with the CountdownEvent, decrementing the remaining count.
     *
     * @param count An optional count specifying the number of signals to register.
     */
    signal(count?: number): boolean;
    /**
     * Asynchronously waits for the event to become signaled.
     *
     * @param cancelable An optional Cancelable used to cancel the request.
     */
    wait(cancelable?: Cancelable): Promise<void>;
}
```
