import { createRequire } from "node:module";
const __require = createRequire(import.meta.url);
export function resolve(id, options) {
    return __require.resolve(id, options);
}
