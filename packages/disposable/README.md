# `@esfx/disposable`

The `@esfx/disposable` package provides a low-level API for defining explicit resource management that third-party libraries can use to interoperate.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/disposable
```

# Usage

```ts
import { Disposable } from "@esfx/disposable";

class MyFileResouce {
    constructor() {
        this.handle = fs.openSync("path/to/file");
    }

    close() {
        fs.closeSync(this.handle);
        this.handle = undefined;
    }

    // provide low-level 'dispose' primitive for interop
    [Disposable.dispose]() {
        this.close();
    }
}
```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/disposable.html).
