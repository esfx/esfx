const { map } = require("@esfx/iter-fn");
const x = map([1, 2, 3], x => x * 2);
x; // [2, 4, 6]
