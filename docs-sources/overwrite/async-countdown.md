---
uid: '@esfx/async-countdown!'
---

The `@esfx/async-countdown` package provides the @"@esfx/async-countdown!AsyncCountdownEvent:class" class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/async-countdown
```

# Usage

## [TypeScript](#tab/ts)
```ts
import { AsyncCountdownEvent } from "@esfx/cancelable";

async function main() {
    // create an AsyncCountdownEvent with 4 participants
    const countdown = new AsyncCountdownEvent(4);
    
    const worker = async () => {
        // dome some work async...

        // signal completion
        countdown.signal();
    }

    // start 4 workers
    worker();
    worker();
    worker();
    worker();

    // wait for all 4 workers to signal completion...
    await countdown.wait();
}

main().catch(e => console.error(e));
```

## [JavaScript (CommonJS)](#tab/js)
```js
const { AsyncCountdownEvent } = require("@esfx/cancelable");

async function main() {
    // create an AsyncCountdownEvent with 4 participants
    const countdown = new AsyncCountdownEvent(4);
    
    const worker = async () => {
        // dome some work async...

        // signal completion
        countdown.signal();
    }

    // start 4 workers
    worker();
    worker();
    worker();
    worker();

    // wait for all 4 workers to signal completion...
    await countdown.wait();
}

main().catch(e => console.error(e));
```

***