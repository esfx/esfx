// <usage>
import { ref, Reference } from "@esfx/ref";

function update(ref_r: Reference<number>) {
    ref_r.value = 2;
}

let x = 1;
update(ref(() => x, _ => x = _));
print(x); // 2
// </usage>

declare var print;