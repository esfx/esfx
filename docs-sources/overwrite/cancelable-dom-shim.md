---
uid: '@esfx/cancelable-dom-shim!'
---

The `@esfx/cancelable-dom-shim` package provides a global shim to make the DOM @"@esfx/AbortController!" and @"@esfx/AbortSignal!" classes compatible with @"@esfx/cancelable!".

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/cancelable-dom-shim
```

# Usage

The global shim adds a default implementation the collection interfaces to the following global DOM objects:

- @"@esfx/AbortController!" implements:
  - @"@esfx/cancelable!CancelableSource:interface"
  - @"@esfx/cancelable!Cancelable:interface"
- @"@esfx/AbortSignal!" implements:
  - @"@esfx/cancelable!Cancelable:interface"

To install the global shim, import `@esfx/cancelable/global`:

## [TypeScript](#tab/ts)
```ts
import "@esfx/cancelable-dom-shim"; // triggers global-scope side effects
import { Cancelable } from "@esfx/cancelable";

const abortController = new AbortController();
const signal = abortController[Cancelable.cancelSignal]();
```

## [JavaScript (CommonJS)](#tab/js)
```js
require("@esfx/cancelable-dom-shim"); // triggers global-scope side effects
const { Cancelable } = require("@esfx/cancelable");

const abortController = new AbortController();
const signal = abortController[Cancelable.cancelSignal]();
```

***
