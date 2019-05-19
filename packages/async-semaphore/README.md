# `@esfx/async-semaphore`

The `@esfx/async-semaphore` package provides the Semaphore class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-semaphore
```

# Usage

```ts
import { Semaphore } from "@esfx/async-semaphore";

// create a semaphore that allows one participant
const semaphore = new Semaphore(1);

async function updateResource(updates) {
    // Wait for a lock on the semaphore
    await semaphore.wait();
    try {
        // Between the 'wait' above and the 'release' below,
        // this function has exclusive access to a resource...

        // Await something async, allowing other logic to 
        // execute. If some other event/timer/etc. calls
        // 'updateResource' before this async operation
        // finishes, they will be blocked at the 'wait' above.
        await doSomethingAsync();

        // We still have exclusive access even after resuming,
        // so we can continue to use our exclusive access.
    }
    finally {
        // Release the semaphore. The next waiter will
        // be unblocked and will have the lock instead.
        semaphore.release();
    }
}
```

# API

```ts
import { Cancelable } from "@esfx/cancelable";
/**
 * Limits the number of asynchronous operations that can access a resource
 * or pool of resources.
 */
export declare class Semaphore {
    /**
     * Initializes a new instance of the Semaphore class.
     *
     * @param initialCount The initial number of entries.
     * @param maxCount The maximum number of entries.
     */
    constructor(initialCount: number, maxCount?: number);
    /**
     * Gets the number of remaining asynchronous operations that can enter
     * the Semaphore.
     */
    readonly count: number;
    /**
     * Asynchronously waits for the event to become signaled.
     *
     * @param cancelable An optional Cancelable used to cancel the request.
     */
    wait(cancelable?: Cancelable): Promise<void>;
    /**
     * Releases the Semaphore one or more times.
     *
     * @param count The number of times to release the Semaphore.
     */
    release(count?: number): void;
}
```
