# `@esfx/async-iter-query`

An iteration and query API for ECMAscript async-iterables.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-iter-query
```

# Usage

```ts
// TypeScript
import { AsyncQuery } from "@esfx/async-iter-query";

// JavaScript (CommonJS)
const { AsyncQuery } = require("@esfx/async-iter-query");

let q = AsyncQuery
  .from(books)
  .filter(book => book.author === "Alice")
  .groupBy(book => book.releaseYear);
```

# API

You can read more about the API [here](https://esfx.github.io/esfx/api/async-iter-query.html).

