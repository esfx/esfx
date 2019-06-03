# `@esfx/threading-manualresetevent`

Provides `ManualResetEvent`, a threading primitive for use with Workers.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/threading-manualresetevent
```

# Usage

```ts
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { createInterface } from "readline";
import { ManualResetEvent } from "@esfx/threading-manualresetevent";
import { sleep } from "@esfx/threading-sleep";

function worker_thread() {
    const mre = new ManualResetEvent(workerData);
    let count = 0;
    while (true) {
        mre.wait(); // wait until signaled
        console.log(`counter: ${count++}`);
        sleep(500);
    }
}

function main() {
    const mre = new ManualResetEvent();
    const worker = new Worker(__filename, { workerData: mre.buffer, stdout: true });
    worker.stdout.pipe(process.stdout);

    console.log("Press ENTER to start counter:");
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.on("line", () => {
        if (mre.isSet) {
            mre.reset();
            console.log("Press ENTER to start counter:");
        }
        else {
            console.log("Press ENTER to stop counter:");
            mre.set();
        }
    });
}

if (isMainThread) {
    main();
}
else {
    worker_thread();
}
```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/threading-manualresetevent.html).
