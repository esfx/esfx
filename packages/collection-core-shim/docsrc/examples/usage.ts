import "@esfx/collection-core-shim"; // triggers global-scope side effects
import { Collection } from "@esfx/collection-core";

[1, 2, 3][Collection.size]; // 3
