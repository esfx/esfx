# `@esfx/equatable-shim`

The `@esfx/equatable-shim` package provides a  global shim that adds @esfx/equatable functionality to various ECMAScript built-ins.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/equatable-shim
```

# Usage

The global shim adds a default implementation of `Equatable` to `Object.prototype` and default implementations of 
`Comparable` to `String.prototype`, `Number.prototype`, `Boolean.prototype`, and `BigInt.prototype`.

To install the global shim, import `@esfx/equatable-shim`:

```ts
import "@esfx/equatable-shim"; // triggers global-scope side effects
import { Equatable } from "@esfx/equatable";

123[Equatable.hash]() // 123
```