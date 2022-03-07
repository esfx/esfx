---
uid: '@esfx/metadata!'
---

Provides an API for defining metadata about an object.

## Overview

* [Installation](#installation)
* [Usage](#usage)

## Installation

```sh
npm i @esfx/metadata
```

## Usage

### [TypeScript](#tab/ts)
```ts
import { Metadata, getClassMetadata, getMemberMetadata, getParameterMetadata } from "@esfx/metadata";

const Service = name => Metadata("Service", name);
const ReturnType = type => Metadata("ReturnType", type);
const Type = type => Metadata("Type", type);

@Service("MyService")
class MyClass {
    @ReturnType("string")
    method(@Type("number") x: number) {
        return "hi";
    }
}

const c = new MyClass();
getClassMetadata(MyClass, "Service"); // "MyService"
getMemberMetadata(c, "method", "ReturnType"); // "string"
getParameterMetadata(c, "method", 0, "Type"); // "number"
```

### [JavaScript (CommonJS)](#tab/js)
```js
const {
    defineClassMetadata,
    defineMemberMetadata,
    defineParameterMetadata,
    getClassMetadata,
    getMemberMetadata,
    getParameterMetadata
} = require("@esfx/metadata");

class MyClass {
    method(x) {
        return "hi";
    }
}

defineClassMetadata(MyClass, "Service", "MyService");
defineMemberMetadata(MyClass.prototype, "method", "ReturnType", "string");
defineParameterMetadata(MyClass.prototype, "method", 0, "Type", "number");

const c = new MyClass();
getClassMetadata(MyClass, "Service"); // "MyService"
getMemberMetadata(c, "method", "ReturnType"); // "string"
getParameterMetadata(c, "method", 0, "Type"); // "number"
```

***

## API
