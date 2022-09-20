module.exports = require("yargs")
    .option("silent", { type: "boolean", alias: "s", default: false })
    .option("parallel", { type: "boolean", alias: "p", default: false })
    .option("topological", { type: "boolean", alias: "t" })
    .option("jobs", { type: "number", alias: "j" })
    .option("include", { type: "string", array: true })
    .option("exclude", { type: "string", array: true });