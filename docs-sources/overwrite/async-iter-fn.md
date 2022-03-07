---
uid: '@esfx/async-iter-fn!'
---

An iteration and query API for ECMAScript async iterables.

## Overview

* [Installation](#installation)
* [Usage](#usage)

## Installation

```sh
npm i @esfx/async-iter-fn
```

## Usage

### [TypeScript](#tab/ts)
```ts
import { mapAsync, filterAsync } from "@esfx/async-iter-fn";

// nested
const computerIsbns = mapAsync(filterAsync(books, book =>
    book.categories.includes("computers")), book => book.isbn);

// or, pipe-like
let _;
const computerIsbns = (
    _= books,
    _= filterAsync(_, book => book.categories.includes("computers")),
    _= mapAsync(_, book => book.isbn),
    _);

// or, with actual pipes (if you are using a transpiler with support for Hack-style)
const computerIsbns = books
    |> filterAsync(%, book => book.categories.includes("computers")),
    |> mapAsync(%, book => book.isbn);
```

### [JavaScript (CommonJS)](#tab/js)
```ts
const { mapAsync, filterAsync } = require("@esfx/async-iter-fn");

// nested
const computerIsbns = mapAsync(filterAsync(books, book =>
  book.categories.includes("computers")), book => book.isbn);

// or, pipe-like
let _;
const computerIsbns = (
    _= books,
    _= filterAsync(_, book => book.categories.includes("computers")),
    _= mapAsync(_, book => book.isbn),
    _);

// or, with actual pipes (if you are using a transpiler with support for Hack-style)
const computerIsbns = books
    |> filterAsync(%, book => book.categories.includes("computers")),
    |> mapAsync(%, book => book.isbn);
```

***

## API
