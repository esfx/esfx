// <usage>
import { ref, Reference } from "@esfx/ref";

function max(ref_first: Reference<number>, ref_second: Reference<number>, ref_third: Reference<number>) {
    const ref_max = ref_first.value > ref_second.value ? ref_first : ref_second;
    return ref_max.value > ref_third.value ? ref_max : ref_third;
}

let x = 1, y = 2, z = 3;
const ref_x = ref(() => x, _ => x = _);
const ref_y = ref(() => y, _ => y = _);
const ref_z = ref(() => z, _ => z = _);
const ref_w = max(ref_x, ref_y, ref_z);
ref_w.value = 4;
print(x); // 1
print(y); // 2
print(z); // 4
// </usage>

declare var print;