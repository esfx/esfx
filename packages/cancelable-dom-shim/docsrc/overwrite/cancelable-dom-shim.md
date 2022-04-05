---
uid: '@esfx/cancelable-dom-shim!'
---

The `@esfx/cancelable-dom-shim` package provides a global shim to make the DOM @"!AbortController" and @"!AbortSignal" classes compatible with @"@esfx/cancelable!".

### Installation

```sh
npm i @esfx/cancelable-dom-shim
```

### Usage

#### [TypeScript](#tab/ts)
[!code-typescript[](../examples/usage.ts)]
#### [JavaScript (CommonJS)](#tab/js)
[!code-javascript[](../examples/usage.js)]
***

### Remarks

This shim adds a default implementation of the @"@esfx/cancelable!Cancelable:interface" interface to the following global DOM objects:

- @"!AbortController" implements:
  - @"@esfx/cancelable!CancelableSource:interface"
  - @"@esfx/cancelable!Cancelable:interface"
- @"!AbortSignal" implements:
  - @"@esfx/cancelable!Cancelable:interface"
