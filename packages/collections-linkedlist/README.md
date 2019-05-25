# `@esfx/collections-linkedlist`

The `@esfx/collections-linkedlist` package provides a linked-list implementation that utilizes `@esfx/collection-core` and `@esfx/equatable`.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/collections-linkedlist
```

# Usage

```ts
import { LinkedList } from "equatable/collections-linkedlist";

const list = new LinkedList();
const n1 = list.push("first");
const n2 = list.push("second");
n2.value = "second updated";
[...list]; // first,second updated
```

# API

You can read more about the API [here](https://esfx.github.io/esfx/modules/collections_linkedlist.html).
