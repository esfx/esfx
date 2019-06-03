# `@esfx/indexed-object`

The `@esfx/indexed-object` package provides a A base class for custom integer-indexed collections.

The underlying implementation uses a `Proxy` to trap integer indexes in a fashion similar to
the [Integer-Indexed Exotic Object](https://tc39.github.io/ecma262/#integer-indexed-exotic-object) 
in the ECMAScript specification.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/indexed-object
```

# Usage

```ts
import { IntegerIndexedObject } from "indexed-object";

class BooleansCollection extends IntegerIndexedObject {
    getLength() {
        return 2;
    }
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

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/indexed-object.html).
