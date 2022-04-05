// <usage>
import { ref } from "@esfx/ref";

let count = 0;
let e = [0, 1, 2];
const ref_e = ref.at(e, count++); // `count++` is evaluated when Reference is taken.
print(ref_e.value); // 0
print(ref_e.value); // 0
print(count); // 1
// </usage>

declare var print;