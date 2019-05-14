 
# `@esfx/lazy`

Provides a class to simplify lazy-initialization logic.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/lazy
```

# Usage

```ts
import { Lazy } from "@esfx/lazy";

// lazy initialize an object
const lazy1 = new Lazy(() => new SomeObject());
lazy1.hasValue; // false
lazy1.value; // SomeObject {}
lazy1.hasValue; // true

// lazy initialize with arguments
const lazy1 = Lazy.from((a, b) => a + b, 1, 2);
lazy1.hasValue; // false
lazy1.value; // 3
lazy1.hasValue; // true

// initialized "lazy"
const lazy2 = Lazy.for("test");
lazy2.hasValue; // true
lazy2.value; // "test"
```

# API

```ts
export declare class Lazy<T> {
    constructor(factory: () => T);
    readonly hasValue: boolean;
    readonly value: T;
    static from<T, A extends any[]>(factory: (...args: A) => T, ...args: A): Lazy<T>;
    static for<T>(value: T): Lazy<T>;
}```

