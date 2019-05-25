/** @type {import("typedoc-plugin-linkrewriter/dist/plugin").Links} */
const R = String.raw;
module.exports = {
    [R`^packages/([^/]+)(?:#readme|/README.md)`](_, name) {
        return `modules/${name.replace(/-/g, "_")}.html`;
    },
    [R`^\.\./([^/]+)(?:#readme|/README.md)`](_, name) {
        return `./${name.replace(/-/g, "_")}.html`;
    },
};