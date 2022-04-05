---
uid: '@esfx/equatable-shim!'
---

Provides a global shim that adds @"@esfx/equatable!" functionality to various ECMAScript built-ins.

### Installation

```sh
npm i @esfx/equatable-shim
```

### Usage

The global shim adds a default implementation of @"@esfx/equatable!Equatable:interface" to `Object.prototype` and default implementations of
@"@esfx/equatable!Comparable:interface" to `String.prototype`, `Number.prototype`, `Boolean.prototype`, and `BigInt.prototype`.

To install the global shim, import @"@esfx/equatable-shim!":

#### [TypeScript](#tab/ts)
[!code-typescript[](../examples/usage.ts)]
#### [JavaScript (CommonJS)](#tab/js)
[!code-javascript[](../examples/usage.js)]
***