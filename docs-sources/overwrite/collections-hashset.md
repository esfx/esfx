---
uid: '@esfx/collections-hashset!'
---

Provides the @"@esfx/collections-hashset!HashSet:class" class, a collection class that utilizes @"@esfx/collection-core!" and @"@esfx/equatable!".

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/collections-hashset
```

# Usage

## [TypeScript](#tab/ts)
```ts
import { HashSet } from "@esfx/collections-hashset";
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

const obj1 = new Person("Bob", "Clark");
const obj2 = new Person("Bob", "Clark");

const set = new Set<Person>(); // native ECMAScript Set
set.add(obj1);
set.add(obj2);
set.length; // 2

const hashSet = new HashSet<Person>();
hashSet.add(obj1);
hashSet.add(obj2);
hashSet.length; // 1
```

## [JavaScript (CommonJS)](#tab/js)
```js
const { HashSet } = require("@esfx/collections-hashset");
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

const obj1 = new Person("Bob", "Clark");
const obj2 = new Person("Bob", "Clark");

const set = new Set(); // native ECMAScript Set
set.add(obj1);
set.add(obj2);
set.length; // 2

const hashSet = new HashSet();
hashSet.add(obj1);
hashSet.add(obj2);
hashSet.length; // 1
```

***
