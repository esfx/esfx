// @ts-check
const { cpus } = require("os");
const { pack } = require("./index.js");
const { command } = require("../../command.js");

module.exports = command.from(require("../../baseOpts.js"))(
    "pack",
    "",
    yargs => yargs
        .option("json", { type: "boolean", conflicts: ["files"] })
        .option("files", { type: "boolean", conflicts: ["json"] }),
    async ({
        parallel,
        topological = true,
        jobs = Math.max(1, cpus().length >>> 1),
        include = [],
        exclude = [],
        json = false,
        files = false,
        silent = false,
    }) => {
        const { errorCount, outputs } = await pack({ parallel, topological, jobs, include, exclude, silent });
        if (json) {
            process.stdout.write(JSON.stringify(outputs) + "\n");
        }
        else if (files) {
            process.stdout.write(outputs.join("\n") + "\n");
        }
        else if (!silent) {
            process.stdout.write("Outputs:\n" + outputs.join("\n") + "\n");
        }
        process.exit(errorCount);
    });