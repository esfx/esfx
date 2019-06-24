# `@esfx/collections-multimap`

Provides the MultiMap class, a collection class that maps a single key to multiple values.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/collections-multimap
```

# Usage

```ts
import { MultiMap } from "@esfx/collections-multimap";

const multi = new MultiMap();
multi.add("a", 1);
multi.add("a", 2);
multi.add("b", 3);
multi.size; // 3
[...multi.get("a")]; // [1, 2]
[...multi.get("b")]; // [3]
```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/collections-multimap.html).
