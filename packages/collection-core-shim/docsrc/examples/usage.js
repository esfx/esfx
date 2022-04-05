require("@esfx/collection-core-shim"); // triggers global-scope side effects
const { Collection } = require("@esfx/collection-core");

[1, 2, 3][Collection.size]; // 3
