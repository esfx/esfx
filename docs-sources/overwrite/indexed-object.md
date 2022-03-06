---
uid: '@esfx/indexed-object!'
---

Provides a base class for custom integer-indexed collections.

The underlying implementation uses a `Proxy` to trap integer indexes in a fashion similar to
the [Integer-Indexed Exotic Object](https://tc39.github.io/ecma262/#integer-indexed-exotic-object) 
in the ECMAScript specification.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/indexed-object
```

# Usage

## [TypeScript](#tab/ts)
```ts
import { IntegerIndexedObject } from "indexed-object";

class BooleansCollection extends IntegerIndexedObject<boolean> {
    protected getLength() {
        return 2;
    }
    protected getIndex(index: number) {
        switch (index) {
            case 0: return false;
            case 1: return true;
            default: return undefined;
        }
    }
    // hasIndex(index): boolean
    // setIndex(index, value): boolean
    // deleteIndex(index): boolean
}

const booleans = new BooleansCollection();
console.log(booleans[0]); // false
console.log(booleans[1]); // true
```

## [JavaScript (CommonJS)](#tab/js)
```js
const { IntegerIndexedObject } = require("indexed-object");

class BooleansCollection extends IntegerIndexedObject {
    /** @protected */
    getLength() {
        return 2;
    }
    /** @protected */
    getIndex(index) {
        switch (index) {
            case 0: return false;
            case 1: return true;
            default: return undefined;
        }
    }
    // hasIndex(index): boolean
    // setIndex(index, value): boolean
    // deleteIndex(index): boolean
}

const booleans = new BooleansCollection();
console.log(booleans[0]); // false
console.log(booleans[1]); // true
```

***