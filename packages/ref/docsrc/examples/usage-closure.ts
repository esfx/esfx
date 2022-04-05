// <usage>
import { ref } from "@esfx/ref";

function f() {
    let x = 1;
    return [ref(() => x, _ => x = _), () => print(x)] as const;
}

const [r, p] = f();
p(); // 1
r.value = 2;
p(); // 2
// </usage>

declare var print;