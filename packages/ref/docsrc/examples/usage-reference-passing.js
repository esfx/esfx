const { ref } = require("@esfx/ref");

function update(ref_r) {
    ref_r.value = 2;
}

let x = 1;
update(ref(() => x, _ => x = _));
print(x); // 2