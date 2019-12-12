import { HierarchyProvider } from "../../";

export interface Node {
    name: string;
    parent?: Node;
    children?: Node[];
    toJSON?: () => any;
    marker?: boolean;
}

function makeTree(node: Node, parent?: Node) {
    node.toJSON = () => node.name;
    node.parent = parent;
    if (node.children) {
        for (const child of node.children) {
            if (child) makeTree(child, node);
        }
    }

    return node;
}

// Tree:
//                               nodeA
//                                 |
//                   --------------+-------
//                  /              |       \
//            nodeAA             nodeAB     nodeAC
//               |                             |
//         ------+------                       |
//        /      |      \                      |
// nodeAAA    nodeAAB    nodeAAC            nodeACA
//    |
//    |
//    |
// nodeAAAA

export const nodeAAAA: Node = { name: "AAAA" }
export const nodeAAA: Node = { name: "AAA", children: [nodeAAAA] };
export const nodeAAB: Node = { name: "AAB", marker: true };
export const nodeAAC: Node = { name: "AAC" };
export const nodeAA: Node = { name: "AA", children: [nodeAAA, nodeAAB, nodeAAC] };
export const nodeAB: Node = { name: "AB" };
export const nodeACA: Node = { name: "ACA" };
export const nodeAC: Node = { name: "AC", children: [nodeACA] };
export const nodeA: Node = { name: "A", children: [nodeAA, nodeAB, nodeAC] };
makeTree(nodeA);

export const badNode: Node = { name: "bad", children: [undefined!] };

export const nodeHierarchy: HierarchyProvider<Node> = {
    owns(_: Node) {
        return true;
    },
    parent(node: Node) {
        return node.parent;
    },
    children(node: Node) {
        return node.children || [];
    }
};
