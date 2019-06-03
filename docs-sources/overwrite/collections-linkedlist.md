---
uid: collections-linkedlist
---

Provides the @"collections-linkedlist.LinkedList" class, a linked-list implementation that utilizes @"collection-core" and @"equatable".

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/collections-linkedlist
```

# Usage

## [TypeScript](#tab/ts)
```ts
import { LinkedList, LinkedListNode } from "equatable/collections-linkedlist";

const list = new LinkedList<string>();
const n1: LinkedListNode<string> = list.push("first");
const n2: LinkedListNode<string> = list.push("second");
n2.value = "second updated";
[...list]; // first,second updated
```

## [JavaScript (CommonJS)](#tab/js)
```js
const { LinkedList } = require("equatable/collections-linkedlist");

const list = new LinkedList();
const n1 = list.push("first");
const n2 = list.push("second");
n2.value = "second updated";
[...list]; // first,second updated
```

***
