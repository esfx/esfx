# `@esfx/iter-grouping`

An API for describing grouped iterables.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/iter-grouping
```

# Usage

```ts
import { groupBy } from "@esfx/iter-fn";
import { Grouping } from "@esfx/iter-grouping";

const people = [{ familyName: "Smith", givenName: "Alice" }, { familyName: "Smith", givenName: "Bob" }];
for (const group of groupBy(people, person => person.familyName)) {
    group.key; // "Smith"
    group.values; // Iterable of "Alice", "Bob"
    group instanceof Grouping; // true
}

```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/iter-grouping.html).

