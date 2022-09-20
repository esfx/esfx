// @ts-check
const { cpus } = require("os");
const { getWorkspaces, getExecutionOrder, filterPartitionsHavingScript, execPartitions } = require("../../workspace");
const { exec } = require("../../utils.js");

/**
 * @param {string} script
 * @param {string[]} args
 * @param {object} opts
 * @param {boolean} [opts.parallel]
 * @param {boolean} [opts.topological]
 * @param {number} [opts.jobs]
 * @param {string[]} [opts.include]
 * @param {string[]} [opts.exclude]
 * @param {boolean} [opts.silent]
 */
async function run(script, args, {
    parallel = false,
    topological = false,
    jobs = parallel ? Math.max(1, cpus().length >>> 1) : 1,
    include = [],
    exclude = [],
    silent = false,
}) {
    const workspaces = await getWorkspaces(process.cwd(), { include, exclude });
    const partitions = getExecutionOrder(workspaces, parallel && jobs > 1, topological);
    const filteredPartitions = filterPartitionsHavingScript(partitions, script);
    return await runPartitioned(filteredPartitions, script, args, jobs, { force: true, silent });
}
exports.run = run;

/**
 * @param {import("../../workspace").Workspace[][]} partitions
 * @param {string} script
 * @param {string[]} args
 * @param {number} jobs
 * @param {object} opts
 * @param {boolean} [opts.force]
 * @param {boolean} [opts.silent]
 */
async function runPartitioned(partitions, script, args, jobs, { force = false, silent = false } = {}) {
    if (!force) partitions = filterPartitionsHavingScript(partitions, script);
    return await execPartitions(partitions, jobs, workspace => runOne(workspace, script, args, { force, silent }));
}
exports.runPartitioned = runPartitioned;

/**
 * @param {import("../../workspace").Workspace} workspace
 * @param {string} script
 * @param {string[]} args
 * @param {object} opts
 * @param {boolean} [opts.force]
 * @param {boolean} [opts.silent]
 */
async function runOne(workspace, script, args, { force = false, silent = false } = {}) {
    if (force || workspace.packageJson?.scripts?.[script]) {
        if (workspace.name === ".") {
            await exec("yarn", ["--no-progress", "run", script, ...args], {
                cwd: workspace.dirname,
                stdio: silent ? "ignore" : ["inherit", 2, "inherit"],
            });
        }
        else {
            await exec("yarn", ["--no-progress", "workspace", workspace.name, "run", script, ...args], {
                cwd: workspace.dirname,
                stdio: silent ? "ignore" : ["inherit", 2, "inherit"],
            });
        }
    }
}
exports.runOne = runOne;