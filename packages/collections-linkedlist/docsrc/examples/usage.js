const { LinkedList } = require("@esfx/collections-linkedlist");

const list = new LinkedList();
const n1 = list.push("first");
const n2 = list.push("second");
n2.value = "second updated";
[...list]; // first,second updated