import { HierarchyIterable, Hierarchical, HierarchyProvider } from "@esfx/iter-hierarchy";

interface Node {
    parent?: Node;
    children?: Node[];
    // ...
}

const hierarchyProvider: HierarchyProvider<Node> = {
    parent(node: Node) { return node.parent; },
    children(node: Node) { return node.children; },
};

class MyHierarchyIterable implements HierarchyIterable<Node> {
    #nodes: Iterable<Node>;

    constructor(nodes: Iterable<Node>) {
        this.#nodes = nodes;
    }

    [Symbol.iterator]() {
        return this.#nodes[Symbol.iterator]();
    }

    [Hierarchical.hierarchy]() {
        return hierarchyProvider;
    }
}