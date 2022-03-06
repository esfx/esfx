---
uid: '@esfx/threading-spinwait!'
---

Provides the @"@esfx/threading-spinwait!SpinWait:class" class, a thread synchronization primitive for use with Workers.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/threading-spinwait
```

# Usage

## [TypeScript](#tab/ts)
```ts
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { SpinWait } from "@esfx/threading-spinwait";
import { StructType, int32 } from "@esfx/struct-type";

const SharedData = StructType([
    { name: "ready", type: int32 },
] as const);

function worker_thread() {
    const data = new SharedData(workerData);

    // do some long running process...

    // signal that the work has completed.
    data.ready = 1;
}

function main() {
    const data = new SharedData(/*shared*/ true);
    const worker = new Worker(__filename, { workerData: data.buffer });

    // start spinning until the condition is met.
    // this results in the thread sleeping periodically
    // while it waits for the condition.
    const spinWait = new SpinWait();
    spinWait.spinUntil(() => data.ready === 1);
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
const { SpinWait } = require("@esfx/threading-spinwait");
const { StructType, int32 } = require("@esfx/struct-type");

const SharedData = StructType([
    { name: "ready", type: int32 },
]);

function worker_thread() {
    const data = new SharedData(workerData);

    // do some long running process...

    // signal that the work has completed.
    data.ready = 1;
}

function main() {
    const data = new SharedData(/*shared*/ true);
    const worker = new Worker(__filename, { workerData: data.buffer });

    // start spinning until the condition is met.
    // this results in the thread sleeping periodically
    // while it waits for the condition.
    const spinWait = new SpinWait();
    spinWait.spinUntil(() => data.ready === 1);
}

if (isMainThread) {
    main();
}
else {
    worker_thread();
}
```

***
