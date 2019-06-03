---
uid: threading-autoresetevent
---

Provides the @"threading-autoresetevent.AutoResetEvent" class, a threading primitive for use with Workers.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/threading-autoresetevent
```

# Usage

## [TypeScript](#tab/ts)
```ts
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { createInterface } from "readline";
import { AutoResetEvent } from "@esfx/threading-autoresetevent";

function worker_thread() {
    const workerReadyEvent = new AutoResetEvent(workerData[0]);
    const continueEvent = new AutoResetEvent(workerData[1]);

    // signal the main thread we are ready
    workerReadyEvent.set();

    let count = 0;
    while (true) {
        // wait for the main thread to set 'continueEvent'
        continueEvent.wait();
        parentPort.postMessage(`counter=${count++}`);
    }
}

function main() {
    // create two AutoResetEvents in the main thread
    const workerReadyEvent = new AutoResetEvent();
    const continueEvent = new AutoResetEvent();

    // create a Worker, passing the buffers of the two events
    const worker = new Worker(__filename, {
        workerData: [workerReadyEvent.buffer, continueEvent.buffer]
    });

    // wait for the worker to tell us it is ready
    workerReadyEvent.wait();

    console.log("worker is ready. Press ENTER to continue the worker...");
    worker.on("message", message => {
        console.log(`worker says: ${message}`);
    });

    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.on("line", () => {
        // event is automatically reset as soon as a single waiter is signaled
        continueEvent.set();
    });
}

if (isMainThread) {
    main();
}
else {
    worker_thread();
}
```

## [JavaScript (CommonJS)](#tab/js)
```js
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const { createInterface } = require("readline");
const { AutoResetEvent } = require("@esfx/threading-autoresetevent");

function worker_thread() {
    const workerReadyEvent = new AutoResetEvent(workerData[0]);
    const continueEvent = new AutoResetEvent(workerData[1]);

    // signal the main thread we are ready
    workerReadyEvent.set();

    let count = 0;
    while (true) {
        // wait for the main thread to set 'continueEvent'
        continueEvent.wait();
        parentPort.postMessage(`counter=${count++}`);
    }
}

function main() {
    // create two AutoResetEvents in the main thread
    const workerReadyEvent = new AutoResetEvent();
    const continueEvent = new AutoResetEvent();

    // create a Worker, passing the buffers of the two events
    const worker = new Worker(__filename, {
        workerData: [workerReadyEvent.buffer, continueEvent.buffer]
    });

    // wait for the worker to tell us it is ready
    workerReadyEvent.wait();

    console.log("worker is ready. Press ENTER to continue the worker...");
    worker.on("message", message => {
        console.log(`worker says: ${message}`);
    });

    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.on("line", () => {
        // event is automatically reset as soon as a single waiter is signaled
        continueEvent.set();
    });
}

if (isMainThread) {
    main();
}
else {
    worker_thread();
}
```

***
