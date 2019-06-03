 
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
const lazy2 = Lazy.from((a, b) => a + b, 1, 2);
lazy2.hasValue; // false
lazy2.value; // 3
lazy2.hasValue; // true

// initialized "lazy"
const lazy3 = Lazy.for("test");
lazy3.hasValue; // true
lazy3.value; // "test"
```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/lazy.html).
