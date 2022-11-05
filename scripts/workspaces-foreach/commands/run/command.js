// @ts-check
const { cpus } = require("os");
const { run } = require("./index.js");
const { command } = require("../../command.js");

module.exports = command.from(require("../../baseOpts.js"))(
    "run <script>",
    "",
    yargs => yargs.positional("script", { type: "string", demandOption: true }),
    async ({
        parallel = false,
        topological = false,
        jobs = Math.max(1, cpus().length >>> 1),
        include = [],
        exclude = [],
        script,
        _: [...args],
        silent = false
    }) => {
        if (args.length && args[0] === "run") args.shift();
        const { errorCount } = await run(script, args.map(String), { parallel, topological, jobs, include, exclude, silent });
        process.exit(errorCount);
    });