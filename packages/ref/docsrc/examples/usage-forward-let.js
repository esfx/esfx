const { ref } = require("@esfx/ref");

let a;

const ref_a = ref(() => a, _ => a = _);
ref_a.value = 1; // ok, no error as `a` has been declared.

const ref_b = ref(() => b, _ => b = _);
ref_b.value = 1; // error as `b` has not yet been declared.

let b;