---
uid: '@esfx/ref!'
---

Provides a low-level API for defining forward references.

> [!NOTE]
> This implementation is an approximation of the `Reference` behavior from https://github.com/rbuckton/proposal-refs.

## Overview

* [Installation](#installation)
* [Usage](#usage)

## Installation

```sh
npm i @esfx/ref
```

## Usage

> [!NOTE]
> Examples adapted from https://github.com/rbuckton/proposal-refs#examples where applicable.

### Take a reference to a variable

#### [TypeScript](#tab/ts)
```ts
import { ref } from "@esfx/ref";

let x = 1;
const r = ref(() => x, _ => x = _);
print(r.value); // 1
r.value = 2;
print(x); // 2
```

#### [JavaScript (CommonJS)](#tab/js)
```js
const { ref } = require("@esfx/ref");

let x = 1;
const r = ref(() => x, _ => x = _);
print(r.value); // 1
r.value = 2;
print(x); // 2
```

***

### Take a reference to a property

#### [TypeScript](#tab/ts)
```ts
import { ref } from "@esfx/ref";

let o = { x: 1 };
const r = ref.at(o, "x");
print(r.value); // 1
r.value = 2;
print(o); // { x: 2 }
```

#### [JavaScript (CommonJS)](#tab/js)
```js
const { ref } = require("@esfx/ref");

let o = { x: 1 };
const r = ref.at(o, "x");
print(r.value); // 1
r.value = 2;
print(o); // { x: 2 }
```

***

### Take a reference to an element

#### [TypeScript](#tab/ts)
```ts
import { ref } from "@esfx/ref";

let ar = [1];
const r = ref.at(ar, 0);
print(r.value); // 1
r.value = 2;
print(ar); // [2]
```

#### [JavaScript (CommonJS)](#tab/js)
```js
const { ref } = require("@esfx/ref");

let ar = [1];
const r = ref.at(ar, 0);
print(r.value); // 1
r.value = 2;
print(ar); // [2]
```

***

### Reference passing

#### [TypeScript](#tab/ts)
```ts
import { ref, Reference } from "@esfx/ref";

function update(ref_r: Reference<number>) {
    ref_r.value = 2;
}

let x = 1;
update(ref(() => x, _ => x = _));
print(x); // 2
```

#### [JavaScript (CommonJS)](#tab/js)
```js
const { ref } = require("@esfx/ref");

function update(ref_r) {
    ref_r.value = 2;
}

let x = 1;
update(ref(() => x, _ => x = _));
print(x); // 2
```

***

### Referencing a local declaration creates a closure

#### [TypeScript](#tab/ts)
```ts
import { ref } from "@esfx/ref";

function f() {
    let x = 1;
    return [ref(() => x, _ => x = _), () => print(x)] as const;
}

const [r, p] = f();
p(); // 1
r.value = 2;
p(); // 2
```

#### [JavaScript (CommonJS)](#tab/js)
```js
const { ref } = require("@esfx/ref");

function f() {
    let x = 1;
    return [ref(() => x, _ => x = _), () => print(x)];
}

const [r, p] = f();
p(); // 1
r.value = 2;
p(); // 2
```

***

### More complex reference passing

#### [TypeScript](#tab/ts)
```ts
import { ref, Reference } from "@esfx/ref";

function max(ref_first: Reference<number>, ref_second: Reference<number>, ref_third: Reference<number>) {
    const ref_max = ref_first.value > ref_second.value ? ref_first : ref_second;
    return ref_max.value > ref_third.value ? ref_max : ref_third;
}

let x = 1, y = 2, z = 3;
const ref_x = ref(() => x, _ => x = _);
const ref_y = ref(() => y, _ => y = _);
const ref_z = ref(() => z, _ => z = _);
const ref_w = max(ref_x, ref_y, ref_z);
ref_w.value = 4;
print(x); // 1
print(y); // 2
print(z); // 4
```

#### [JavaScript (CommonJS)](#tab/js)
```js
const { ref } = require("@esfx/ref");

function max(ref_first, ref_second, ref_third) {
    const ref_max = ref_first.value > ref_second.value ? ref_first : ref_second;
    return ref_max.value > ref_third.value ? ref_max : ref_third;
}

let x = 1, y = 2, z = 3;
const ref_x = ref(() => x, _ => x = _);
const ref_y = ref(() => y, _ => y = _);
const ref_z = ref(() => z, _ => z = _);
const ref_w = max(ref_x, ref_y, ref_z);
ref_w.value = 4;
print(x); // 1
print(y); // 2
print(z); // 4
```

***

### Forward reference to a `var`

#### [TypeScript](#tab/ts)
```ts
import { ref } from "@esfx/ref";

const ref_a = ref(() => a, _ => a = _);
ref_a.value = 1; // ok, no error as `a` is a var.

var a: number;
```

#### [JavaScript (CommonJS)](#tab/js)
```js
const { ref } = require("@esfx/ref");

const ref_a = ref(() => a, _ => a = _);
ref_a.value = 1; // ok, no error as `a` is a var.

var a;
```

***

### Forward reference to a block-scoped variable

#### [TypeScript](#tab/ts)
```ts
import { ref } from "@esfx/ref";

let a: number;

const ref_a = ref(() => a, _ => a = _);
ref_a.value = 1; // ok, no error as `a` has been declared.

const ref_b = ref(() => b, _ => b = _);
ref_b.value = 1; // error as `b` has not yet been declared.

let b: number;
```

#### [JavaScript (CommonJS)](#tab/js)
```js
const { ref } = require("@esfx/ref");

let a;

const ref_a = ref(() => a, _ => a = _);
ref_a.value = 1; // ok, no error as `a` has been declared.

const ref_b = ref(() => b, _ => b = _);
ref_b.value = 1; // error as `b` has not yet been declared.

let b;
```

***

### Forward reference to a member of a block-scoped variable

#### [TypeScript](#tab/ts)
```ts
import { ref } from "@esfx/ref";

const ref_x = ref.at(b, "x"); // error, `b` has not yet been declared
let b = { x: 1 };
```

#### [JavaScript (CommonJS)](#tab/js)
```js
const { ref } = require("@esfx/ref");

const ref_x = ref.at(b, "x"); // error, `b` has not yet been declared
let b = { x: 1 };
```

***

### Forward references for decorators

#### [TypeScript](#tab/ts-1)
```ts
import { ref, Reference } from "@esfx/ref";
import { metadata } from "@esfx/metadata";

const Type = (ref_type: Reference<Function>) => metadata("design:type", ref_type);

class Node {
    @Type(ref(() => Container))
    get parent() { /*...*/ }

    @Type(ref(() => Node)) 
    get nextSibling() { /*...*/ }
}

class Container extends Node {
    @Type(ref(() => Node))
    get firstChild() { /*...*/ }
}
```

***

### Side effects

#### [TypeScript](#tab/ts)
```ts
import { ref } from "@esfx/ref";

let count = 0;
let e = [0, 1, 2];
const ref_e = ref.at(e, count++); // `count++` is evaluated when Reference is taken.
print(ref_e.value); // 0
print(ref_e.value); // 0
print(count); // 1
```

#### [JavaScript (CommonJS)](#tab/js)
```js
const { ref } = require("@esfx/ref");

let count = 0;
let e = [0, 1, 2];
const ref_e = ref.at(e, count++); // `count++` is evaluated when Reference is taken.
print(ref_e.value); // 0
print(ref_e.value); // 0
print(count); // 1
```

***

## API
