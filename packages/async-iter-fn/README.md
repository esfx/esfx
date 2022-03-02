# `@esfx/async-iter-fn`

An fp-style async iteration API for ECMAScript iterables.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-iter-fn
```

# Usage

```ts
import { mapAsync, filterAsync } from "@esfx/async-iter-fn";

// nested
const computerIsbns = mapAsync(filterAsync(books, book => book.categories.includes("computers")), book => book.isbn);

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

# API

You can read more about the API [here](https://esfx.github.io/esfx/api/async-iter-fn.html).
