# `@esfx/ref`

The `@esfx/ref` package provides a low-level API for defining forward references.

> NOTE: This implementation is an approximation of the `Reference` behavior from https://github.com/rbuckton/proposal-refs.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/ref
```

# Usage

> NOTE: Examples adapted from https://github.com/rbuckton/proposal-refs#examples where applicable.

## Take a reference to a variable
```ts
import { ref } from "@esfx/ref";

let x = 1;
const r = ref(() => x, _ => x = _);
print(r.value); // 1
r.value = 2;
print(x); // 2
```

## Take a reference to a property
```ts
import { ref } from "@esfx/ref";

let o = { x: 1 };
const r = ref.at(o, "x");
print(r.value); // 1
r.value = 2;
print(o); // { x: 2 }
```

## Take a reference to an element
```ts
import { ref } from "@esfx/ref";

let ar = [1];
const r = ref.at(ar, 0);
print(r.value); // 1
r.value = 2;
print(ar); // [2]
```

## Reference passing
```ts
import { ref } from "@esfx/ref";

function update(ref_r) {
    ref_r.value = 2;
}

let x = 1;
update(ref(() => x, _ => x = _));
print(x); // 2
```

## Referencing a local declaration creates a closure
```ts
import { ref } from "@esfx/ref";

function f() {
    let x = 1;
    return [ref(() => x, _ => x = _), () => print(x)];
}

const [r, p] = f();
p(); // 1
r.value = 2;
p(); // 2
```

## More complex reference passing
```ts
import { ref } from "@esfx/ref";

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

## Forward reference to a `var`
```ts
const ref_a = ref(() => a, _ => a = _);
ref_a.value = 1; // ok, no error as `a` is a var.
var a;
```

## Forward reference to a block-scoped variable
```ts
const ref_a = ref(() => a, _ => a = _);
let a;
ref_a.value = 1; // ok, no error as `a` has been declared.

const ref_b = ref(() => b, _ => b = _);
ref_b.value = 1; // error as `b` has not yet been declared.
let b;
```

## Forward reference to a member of a block-scoped variable
```ts
const ref_x = ref.at(b, "x"); // error, `b` has not yet been declared
let b = { x: 1 };
```

## Forward references for decorators
```ts
import { ref } from "@esfx/ref";
import { metadata } from "@esfx/metadata";

const Type = ref_type => metadata("design:type", ref_type);

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

## Side effects
```ts
let count = 0;
let e = [0, 1, 2];
const ref_e = ref.at(e, count++); // `count++` is evaluated when Reference is taken.
print(ref_e.value); // 0
print(ref_e.value); // 0
print(count); // 1
```

# API

```ts
export interface Reference<T> {
    value: T;
    [Symbol.toStringTag]: string;
}
/**
 * Create a reference to a value.
 * @param get Gets the value of the reference.
 * @param set Sets the value of the reference.
 */
export declare function ref<T>(get: () => T, set?: (value: T) => void): Reference<T>;
export declare namespace ref {
    /**
     * Creates a `ref` to a property of an object.
     */
    function at<T, K extends keyof T>(object: T, key: K, readonly?: boolean): Reference<T[K]>;
    /**
     * Creates a `ref` that must be set before it can be read.
     */
    function out<T>(): Reference<T>;
    /**
     * Creates a `ref` that must be set before it can be read.
     */
    function out<T>(get: () => T, set: (value: T) => void): Reference<T>;
    const prototype: Reference<unknown>;
}
export declare namespace ref {
    /**
     * Determines whether `value` is a [[ref]].
     */
    function _is(value: unknown): value is Reference<any>;
    export { _is as is };
    /**
     * Creates a `ref` for an initial value.
     */
    function _for<T>(value: T): Reference<T>;
    export { _for as for };
}
```
