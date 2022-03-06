---
uid: '@esfx/collections-multimap!'
---

Provides the @"@esfx/collections-multimap!MultiMap:class" class, a collection class that maps a single key to multiple values.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/collections-multimap
```

# Usage

## [TypeScript](#tab/ts)
```ts
import { MultiMap } from "@esfx/collections-multimap";

const multi = new MultiMap<string, number>();
multi.add("a", 1);
multi.add("a", 2);
multi.add("b", 3);
multi.size; // 3
[...multi.get("a")]; // [1, 2]
[...multi.get("b")]; // [3]
```

## [JavaScript (CommonJS)](#tab/js)
```js
import { MultiMap } from "@esfx/collections-multimap";

const multi = new MultiMap();
multi.add("a", 1);
multi.add("a", 2);
multi.add("b", 3);
multi.size; // 3
[...multi.get("a")]; // [1, 2]
[...multi.get("b")]; // [3]
```

***
