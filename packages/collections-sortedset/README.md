# `@esfx/collections-sortedset`

The `@esfx/collections-sortedset` package provides `SortedSet`, a collection class that utilizes `@esfx/collection-core` and `@esfx/equatable`.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/collections-sortedset
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

## SortedSet

```ts
import { SortedSet } from "@esfx/collections-sortedset";

// NOTE: see definition of Person above
const obj1 = new Person("Alice", "Johnson");
const obj2 = new Person("Bob", "Clark");

// ECMAScript native set iterates in insertion order
const set = new Set(); // native ECMAScript Set
set.add(obj1);
set.add(obj2);
[...set]; // Alice Johnson,Bob Clark

// SortedSet uses Comparable.compareTo if available
const sortedSet = new SortedSet();
sortedSet.add(obj1);
sortedSet.add(obj2);
[...sortedSet]; // Bob Clark,Alice Johnson

```
## API

You can read more about the API [here](https://esfx.js.org/esfx/api/collections-sortedset.html).
