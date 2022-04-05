---
uid: '@esfx/collection-core-shim!'
---

Provides a global shim to add default @"@esfx/collection-core!" behaviors to global objects.

### Installation

```sh
npm i @esfx/collection-core-shim
```

### Usage

#### [TypeScript](#tab/ts)
[!code-typescript[](../examples/usage.ts)]
#### [JavaScript (CommonJS)](#tab/js)
[!code-javascript[](../examples/usage.js)]
***

### Remarks

The global shim adds a default implementation the collection interfaces to the following global objects:

- @"!Array:interface" implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!Collection:interface"
  - @"@esfx/collection-core!IndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- @"!Uint8Array:interface" implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- @"!Uint8ClampedArray:interface" implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- @"!Uint16Array:interface" implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- @"!Uint32Array:interface" implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- @"!Int8Array:interface" implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- @"!Int16Array:interface" implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- @"!Int32Array:interface" implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- @"!Float32Array:interface" implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- @"!Float64Array:interface" implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- @"!BigUint64Array:interface" implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- @"!BigInt64Array:interface" implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- @"!Set:interface" implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!Collection:interface"
- @"!Map:interface" implements:
  - @"@esfx/collection-core!ReadonlyKeyedCollection:interface"
  - @"@esfx/collection-core!KeyedCollection:interface"
- @"!WeakSet:interface" implements:
  - @"@esfx/collection-core!ReadonlyContainer:interface"
  - @"@esfx/collection-core!Container:interface"
- @"!WeakMap:interface" implements:
  - @"@esfx/collection-core!ReadonlyKeyedContainer:interface"
  - @"@esfx/collection-core!KeyedContainer:interface"
