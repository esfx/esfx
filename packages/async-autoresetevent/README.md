The `@esfx/async-autoresetevent` package provides the `AsyncAutoResetEvent` class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-autoresetevent
```

# Usage

```ts
import { AsyncAutoResetEvent } from "@esfx/async-autoresetevent";

const event = new AsyncAutoResetEvent();

async function doSomeActivity() {
    while (true) {
        // do some work asynchronously...

        // indicate 'waitForActivity' can resume. Event is immediately reset to
        // the unsignaled state.
        event.set();
    }
}

async function waitForActivity() {
    while (true) {
        // wait for 'doSomeActivity' to set the event...
        await event.wait();

        // do something asynchronous...
    }
}

doSomeActivity();
waitForActivity();
```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/async-autoresetevent.html).
