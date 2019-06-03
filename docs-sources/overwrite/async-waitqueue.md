---
uid: async-waitqueue
---

The `@esfx/async-waitqueue` package provides the @"async-waitqueue.WaitQueue" class, an async coordination primitive used to queue and resolve promises.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/async-waitqueue
```

# Usage

## [TypeScript](#tab/ts)
```ts
import { WaitQueue } from "@esfx/async-waitqueue";

async function main() {
    const queue = new WaitQueue<number>();

    // Create two pending "waiters" in the queue
    const p1 = queue.wait();
    const p2 = queue.wait();

    // Resolve the two pending "waiters" in the queue
    queue.resolveOne(1);
    queue.resolveOne(Promise.resolve(2));

    await p1; // 1
    await p2; // 2
}
```

## [JavaScript (CommonJS)](#tab/js)
```js
const { WaitQueue } = require("@esfx/async-waitqueue");

async function main() {
    const queue = new WaitQueue();

    // Create two pending "waiters" in the queue
    const p1 = queue.wait();
    const p2 = queue.wait();

    // Resolve the two pending "waiters" in the queue
    queue.resolveOne(1);
    queue.resolveOne(Promise.resolve(2));

    await p1; // 1
    await p2; // 2
}
```

***