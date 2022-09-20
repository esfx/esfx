// @ts-check
const { cpus } = require("os");
const { getWorkspaces, getExecutionOrder, execPartitions, getRoot } = require("../../workspace");
const { exec } = require("../../utils.js");
const { runOne } = require("../run/index.js");
const fs = require("fs");
const path = require("path");

/**
 * @param {object} opts
 * @param {boolean} [opts.parallel]
 * @param {boolean} [opts.topological]
 * @param {number} [opts.jobs]
 * @param {string[]} [opts.include]
 * @param {string[]} [opts.exclude]
 * @param {boolean} [opts.silent]
 */
async function pack({
    parallel = false,
    topological = false,
    jobs = parallel ? Math.max(1, cpus().length >>> 1) : 1,
    include = [],
    exclude = [],
    silent = false
}) {
    const root = await getRoot(process.cwd());
    const workspaces = await getWorkspaces(process.cwd(), { include, exclude });
    const partitions = getExecutionOrder(workspaces, parallel && jobs > 1, topological);

    await runOne(root, "prepare", [], { silent });
    await runOne(root, "prepack", [], { silent });

    /** @type {string[]} */
    const outputs = [];
    const { errorCount } = await execPartitions(partitions, jobs, async workspace => {
        await exec("yarn", ["workspace", workspace.name, "pack"], {
            cwd: workspace.dirname,
            stdio: silent ? "ignore" : ["inherit", 2, "inherit"],
        });
        if (workspace.packageJson) {
            const packageName = `${workspace.packageJson.name}`;
            const basename = packageName.startsWith("@") ?
                packageName.slice(1).replace(/\//g, "-") :
                packageName;
            const version = `${workspace.packageJson.version || "0.0.0"}`;
            const candidate = path.join(workspace.dirname, `${basename}-${version}.tgz`);
            if (fs.existsSync(candidate)) {
                outputs.push(candidate);
            }
            else {
                const candidate = path.join(workspace.dirname, `${basename}-v${version}.tgz`);
                if (fs.existsSync(candidate)) {
                    outputs.push(candidate);
                }
            }
        }
    });

    if (errorCount === 0) {
        await runOne(root, "postpack", [], { silent });
    }

    return { errorCount: 0, outputs };
}
exports.pack = pack;