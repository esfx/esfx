# `@esfx/threading-conditionvariable`

Provides `ConditionVariable`, a thread synchronization primitive for use with Workers.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/threading-conditionvariable
```

# Usage

```ts
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { Mutex } from "@esfx/threading-mutex";
import { ConditionVariable } from "@esfx/threading-conditionvariable";
import { StructType, int32 } from "@esfx/struct-type";

// NOTE: For TypeScript, the `as const` is needed in the
//       declaration below to infer the correct field names.
//       For JavaScript, remove the `as const`.
const SharedData = StructType([
    { name: "ready", type: int32 },
    { name: "processed", type: int32 },
] as const);

function worker_thread() {
    const m = new Mutex(workerData[0]);
    const cv = new ConditionVariable(workerData[1]);
    const data = new SharedData(workerData[2]);

    m.lock();
    try {
        // release the lock and wait until main() sends data
        cv.wait(m, () => data.ready === 1);

        // after waiting we once again own the lock
        console.log("worker thread is processing data");

        // send data back to main()
        data.processed = 1;
        console.log("worker thread is done");
    }
    finally {
        m.unlock();
    }

    cv.notifyOne();
}

function main() {
    const m = new Mutex();
    const cv = new ConditionVariable();
    const data = new SharedData(/*shared*/ true);

    // start the Worker, passing the buffers of the shared objects
    const worker = new Worker(__filename, {
        workerData: [m.buffer, cv.buffer, data.buffer],
        stdout: true,
    });

    // pipe stdout for console.log in worker
    worker.stdout.pipe(process.stdout);

    // send data to the worker
    m.lock();
    try {
        data.ready = 1;
        console.log("main is ready");
    }
    finally {
        m.unlock();
    }

    // notify the waiting worker
    cv.notifyOne();

    m.lock();
    try {
        // release the lock and wait for the worker to finish processing
        cv.wait(m, () => data.processed === 1);
    }
    finally {
        m.unlock();
    }
}

if (isMainThread) {
    main();
}
else {
    worker_thread();
}
```

# API

You can read more about the API [here](https://esfx.github.io/esfx/modules/threading_conditionvariable.html).
