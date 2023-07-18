const fs = require("node:fs");
const path = require("node:path");
const projects = [];
for (const workspaceRoot of ["internal", "packages"]) {
    for (const entry of fs.readdirSync(workspaceRoot, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        if (fs.existsSync(path.join(workspaceRoot, entry.name, "jest.esm.config.js"))) {
            projects.push(`<rootDir>/${workspaceRoot}/${entry.name}/jest.esm.config.js`);
        }
    }
}
module.exports = { projects };