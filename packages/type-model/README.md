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

See the full API [here](src/index.ts).