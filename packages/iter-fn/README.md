# `@esfx/iter-fn`

An iteration API for ECMAScript iterables.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/iter-fn
```

# Usage

```ts
import { map, filter } from "@esfx/iter-fn";

// nested
const computerIsbns = map(filter(books, book => book.categories.includes("computers")), book => book.isbn);

// or, pipe-like
let _;
const computerIsbns = (
    _= books,
    _= filter(_, book => book.categories.includes("computers")),
    _= map(_, book => book.isbn),
    _);

// or, with actual pipes (if you are using a transpiler with support for Hack-style)
const computerIsbns = books
    |> filter(%, book => book.categories.includes("computers")),
    |> map(%, book => book.isbn);
```

# API

You can read more about the API [here](https://esfx.github.io/esfx/api/iter-fn.html).
