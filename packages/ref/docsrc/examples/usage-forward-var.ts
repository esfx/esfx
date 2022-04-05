import { ref } from "@esfx/ref";

const ref_a = ref(() => a, _ => a = _);
ref_a.value = 1; // ok, no error as `a` is a var.

var a: number;
