# `@esfx/async-waitqueue`

The `@esfx/async-waitqueue` package provides the `WaitQueue` class, an async coordination primitive used to queue and resolve promises.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-waitqueue
```

# Usage

```ts
import { WaitQueue } from "@esfx/async-waitqueue";

async function main() {
    const queue = new WaitQueue();

    // Create two pending "waiters" in the queue
    const p1 = queue.wait();
    const p2 = queue.wait();

    // Resolve the two pending "waiters" in the queue
    queue.resolveOne(1);
    queue.resolveOne(2);

    await p1; // 1
    await p2; // 2
}
```

# API

You can read more about the API [here](https://esfx.github.io/esfx/modules/async_waitqueue.html).
