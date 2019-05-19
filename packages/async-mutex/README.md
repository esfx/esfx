# `@esfx/async-mutex`

Provides `Mutex`, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-mutex
```

# Usage

```ts
import { Mutex } from "@esfx/async-mutex";

const m = new Mutex();
let counter = 0;

async function worker() {
    for (let i = 0; i < 3; i++) {
        // get exclusive access to 'm', which protects 'counter'.
        const lk = await m.lock();
        try {
            const current = counter;

            await doSomethingElse();

            // we still have exclusive access to 'm', which protects 'counter'.
            counter = current + 1;
        }
        finally {
            // release the lock
            lk.unlock();
        }
    }
}

async function main() {
    // start two workers that share a resource
    await Promise.all([worker(), worker()]);

    counter; // 6
}

```

# API

```ts
import { AsyncLockable, LockHandle } from "@esfx/async-lockable";
import { Cancelable } from "@esfx/cancelable";
/**
 * An async coordination primitive used to coordinate access to a protected resource.
 */
export declare class Mutex implements AsyncLockable {
    /**
     * Indicates whether the lock has been taken.
     */
    readonly lockTaken: boolean;
    /**
     * Asynchronously waits for the lock to become available and then takes the lock.
     * @param cancelable A `Cancelable` used to cancel the pending request.
     */
    lock(cancelable?: Cancelable): Promise<LockHandle<Mutex>>;
    /**
     * Synchronously tries to take a lock.
     */
    tryLock(): boolean;
    /**
     * Releases the lock.
     */
    unlock(): boolean;
    [AsyncLockable.lock](cancelable?: Cancelable): Promise<LockHandle<Mutex>>;
    [AsyncLockable.unlock](): void;
}
```

