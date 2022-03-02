# `@esfx/iter-hierarchy`

A Symbol-based API for defining an Iterable with an inherent hierarchy.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/iter-hierarchy
```

# Usage

```ts
import { HierarchyIterable, Hierarchical, HierarchyProvider } from "@esfx/iter-hierarchy";

interface Node {
    parent?: Node;
    children?: Node[];
    ...
}

const hierarchyProvider: HierarchyProvider<Node> = {
    parent(node: Node) { return node.parent; },
    children(node: Node) { return node.children; },
};

class MyHierarchyIterable implements HierarchyIterable<Node> {
    private #nodes: Iterable<Node>;
    constructor(nodes: Iterable<Node>) {
        this.#nodes = nodes;
    }

    [Symbol.iterator]() {
        return this.#nodes[Symbol.iterator]();
    }

    [Hierarchical.hierarchy]() {
        return hierarhcyProvider;
    }
}
```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/iter-hierarchy.html).

