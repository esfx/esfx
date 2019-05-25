# `@esfx/reflect-metadata-compat`

The `@esfx/reflect-metadata-compat` package is a global shim that provides API compatibility with `reflect-metadata`.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/reflect-metadata-compat
```

# Usage

```ts
import "@esfx/reflect-metadata-compat";

// TypeScript compiled with --emitDecoratorMetadata
class MyClass {
    @someDecorator
    method(x: number): string {
        return "";
    }
}

const c = new MyClass();
Reflect.getMetadata("design:returntype", c, "method"); // String
Reflect.getMetadata("design:paramtypes", c, "method"); // [Number]
```

# API

You can read more about the API [here](https://esfx.github.io/esfx/modules/reflect_metadata_compat.html).
