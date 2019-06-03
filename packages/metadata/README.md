# `@esfx/metadata`

The `@esfx/metadata` package provides an API for defining metadata about an object.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/metadata
```

# Usage

```ts
import { Metadata, getClassMetadata, getMemberMetadata, getParameterMetadata } from "@esfx/metadata";

const Service = name => Metadata("Service", name);
const ReturnType = type => Metadata("ReturnType", type);
const Type = type => Metadata("Type", type);

@Service("MyService")
class MyClass {
    @ReturnType("string")
    method(@Type("number") x) {
        return "hi";
    }
}

const c = new MyClass();
getClassMetadata(MyClass, "Service"); // "MyService"
getMemberMetadata(c, "method", "ReturnType"); // "string"
getParameterMetadata(c, "method", 0, "Type"); // "number"
```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/metadata.html).
