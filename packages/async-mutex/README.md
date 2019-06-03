# `@esfx/async-mutex`

Provides `AsyncMutex`, an async coordination primitive.

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
import { AsyncMutex } from "@esfx/async-mutex";

const m = new AsyncMutex();
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

You can read more about the API [here](https://esfx.js.org/esfx/api/async-mutex.html).
