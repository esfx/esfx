---
uid: reflect-metadata-compat
---

Provides a global shim that provides a drop-in replacement for [reflect-metadata](https://npmjs.com/packages/reflect-metadata).

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/reflect-metadata-compat
```

# Usage

## [TypeScript](#tab/ts)
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

***
