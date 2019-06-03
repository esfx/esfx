---
uid: async-stack
---

The `@esfx/async-stack` package provides the @"async-stack.AsyncStack" class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/async-stack
```

# Usage

## [TypeScript](#tab/ts)
```ts
import { AsyncStack } from "@esfx/async-stack";

async function main() {
    const stack = new AsyncStack<number>();

    // push two items on the stack
    stack.push(1);
    stack.push(Promise.resolve(2));

    // take two items from the stack
    await stack.pop(); // 2
    await stack.pop(); // 1

    // take two more pending items from the stack
    const p3 = stack.get();
    const p4 = stack.get();

    // put two more items on the stack
    stack.put(3);
    stack.put(4);

    await p3; // 3
    await p4; // 4
}
```

## [JavaScript (CommonJS)](#tab/js)
```js
const { AsyncStack } = require("@esfx/async-stack");

async function main() {
    const stack = new AsyncStack();

    // push two items on the stack
    stack.push(1);
    stack.push(Promise.resolve(2));

    // take two items from the stack
    await stack.pop(); // 2
    await stack.pop(); // 1

    // take two more pending items from the stack
    const p3 = stack.get();
    const p4 = stack.get();

    // put two more items on the stack
    stack.put(3);
    stack.put(4);

    await p3; // 3
    await p4; // 4
}
```

***