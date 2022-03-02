# `@esfx/collection-core-shim`

The `@esfx/collection-core-shim` package provides a global shim to add default @esfx/collection-core behaviors to global objects.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/collection-core-shim
```

# Usage

The global shim adds a default implementation the collection interfaces to the following global objects:

- `Array` implements:
  - `ReadonlyCollection`
  - `Collection`
  - `ReadonlyIndexedCollection`
  - `FixedSizeIndexedCollection`
  - `IndexedCollection`
- `Uint8Array` implements:
  - `ReadonlyCollection`
  - `ReadonlyIndexedCollection`
  - `FixedSizeIndexedCollection`
- `Uint8ClampedArray` implements:
  - `ReadonlyCollection`
  - `ReadonlyIndexedCollection`
  - `FixedSizeIndexedCollection`
- `Uint16Array` implements:
  - `ReadonlyCollection`
  - `ReadonlyIndexedCollection`
  - `FixedSizeIndexedCollection`
- `Uint32Array` implements:
  - `ReadonlyCollection`
  - `ReadonlyIndexedCollection`
  - `FixedSizeIndexedCollection`
- `Int8Array` implements:
  - `ReadonlyCollection`
  - `ReadonlyIndexedCollection`
  - `FixedSizeIndexedCollection`
- `Int16Array` implements:
  - `ReadonlyCollection`
  - `ReadonlyIndexedCollection`
  - `FixedSizeIndexedCollection`
- `Int32Array` implements:
  - `ReadonlyCollection`
  - `ReadonlyIndexedCollection`
  - `FixedSizeIndexedCollection`
- `Float32Array` implements:
  - `ReadonlyCollection`
  - `ReadonlyIndexedCollection`
  - `FixedSizeIndexedCollection`
- `Float64Array` implements:
  - `ReadonlyCollection`
  - `ReadonlyIndexedCollection`
  - `FixedSizeIndexedCollection`
- `BigUint64Array` implements:
  - `ReadonlyCollection`
  - `ReadonlyIndexedCollection`
  - `FixedSizeIndexedCollection`
- `BigInt64Array` implements:
  - `ReadonlyCollection`
  - `ReadonlyIndexedCollection`
  - `FixedSizeIndexedCollection`
- `Set` implements:
  - `ReadonlyCollection`
  - `Collection`
- `Map` implements:
  - `ReadonlyKeyedCollection`
  - `KeyedCollection`
- `WeakSet` implements:
  - `ReadonlyContainer`
  - `Container`
- `WeakMap` implements:
  - `ReadonlyKeyedContainer`
  - `KeyedContainer`

To install the global shim, import `@esfx/collection-core-shim`:

```ts
import "@esfx/collection-core-shim"; // triggers global-scope side effects

[1, 2, 3][Collection.size]; // 3
```
