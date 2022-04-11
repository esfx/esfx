# `@esfx/cancelable`

The `@esfx/cancelable` package provides a low-level Symbol-based API for defining a common cancellation protocol.

> NOTE: This package does not contain an *implementation* of cancellation signals, but rather provides only a
> protocol for interoperable libraries that depend on cancellation.
>
> For an implementation of this protocol, please consider the following packages:
> - [`@esfx/canceltoken`](../canceltoken#readme)
> - [`@esfx/cancelable-dom`](../cancelable-dom#readme)
> - [`@esfx/cancelable-dom-shim`](../cancelable-dom-shim#readme)
> - [`prex`](https://github.com/rbuckton/prex#readme) (version 0.4.6 or later)

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/cancelable
```

# Usage

```ts
import { Cancelable } from "@esfx/cancelable";

function doSomeWork(cancelable: Cancelable) {
    return new Promise((resolve, reject) => {
        const cancelSignal = cancelable[Cancelable.cancelSignal]();
        if (cancelSignal.signaled) throw new Error("Operation canceled.");

        const child = fork("worker.js");
        const subscription = cancelSignal.subscribe(() => {
            // cancellation requested, abort worker
            worker.kill();
            reject(new Error("Operation canceled."));
        });

        worker.on("exit", () => {
            subscription.unsubscribe();
            resolve();
        });
    });
}
```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/cancelable.html).
