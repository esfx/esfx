---
uid: collection-core-shim
---

Provides a global shim to add default @"collection-core" behaviors to global objects.

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
  - @"collection-core.ReadonlyCollection"
  - @"collection-core.Collection"
  - @"collection-core.ReadonlyIndexedCollection"
  - @"collection-core.FixedSizeIndexedCollection"
  - @"collection-core.IndexedCollection"
- `Uint8Array` implements:
  - @"collection-core.ReadonlyCollection"
  - @"collection-core.ReadonlyIndexedCollection"
  - @"collection-core.FixedSizeIndexedCollection"
- `Uint8ClampedArray` implements:
  - @"collection-core.ReadonlyCollection"
  - @"collection-core.ReadonlyIndexedCollection"
  - @"collection-core.FixedSizeIndexedCollection"
- `Uint16Array` implements:
  - @"collection-core.ReadonlyCollection"
  - @"collection-core.ReadonlyIndexedCollection"
  - @"collection-core.FixedSizeIndexedCollection"
- `Uint32Array` implements:
  - @"collection-core.ReadonlyCollection"
  - @"collection-core.ReadonlyIndexedCollection"
  - @"collection-core.FixedSizeIndexedCollection"
- `Int8Array` implements:
  - @"collection-core.ReadonlyCollection"
  - @"collection-core.ReadonlyIndexedCollection"
  - @"collection-core.FixedSizeIndexedCollection"
- `Int16Array` implements:
  - @"collection-core.ReadonlyCollection"
  - @"collection-core.ReadonlyIndexedCollection"
  - @"collection-core.FixedSizeIndexedCollection"
- `Int32Array` implements:
  - @"collection-core.ReadonlyCollection"
  - @"collection-core.ReadonlyIndexedCollection"
  - @"collection-core.FixedSizeIndexedCollection"
- `Float32Array` implements:
  - @"collection-core.ReadonlyCollection"
  - @"collection-core.ReadonlyIndexedCollection"
  - @"collection-core.FixedSizeIndexedCollection"
- `Float64Array` implements:
  - @"collection-core.ReadonlyCollection"
  - @"collection-core.ReadonlyIndexedCollection"
  - @"collection-core.FixedSizeIndexedCollection"
- `BigUint64Array` implements:
  - @"collection-core.ReadonlyCollection"
  - @"collection-core.ReadonlyIndexedCollection"
  - @"collection-core.FixedSizeIndexedCollection"
- `BigInt64Array` implements:
  - @"collection-core.ReadonlyCollection"
  - @"collection-core.ReadonlyIndexedCollection"
  - @"collection-core.FixedSizeIndexedCollection"
- `Set` implements:
  - @"collection-core.ReadonlyCollection"
  - @"collection-core.Collection"
- `Map` implements:
  - @"collection-core.ReadonlyKeyedCollection"
  - @"collection-core.KeyedCollection"

To install the global shim, import @"collection-core-shim":

## [TypeScript](#tab/ts)
```ts
import "@esfx/collection-core-shim"; // triggers global-scope side effects
import { Collection } from "@esfx/collection-core";

[1, 2, 3][Collection.size]; // 3
```

## [JavaScript (CommonJS)](#tab/js)
```js
require("@esfx/collection-core-shim"); // triggers global-scope side effects
const { Collection } = require("@esfx/collection-core");

[1, 2, 3][Collection.size]; // 3
```

***
