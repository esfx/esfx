# `@esfx/async-stack`

The `@esfx/async-stack` package provides the `AsyncStack` class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-stack
```

# Usage

```ts
import { AsyncStack } from "@esfx/async-stack";

async function main() {
    const stack = new AsyncStack();

    // push two items on the stack
    stack.push(1);
    stack.push(2);

    // take two items from the stack
    await stack.pop(); // 2
    await stack.pop(); // 1

    // take two more pending items from the stack
    const p3 = stack.pop();
    const p4 = stack.pop();

    // put two more items on the stack
    stack.put(3);
    stack.put(4);

    await p3; // 3
    await p4; // 4
}
```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/async-stack.html).
