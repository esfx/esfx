const { Hierarchical } = require("@esfx/iter-hierarchy");

const hierarchyProvider = {
    parent(node) { return node.parent; },
    children(node) { return node.children; },
};

class MyHierarchyIterable {
    #nodes;

    constructor(nodes) {
        this.#nodes = nodes;
    }

    [Symbol.iterator]() {
        return this.#nodes[Symbol.iterator]();
    }

    [Hierarchical.hierarchy]() {
        return hierarchyProvider;
    }
}