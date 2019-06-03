# `@esfx/async-lazy`

Lazy-initialized asynchronous value.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-lazy
```

# Usage

```ts
import { AsyncLazy } from "@esfx/async-lazy";

async function main() {
    // lazy initialize an object
    const lazy1 = new AsyncLazy(() => new SomeObject());
    lazy1.isStarted; // false
    const p1 = lazy1.value; // Promise {}
    lazy1.isStarted; // true
    await p1; // SomeObject {}

    // lazy initialize with arguments
    const lazy2 = Lazy.from(
        async (a, b) => (await a) + (await b),
        Promise.resolve(1),
        Promise.resolve(2));
    lazy2.isStarted; // false
    const p2 = lazy2.value; // Promise {}
    lazy2.isStarted; // true
    await p2; // 3

    // initialized "lazy"
    const lazy3 = Lazy.for(Promise.resolve("test"));
    lazy3.isStarted; // true
    await lazy3.value; // "test"
}

main().catch(e => console.error(e));
```

# API

You can read more about the API [here](https://esfx.github.io/esfx/api/async-lazy.html).
