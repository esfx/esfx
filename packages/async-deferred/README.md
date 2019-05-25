# `@esfx/async-deferred`

The `@esfx/async-deferred` package provides the `Deferred` class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-deferred
```

# Usage

```ts
import { Deferred } from "@esfx/async-deferred";

const deferred = new Deferred();

// to resolve the deferred:
deferred.resolve(value);

// to reject the deferred:
deferred.reject(error);

// get the promise for the deferred:
deferred.promise;
```

# API

You can read more about the API [here](https://esfx.github.io/esfx/modules/async_deferred.html).
