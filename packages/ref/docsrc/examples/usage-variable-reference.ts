// <usage>
import { ref } from "@esfx/ref";

let x = 1;
const r = ref(() => x, _ => x = _);
print(r.value); // 1
r.value = 2;
print(x); // 2
// </usage>

declare var print;
