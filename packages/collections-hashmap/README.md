# `@esfx/collections-hashmap`

The `@esfx/collections-hashmap` package provides `HashMap`, a collection class that utilizes `@esfx/collection-core` and `@esfx/equatable`.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/collections-hashmap
```

# Usage

> NOTE: The examples below use the following definition of `Person`:
> ```ts
> import { Equatable, Equaler, Comparable, Comparer } from "@esfx/equatable";
>
> class Person {
>     constructor(firstName, lastName) {
>         this.firstName = firstName;
>         this.lastName = lastName;
>     }
>
>     toString() {
>         return `${this.firstName} ${this.lastName}`;
>     }
>
>     [Equatable.equals](other) {
>         return other instanceof Person
>             && this.lastName === other.lastName
>             && this.firstName === other.firstName;
>     }
>
>     [Equatable.hash]() {
>         return Equaler.defaultEqualer.hash(this.lastName)
>              ^ Equaler.defaultEqualer.hash(this.firstName);
>     }
>
>     [Comparable.compareTo](other) {
>         if (!(other instanceof Person)) throw new TypeError();
>         return Comparer.defaultComparer.compare(this.lastName, other.lastName)
>             || Comparer.defaultComparer.compare(this.firstName, other.firstName);
>     }
> }
> ```

## HashMap

```ts
import { HashMap } from "@esfx/collections-hashmap";

// NOTE: see definition of Person above
const obj1 = new Person("Bob", "Clark");
const obj2 = new Person("Bob", "Clark");

const set = new Map(); // native ECMAScript Map
set.set(obj1, "obj1");
set.set(obj2, "obj2");
set.size; // 2

const hashMap = new HashMap();
hashMap.set(obj1, "obj1");
hashMap.set(obj2, "obj2");
hashMap.size; // 1
```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/collections-hashmap.html).
