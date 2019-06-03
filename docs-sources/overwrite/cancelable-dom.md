---
uid: cancelable-dom
---

The `@esfx/cancelable-dom` package provides a DOM interop library for @"cancelable".

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/cancelable-dom
```

# Usage

## [TypeScript](#tab/ts)
```ts
import { Cancelable } from "@esfx/cancelable";
import { toAbortSignal } from "@esfx/cancelable-dom";

async function doSomeWork(cancelable: Cancelable) {
    await fetch("some/uri", { signal: toAbortSignal(cancelable) });
}
```

## [JavaScript (CommonJS)](#tab/js)
```js
const { Cancelable } = require("@esfx/cancelable");
const { toAbortSignal } = require("@esfx/cancelable-dom");

async function doSomeWork(cancelable) {
    await fetch("some/uri", { signal: toAbortSignal(cancelable) });
}
```

***
