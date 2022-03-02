# `@esfx/iter-query`

An iteration and query API for ECMAScript iterables.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/iter-query
```

# Usage

```ts
// TypeScript
import { Query } from "@esfx/iter-query";

// JavaScript (CommonJS)
const { Query } = require("@esfx/iter-query");

let q = Query
  .from(books)
  .filter(book => book.author === "Alice")
  .groupBy(book => book.releaseYear);
```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/iter-query.html).
