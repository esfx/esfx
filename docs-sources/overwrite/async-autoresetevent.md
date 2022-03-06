---
uid: '@esfx/async-autoresetevent!'
---

The `@esfx/async-autoresetevent` package provides the @"@esfx/async-autoresetevent!AsyncAutoResetEvent:class" class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/async-autoresetevent
```

# Usage

## [TypeScript](#tab/ts)
```ts
import { AsyncAutoResetEvent } from "@esfx/async-autoresetevent";

const event = new AsyncAutoResetEvent();

async function doSomeActivity() {
    while (true) {
        // do some work asynchronously...

        // indicate 'waitForActivity' can resume. Event is immediately reset to
        // the signaled state.
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

## [JavaScript (CommonJS)](#tab/js)
```js
const { AsyncAutoResetEvent } = require("@esfx/async-autoresetevent");

const event = new AsyncAutoResetEvent();

async function doSomeActivity() {
    while (true) {
        // do some work asynchronously...

        // indicate 'waitForActivity' can resume. Event is immediately reset to
        // the signaled state.
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

***
