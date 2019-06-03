---
uid: equatable
---

Provides a low level API for defining equality.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/equatable
```

# Usage

## [TypeScript](#tab/ts)
```ts
import { Equatable, Equaler, Comparable, Comparer } from "@esfx/equatable";

class Person {
    firstName: string;
    lastName: string;
    constructor(firstName: string, lastName: string) {
        this.firstName = firstName;
        this.lastName = lastName;
    }

    toString() {
        return `${this.firstName} ${this.lastName}`;
    }

    [Equatable.equals](other: unknown) {
        return other instanceof Person
            && this.lastName === other.lastName
            && this.firstName === other.firstName;
    }

    [Equatable.hash]() {
        return Equaler.defaultEqualer.hash(this.lastName)
            ^ Equaler.defaultEqualer.hash(this.firstName);
    }

    [Comparable.compareTo](other: unknown) {
        if (!(other instanceof Person)) throw new TypeError();
        return Comparer.defaultComparer.compare(this.lastName, other.lastName)
            || Comparer.defaultComparer.compare(this.firstName, other.firstName);
    }
}

const people = [
    new Person("Alice", "Johnson")
    new Person("Bob", "Clark"),
];
people.sort(Comparer.defaultComparer.compare);
console.log(people); // Bob Clark,Alice Johnson

const obj1 = new Person("Bob", "Clark");
const obj2 = new Person("Bob", "Clark");
obj1 === obj2; // false
Equaler.defaultEqualer.equals(obj1, obj2); // true
```

## [JavaScript (CommonJS)](#tab/js)
```js
const { Equatable, Equaler, Comparable, Comparer } = require("@esfx/equatable");

class Person {
    constructor(firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }

    toString() {
        return `${this.firstName} ${this.lastName}`;
    }

    [Equatable.equals](other) {
        return other instanceof Person
            && this.lastName === other.lastName
            && this.firstName === other.firstName;
    }

    [Equatable.hash]() {
        return Equaler.defaultEqualer.hash(this.lastName)
            ^ Equaler.defaultEqualer.hash(this.firstName);
    }

    [Comparable.compareTo](other) {
        if (!(other instanceof Person)) throw new TypeError();
        return Comparer.defaultComparer.compare(this.lastName, other.lastName)
            || Comparer.defaultComparer.compare(this.firstName, other.firstName);
    }
}

const people = [
    new Person("Alice", "Johnson")
    new Person("Bob", "Clark"),
];
people.sort(Comparer.defaultComparer.compare);
console.log(people); // Bob Clark,Alice Johnson

const obj1 = new Person("Bob", "Clark");
const obj2 = new Person("Bob", "Clark");
obj1 === obj2; // false
Equaler.defaultEqualer.equals(obj1, obj2); // true
```

***
