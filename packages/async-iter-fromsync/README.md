# `@esfx/async-iter-fromsync`

An API to convert an ECMAScript Iterable into an AsyncIterable.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-iter-fromsync
```

# Usage

```ts
import { toAsyncIterable } from "@esfx/async-iter-fromsync";

async function f<T>(source: AsyncIterable<T> | Iterable<T | PromiseLike<T>>) {
    const asyncIterable = toAsyncIterable(source);
    ...
}
```

# API

You can read more about the API [here](https://esfx.github.io/esfx/api/async-iter-fromsync.html).

