# `@esfx/async-iter-hierarchy`

A Symbol-based API for defining an ECMAScript AsyncIterable with an inherent hierarchy.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-iter-hierarchy
```

# Usage

```ts
import { AsyncHierarchyIterable, Hierarchical, HierarchyProvider } from "@esfx/async-iter-hierarchy";

interface Node {
    parent?: Node;
    children?: Node[];
    ...
}

const hierarchyProvider: HierarchyProvider<Node> = {
    parent(node: Node) { return node.parent; },
    children(node: Node) { return node.children; },
};

class MyAsyncHierarchyIterable implements AsyncHierarchyIterable<Node> {
    private #nodes: AsyncIterable<Node>;
    constructor(nodes: AsyncIterable<Node>) {
        this.#nodes = nodes;
    }

    [Symbol.asyncIterator]() {
        return this.#nodes[Symbol.asyncIterator]();
    }

    [Hierarchical.hierarchy]() {
        return hierarhcyProvider;
    }
}
```

# API

You can read more about the API [here](https://esfx.github.io/esfx/api/async-iter-hierarchy.html).

