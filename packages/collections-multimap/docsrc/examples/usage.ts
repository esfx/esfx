import { MultiMap } from "@esfx/collections-multimap";

const multi = new MultiMap<string, number>();
multi.add("a", 1);
multi.add("a", 2);
multi.add("b", 3);
multi.size; // 3
[...multi.get("a")]; // [1, 2]
[...multi.get("b")]; // [3]