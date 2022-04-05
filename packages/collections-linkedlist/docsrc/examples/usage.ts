import { LinkedList, LinkedListNode } from "@esfx/collections-linkedlist";

const list = new LinkedList<string>();
const n1: LinkedListNode<string> = list.push("first");
const n2: LinkedListNode<string> = list.push("second");
n2.value = "second updated";
[...list]; // first,second updated
