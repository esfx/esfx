# `@esfx/async-countdown`

The `@esfx/async-countdown` package provides the `AsyncCountdownEvent` class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-countdown
```

# Usage

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

# API

You can read more about the API [here](https://esfx.github.io/esfx/api/async-countdown.html).
