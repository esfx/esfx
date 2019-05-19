 
# `@esfx/async-conditionvariable`

Provides `ConditionVariable`, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-conditionvariable
```

# Usage

```ts
import { ConditionVariable } from "@esfx/async-conditionvariable";
import { Mutex } from "@esfx/async-mutex";

// create a mutex used to lock a resource
const m = new Mutex();

// create a condition variable to maintain a list of waiters for a resource
const cv = new ConditionVariable();

let tasks = getTasksToPerform(); // get some array of tasks to perform.
let ready = false;
let currentTask;
let taskResult;

async function worker() {
    // pause worker until we can acquire a lock on 'm'.
    const lk = await m.lock();
    try {
        // pause execution and release the lock on 'm' until we are ready.
        await cv.wait(lk, () => ready);

        while (ready) {
            // pause execution and release the lock on 'm' until we are notified
            await cv.wait(lk);

            // We should now have the lock again for 'm', so do more work...
            taskResult = await currentTask();
        }
    }
    finally {
        lk.unlock();
    }
}

async function main() {
    const pWorker = worker(); // start the worker
    let task;
    // get the next task to perform
    while (task = tasks.shift()) {
        // pause main until we can acquire a lock on 'm'.
        let lk = await m.lock();
        try {
            currentTask = task;
        }
        finally {
            lk.unlock();
        }

        cv.notifyOne();

        // pause main until we can acquire a lock on 'm'.
        lk = await m.lock();
        try {
            // we should now have the lock again for 'm', so process the result...
            console.log(taskResult);
        }
        finally {
            lk.unlock();
        }
    }
}

main().catch(e => console.error(e));
```

# API

```ts
import { AsyncLockable } from "@esfx/async-lockable";
import { Cancelable } from "@esfx/cancelable";
export declare class ConditionVariable {
    /**
     * Releases `lock`, waiting until notified before reacquiring `lock`.
     * @param lock An `AsyncLockable` to release and reacquire.
     * @param cancelable A `Cancelable` object that can be used to cancel the request.
     */
    wait(lock: AsyncLockable, cancelable?: Cancelable): Promise<void>;
    /**
     * Releases `lock`, waiting until notified before reacquiring `lock`.
     * @param lock An `AsyncLockable` to release and reacquire.
     * @param condition When specified, loops until `condition` returns `true`.
     * @param cancelable A `Cancelable` object that can be used to cancel the request.
     */
    wait(lock: AsyncLockable, condition?: () => boolean, cancelable?: Cancelable): Promise<void>;
    /**
     * Notifies one waiter to reacquire its lock.
     */
    notifyOne(): void;
    /**
     * Notifies all current waiters to reacquire their locks.
     */
    notifyAll(): void;
}
```

