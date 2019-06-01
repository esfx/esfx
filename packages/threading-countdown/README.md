# `@esfx/threading-countdown`

Provides `CountdownEvent`, a thread synchronization primitive for use with Workers.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/threading-countdown
```

# Usage

```ts
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { CountdownEvent } from "@esfx/threading-countdown";

function worker_thread() {
    const countdown = new CountdownEvent(workerData);

    // do work in background...

    // signal worker is finished
    countdown.signal();
}

function main() {
    const countdown = new CountdownEvent(5);

    // start 5 workers
    for (let i = 0; i < 5; i++) {
        new Worker(__filename, { workerData: countdown.buffer });
    }

    // wait for the workers to finish
    countdown.wait();
}

if (isMainThread) {
    main();
}
else {
    worker_thread();
}
```

# API

You can read more about the API [here](https://esfx.github.io/esfx/modules/threading_countdown.html).
