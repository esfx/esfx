---
uid: threading-sleep
---

Provides the @"threading-sleep.sleep" function which causes the current execution thread to sleep until the timeout expires.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/threading-sleep
```

# Usage

## [TypeScript](#tab/ts)
```ts
import { sleep } from "@esfx/threading-sleep";

// block the main thread for half a second
sleep(500);
```

## [JavaScript](#tab/js)
```js
const { sleep } = require("@esfx/threading-sleep");

// block the main thread for half a second
sleep(500);
```

***
