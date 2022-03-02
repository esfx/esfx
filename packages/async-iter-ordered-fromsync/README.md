# `@esfx/async-iter-ordered-fromsync`

An API to convert an OrderedIterable into an AsyncOrderedIterable

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-iter-ordered-fromsync
```

# Usage

```ts
import { toAsyncOrderedIterable } from "@esfx/async-iter-ordered-fromsync";
import { AsyncOrderedIterable } from "@esfx/async-iter-ordered";
import { OrderedIterable } from "@esfx/iter-ordered";

async function f<T>(source: AsyncOrderdIterable<T> | OrderedIterable<T | PromiseLike<T>>) {
    const asyncIterable = toAsyncOrderedIterable(source);
    ...
}
```

# API

You can read more about the API [here](https://esfx.github.io/esfx/api/async-iter-ordered-fromsync.html).

