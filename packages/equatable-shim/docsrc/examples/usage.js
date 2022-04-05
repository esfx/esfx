require("@esfx/equatable-shim"); // triggers global-scope side effects
const { Equatable } = require("@esfx/equatable");

123[Equatable.hash]() // 123
