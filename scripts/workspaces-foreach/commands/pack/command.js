// @ts-check
const { cpus } = require("os");
const { pack } = require("./index.js");
const { command } = require("../../command.js");

module.exports = command.from(require("../../baseOpts.js"))(
    "pack",
    "",
    yargs => yargs
        .option("json", { type: "boolean" }),
    async ({
        parallel,
        topological = true,
        jobs = Math.max(1, cpus().length >>> 1),
        include = [],
        exclude = [],
        json = false,
        silent = false,
    }) => {
        const { errorCount, outputs } = await pack({ parallel, topological, jobs, include, exclude, silent });
        if (json) {
            process.stdout.write(JSON.stringify(outputs, undefined, "  "));
        }
        else if (!silent) {
            process.stdout.write("Outputs:\n" + outputs.join("\n"));
        }
        process.exit(errorCount);
    });