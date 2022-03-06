---
uid: '@esfx/async-delay!'
---
The `@esfx/async-delay` package provides the @"@esfx/async-delay!delay:function(1)" function.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/async-delay
```

# Usage

## [TypeScript](#tab/ts)
```ts
import { delay } from "@esfx/async-delay";

async function doSomeAction() {
    // wait 10 seconds
    await delay(10 * 1000);
}
```

## [JavaScript (CommonJS)](#tab/js)
```js
const { delay } = require("@esfx/async-delay");

async function doSomeAction() {
    // wait 10 seconds
    await delay(10 * 1000);
}
```

***
