// @ts-check
const { Sandbox } = require("vm-sandbox");

const sandbox = new Sandbox({
    base: __dirname,
    context: global,
    resolve: request => {
        const normalizedRequest = request.replace(/\\/g, "/");
        if (normalizedRequest === "typescript") return require.resolve("typescript");
        if (normalizedRequest === "./dist/external-module-map-plugin") {
            return require.resolve("./patches/@strictsoftware/typedoc-plugin-monorepo/dist/external-module-map-plugin.js");
        }
        return undefined;
    }
});

module.exports = /** @type {typeof import("./typedoc.sandbox")} */(sandbox.require("./typedoc.sandbox.js"));