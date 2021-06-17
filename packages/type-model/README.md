# `@esfx/type-model`

The `@esfx/type-model` package provides a number of utility types for TypeScript.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/type-model
```

# Usage

```ts
// TypeScript
import { Diff } from "@esfx/type-model";

type A = { x: number, y: string };
type B = { x: number };
type C = Diff<A, B>; // { y: string }
```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/type-model.html).

# Test Helpers

This package also provides two helper types that can be used to test complex types:

```ts
import { Test, ExpectType } from "@esfx/type-model/test";

// test suite
type _ = [
    Test<ExpectType<Actual, Expected>> // reports a type error if `Actual` and `Expected` aren't the same type
];
```