---
uid: '@esfx/collection-core-shim!'
---

Provides a global shim to add default @"@esfx/collection-core!" behaviors to global objects.

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
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!Collection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
  - @"@esfx/collection-core!IndexedCollection:interface"
- `Uint8Array` implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- `Uint8ClampedArray` implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- `Uint16Array` implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- `Uint32Array` implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- `Int8Array` implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- `Int16Array` implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- `Int32Array` implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- `Float32Array` implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- `Float64Array` implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- `BigUint64Array` implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- `BigInt64Array` implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
  - @"@esfx/collection-core!FixedSizeIndexedCollection:interface"
- `Set` implements:
  - @"@esfx/collection-core!ReadonlyCollection:interface"
  - @"@esfx/collection-core!Collection:interface"
- `Map` implements:
  - @"@esfx/collection-core!ReadonlyKeyedCollection:interface"
  - @"@esfx/collection-core!KeyedCollection:interface"

To install the global shim, import @"@esfx/collection-core-shim!":

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
