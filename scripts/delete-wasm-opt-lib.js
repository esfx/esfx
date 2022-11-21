const fs = require("fs");
const path = require("path");
if (fs.existsSync(path.resolve("node_modules/wasm-opt/lib"))) {
    fs.rmSync(path.resolve("node_modules/wasm-opt/lib"), { recursive: true, force: true });
}