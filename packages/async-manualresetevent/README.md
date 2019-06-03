# `@esfx/async-manualresetevent`

The `@esfx/async-manualresetevent` package provides the `AsyncManualResetEvent` class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-manualresetevent
```

# Usage

```ts
import { AsyncManualResetEvent } from "@esfx/async-manualresetevent";

const event = new AsyncManualResetEvent();

async function doSomeActivity() {
    // do some work asynchronously...

    // signal completion of the activity
    event.set();
}

async function doSomeOtherActivity() {
    // do some work asynchronously...

    // wait for 'doSomeActivity' to finish
    await event.wait();

    // keep working now that both activities have synchronized...
}

// start some work
doSomeActivity();

// start some other work
doSomeOtherActivity();
```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/async-manualresetevent.html).
