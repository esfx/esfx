const { ref } = require("@esfx/ref");

let ar = [1];
const r = ref.at(ar, 0);
print(r.value); // 1
r.value = 2;
print(ar); // [2]