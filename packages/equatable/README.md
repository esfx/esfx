# `@esfx/equatable`

The `@esfx/equatable` package provides a low level API for defining equality.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/equatable
```

# Usage

```ts
import { Equatable, Equaler, Comparable, Comparer } from "@esfx/equatable"; 

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

# API

You can read more about the API [here](https://esfx.github.io/esfx/modules/equatable.html).
