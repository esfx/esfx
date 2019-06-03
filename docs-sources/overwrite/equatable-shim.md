---
uid: equatable-shim
---

Provides a global shim that adds @"equatable" functionality to various ECMAScript built-ins.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/equatable-shim
```

# Usage

The global shim adds a default implementation of @"equatable.Equatable_Interface" to `Object.prototype` and default implementations of
@"comparable.Comparable_Interface" to `String.prototype`, `Number.prototype`, `Boolean.prototype`, and `BigInt.prototype`.

To install the global shim, import @"equatable-shim":

## [TypeScript](#tab/ts)
```ts
import "@esfx/equatable-shim"; // triggers global-scope side effects
import { Equatable } from "@esfx/equatable";

123[Equatable.hash]() // 123
```

## [JavaScript (CommonJS)](#tab/js)
```js
require("@esfx/equatable-shim"); // triggers global-scope side effects
const { Equatable } = require("@esfx/equatable");

123[Equatable.hash]() // 123
```

***