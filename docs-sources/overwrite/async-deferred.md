---
uid: '@esfx/async-deferred!'
---
The `@esfx/async-deferred` package provides the @"@esfx/async-deferred!Deferred:class" class, an async coordination primitive.

## Overview

* [Installation](#installation)
* [Usage](#usage)

## Installation

```sh
npm i @esfx/async-deferred
```

## Usage

### [TypeScript](#tab/ts)
```ts
import { Deferred } from "@esfx/async-deferred";

const deferred = new Deferred<number>();

// to resolve the deferred:
deferred.resolve(1);

// to reject the deferred:
deferred.reject(new Error());

// get the promise for the deferred:
deferred.promise;
```

### [JavaScript (CommonJS)](#tab/js)
```js
const { Deferred } = require("@esfx/async-deferred");

const deferred = new Deferred();

// to resolve the deferred:
deferred.resolve(1);

// to reject the deferred:
deferred.reject(new Error());

// get the promise for the deferred:
deferred.promise;
```

***

## API