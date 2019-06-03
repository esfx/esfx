# `@esfx/collection-core`

The `@esfx/collection-core` package provides a low-level Symbol-based API for defining common collection behaviors.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/collection-core
```

# Usage

```ts
import { Collection } from "@esfx/collection-core";

class MyCollection {
    constructor() {
        this._items = new Set();
    }

    // Your implementation
    get count() { return this._items.size; }
    contains(value) { return this._items.has(value); }
    add(value) { this._items.add(value); }
    remove(value) { return this._items.delete(value); }
    clear() { this._items.clear(); }

    // Implement the `Collection` interface for cross-library consistency
    get [Collection.size]() { return this.count; }
    [Collection.has](value) { return this.contains(value); }
    [Collection.add](value) { this.add(value); }
    [Collection.delete](value) { return this.remove(value); }
    [Collection.clear]() { this.clear(); }
    [Symbol.iterator]() { return this._items.values(); }
}
```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/collection-core.html).
