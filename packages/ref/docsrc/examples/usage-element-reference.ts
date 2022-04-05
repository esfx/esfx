// <usage>
import { ref } from "@esfx/ref";

let ar = [1];
const r = ref.at(ar, 0);
print(r.value); // 1
r.value = 2;
print(ar); // [2]
// </usage>

declare var print;