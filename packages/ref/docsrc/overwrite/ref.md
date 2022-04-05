---
uid: '@esfx/ref!'
---

Provides a low-level API for defining forward references.

> [!NOTE]
> This implementation is an approximation of the `Reference` behavior from https://github.com/rbuckton/proposal-refs.

### Installation

```sh
npm i @esfx/ref
```

### Usage

> [!NOTE]
> Examples adapted from https://github.com/rbuckton/proposal-refs#examples where applicable.

#### Take a reference to a variable

##### [TypeScript](#tab/ts)
[!code-typescript[](../examples/usage-variable-reference.ts#usage)]
##### [JavaScript (CommonJS)](#tab/js)
[!code-javascript[](../examples/usage-variable-reference.js)]
***

#### Take a reference to a property

##### [TypeScript](#tab/ts)
[!code-typescript[](../examples/usage-property-reference.ts#usage)]
##### [JavaScript (CommonJS)](#tab/js)
[!code-javascript[](../examples/usage-property-reference.js)]
***

#### Take a reference to an element

##### [TypeScript](#tab/ts)
[!code-typescript[](../examples/usage-element-reference.ts#usage)]
##### [JavaScript (CommonJS)](#tab/js)
[!code-javascript[](../examples/usage-element-reference.js)]
***

#### Reference passing

##### [TypeScript](#tab/ts)
[!code-typescript[](../examples/usage-reference-passing.ts#usage)]
##### [JavaScript (CommonJS)](#tab/js)
[!code-javascript[](../examples/usage-reference-passing.js)]
***

#### Referencing a local declaration creates a closure

##### [TypeScript](#tab/ts)
[!code-typescript[](../examples/usage-closure.ts#usage)]
##### [JavaScript (CommonJS)](#tab/js)
[!code-javascript[](../examples/usage-closure.js)]
***

#### More complex reference passing

##### [TypeScript](#tab/ts)
[!code-typescript[](../examples/usage-reference-passing-complex.ts#usage)]
##### [JavaScript (CommonJS)](#tab/js)
[!code-javascript[](../examples/usage-reference-passing-complex.js)]
***

#### Forward reference to a `var`

##### [TypeScript](#tab/ts)
[!code-typescript[](../examples/usage-forward-var.ts)]
##### [JavaScript (CommonJS)](#tab/js)
[!code-javascript[](../examples/usage-forward-var.js)]
***

#### Forward reference to a block-scoped variable

##### [TypeScript](#tab/ts)
[!code-typescript[](../examples/usage-forward-let.ts)]
##### [JavaScript (CommonJS)](#tab/js)
[!code-javascript[](../examples/usage-forward-let.js)]
***

#### Forward reference to a member of a block-scoped variable

##### [TypeScript](#tab/ts)
[!code-typescript[](../examples/usage-forward-let-property.ts)]
##### [JavaScript (CommonJS)](#tab/js)
[!code-javascript[](../examples/usage-forward-let-property.js)]
***

#### Forward references for decorators

##### [TypeScript](#tab/ts-1)
[!code-typescript[](../examples/usage-decorators.ts)]
***

#### Side effects

##### [TypeScript](#tab/ts)
[!code-typescript[](../examples/usage-sideeffects.ts#usage)]
##### [JavaScript (CommonJS)](#tab/js)
[!code-javascript[](../examples/usage-sideeffects.js)]
***

