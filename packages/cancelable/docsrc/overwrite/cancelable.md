---
uid: '@esfx/cancelable!'
---

The `@esfx/cancelable` package provides a low-level Symbol-based API for defining a common cancellation protocol.

> [!NOTE]
> This package does not contain an *implementation* of cancellation signals, but rather provides only a
> protocol for interoperable libraries that depend on cancellation.
>
> For an implementation of this protocol, please consider the following packages:
> - @"@esfx/async-canceltoken!"
> - @"@esfx/cancelable-dom!"
> - @"@esfx/cancelable-dom-shim!"
> - [prex](https://github.com/rbuckton/prex#readme) (version 0.4.6 or later)

### Installation

```sh
npm i @esfx/cancelable
```

### Usage

#### [TypeScript](#tab/ts)
[!code-typescript[](../examples/usage.ts)]
#### [JavaScript (CommonJS)](#tab/js)
[!code-javascript[](../examples/usage.js)]
***
