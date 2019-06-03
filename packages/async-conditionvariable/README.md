# `@esfx/async-conditionvariable`

Provides `AsyncConditionVariable`, an async coordination primitive.

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
import { AsyncConditionVariable } from "@esfx/async-conditionvariable";
import { AsyncMutex } from "@esfx/async-mutex";

// create a mutex used to lock a resource
const m = new AsyncMutex();

// create a condition variable to maintain a list of waiters for a resource
const cv = new AsyncConditionVariable();

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

You can read more about the API [here](https://esfx.js.org/esfx/api/async-conditionvariable.html).
