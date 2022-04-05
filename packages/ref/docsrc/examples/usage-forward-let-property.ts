import { ref } from "@esfx/ref";

const ref_x = ref.at(b, "x"); // error, `b` has not yet been declared
let b = { x: 1 };