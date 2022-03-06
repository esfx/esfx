---
uid: '@esfx/async-queue!'
---

The `@esfx/async-queue` package provides the @"@esfx/async-queue!AsyncQueue:class" class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/async-queue
```

# Usage

## [TypeScript](#tab/ts)
```ts
import { AsyncQueue } from "@esfx/async-queue";

async function main() {
    const queue = new AsyncQueue<number>();

    // put two items on the queue
    queue.put(1);
    queue.put(Promise.resolve(2));

    // take two items from the queue
    await queue.get(); // 1
    await queue.get(); // 2

    // take two more pending items from the queue
    const p3 = queue.get();
    const p4 = queue.get();

    // put two more items on the queue
    queue.put(3);
    queue.put(4);

    await p3; // 3
    await p4; // 4
}
```

## [JavaScript (CommonJS)](#tab/js)
```js
const { AsyncQueue } = require("@esfx/async-queue");

async function main() {
    const queue = new AsyncQueue();

    // put two items on the queue
    queue.put(1);
    queue.put(Promise.resolve(2));

    // take two items from the queue
    await queue.get(); // 1
    await queue.get(); // 2

    // take two more pending items from the queue
    const p3 = queue.get();
    const p4 = queue.get();

    // put two more items on the queue
    queue.put(3);
    queue.put(4);

    await p3; // 3
    await p4; // 4
}
```

***
