---
uid: '@esfx/iter-fn!'
---

An iteration and query API for ECMAScript iterables.

## Overview

* [Installation](#installation)
* [Usage](#usage)

## Installation

```sh
npm i @esfx/iter-fn
```

## Usage

### [TypeScript](#tab/ts)
```ts
import { map } from "@esfx/iter-fn";
const x = map([1, 2, 3], x => x * 2);
x; // [2, 4, 6]
```

### [JavaScript (CommonJS)](#tab/js)
```ts
const { map } = require("@esfx/iter-fn");
const x = map([1, 2, 3], x => x * 2);
x; // [2, 4, 6]
```

***

## API
