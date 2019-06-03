# `@esfx/metadata-shim`

The `@esfx/metadata-shim` package is a global shim that adds minimal `@esfx/metadata` functionality to the `Reflect` global object.
This provides partial compatibility with TypeScript's `--emitDecoratorMetadata` flag.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/metadata-shim
```

# Usage

```ts
import "@esfx/metadata-shim";
import { getMemberMetadata } from "@esfx/metadata";

// TypeScript compiled with --emitDecoratorMetadata
class MyClass {
    @someDecorator
    method(x: number): string {
        return "";
    }
}

const c = new MyClass();
getMemberMetadata(c, "method", "design:returntype"); // String
getMemberMetadata(c, "method", "design:paramtypes"); // [Number]
```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/metadata-shim.html).
