// @ts-check
const { Hierarchical } = require("@esfx/async-iter-hierarchy");

const hierarchyProvider = {
    parent(node) { return node.parent; },
    children(node) { return node.children; },
};

class MyAsyncHierarchyIterable {
    #nodes;
    
    constructor(nodes) {
        this.#nodes = nodes;
    }

    [Symbol.asyncIterator]() {
        return this.#nodes[Symbol.asyncIterator]();
    }

    [Hierarchical.hierarchy]() {
        return hierarchyProvider;
    }
}
