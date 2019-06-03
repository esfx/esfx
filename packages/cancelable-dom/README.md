# `@esfx/cancelable-dom`

The `@esfx/cancelable-dom` package provides a DOM interop library for `@esfx/cancelable`.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/cancelable-dom
```

# Usage

```ts
import { Cancelable } from "@esfx/cancelable";
import { toAbortSignal } from "@esfx/cancelable-dom";

async function doSomeWork(cancelable: Cancelable) {
    await fetch("some/uri", { signal: toAbortSignal(cancelable) });
}
```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/cancelable-dom.html).
