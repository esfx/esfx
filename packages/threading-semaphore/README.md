# `@esfx/threading-semaphore`

Provides `Semaphore`, a thread synchronization primitive for use with Workers.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/threading-semaphore
```

# Usage

```ts
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { Semaphore } from "@esfx/threading-semaphore";
import { StructType, int32 } from "@esfx/struct-type";
import { sleep } from "@esfx/threading-sleep";

const SharedData = StructType([
    { name: "running", type: int32 },
]);

function worker_thread() {
    const sem = new Semaphore(workerData[0]);

    while (true) {
        // wait until the thread can enter the semaphore
        sem.wait();

        // do work inside the semaphore...

        // release this worker's spot
        sem.release();

        // do work outside the semaphore...
    }
}

function main() {
    // create a semaphore that allows 5 workers to enter at once
    const sem = new Semaphore(5);

    // start 10 workers
    for (let i = 0; i < 10; i++) {
        new Worker(__filename, { workerData: [sem.buffer] });
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

You can read more about the API [here](https://esfx.github.io/esfx/modules/threading_semaphore.html).
