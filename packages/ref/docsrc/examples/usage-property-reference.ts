// <usage>
import { ref } from "@esfx/ref";

let o = { x: 1 };
const r = ref.at(o, "x");
print(r.value); // 1
r.value = 2;
print(o); // { x: 2 }
// </usage>

declare var print;