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

```ts
export interface Disposable {
    [Disposable.dispose](): void;
}
export namespace Disposable {
    const dispose: unique symbol;
    function isDisposable(value: unknown): value is Disposable;
}
export interface AsyncDisposable {
    [AsyncDisposable.asyncDispose](): Promise<void>;
}
export namespace AsyncDisposable {
    const asyncDispose: unique symbol;
    function isAsyncDisposable(value: unknown): value is AsyncDisposable;
}
```