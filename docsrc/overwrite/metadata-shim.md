---
uid: '@esfx/metadata-shim!'
---

Provides a global shim that adds minimal @"@esfx/metadata!" functionality to the `Reflect` global object.
This provides partial compatibility with TypeScript's `--emitDecoratorMetadata` flag.

## Overview

* [Installation](#installation)
* [Usage](#usage)

## Installation

```sh
npm i @esfx/metadata-shim
```

## Usage

### [TypeScript](#tab/ts)
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

***
