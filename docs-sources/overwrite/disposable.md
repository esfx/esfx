---
uid: '@esfx/disposable!'
---

Provides a low-level API for defining explicit resource management that third-party libraries can use to interoperate.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/disposable
```

# Usage

## [TypeScript](#tab/ts)
```ts
import { Disposable } from "@esfx/disposable";

class MyFileResouce {
    private _handle?: number;

    constructor() {
        this._handle = fs.openSync("path/to/file");
    }

    close() {
        if (this._handle !== undefined) {
            fs.closeSync(this._handle);
            this._handle = undefined;
        }
    }
    
    // provide low-level 'dispose' primitive for interop
    [Disposable.dispose]() {
        this.close();
    }
}
```

## [JavaScript (CommonJS)](#tab/js)
```js
const { Disposable } = require("@esfx/disposable");

class MyFileResouce {
    constructor() {
        this._handle = fs.openSync("path/to/file");
    }

    close() {
        if (this._handle !== undefined) {
            fs.closeSync(this._handle);
            this._handle = undefined;
        }
    }
    
    // provide low-level 'dispose' primitive for interop
    [Disposable.dispose]() {
        this.close();
    }
}
```

***