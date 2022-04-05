import { AsyncHierarchyIterable, Hierarchical, HierarchyProvider } from "@esfx/async-iter-hierarchy";

interface Node {
    parent?: Node;
    children?: Node[];
    // ...
}

const hierarchyProvider: HierarchyProvider<Node> = {
    parent(node: Node) { return node.parent; },
    children(node: Node) { return node.children; },
};

class MyAsyncHierarchyIterable implements AsyncHierarchyIterable<Node> {
    #nodes: AsyncIterable<Node>;
    
    constructor(nodes: AsyncIterable<Node>) {
        this.#nodes = nodes;
    }

    [Symbol.asyncIterator]() {
        return this.#nodes[Symbol.asyncIterator]();
    }

    [Hierarchical.hierarchy]() {
        return hierarchyProvider;
    }
}