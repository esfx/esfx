#!/usr/bin/env node
// @ts-check
const findRoot = require("find-yarn-workspace-root");
const { execSync, spawn } = require("child_process");
const { cpus } = require("os");
const fs = require("fs");
const path = require("path");
const isWindows = /^win/.test(process.platform);

class Semaphore {
    /** @type {((value?: void) => void)[]} */
    #waiters = [];
    #currentCount;

    /**
     * @param {number} initialCount 
     */
    constructor(initialCount) {
        this.#currentCount = initialCount;
    }

    async wait() {
        if (this.#currentCount > 0) {
            this.#currentCount--;
            return;
        }
        await new Promise(resolve => { this.#waiters.push(resolve); });
    }

    releaseOne() {
        const waiter = this.#waiters.shift();
        if (waiter) {
            waiter();
        }
        else {
            this.#currentCount++;
        }
    }
}

require("yargs")
    .scriptName("workspaces-foreach")
    .usage("$0 <cmd> [args]")
    .option("parallel", { type: "boolean", alias: "p", default: false })
    .option("topological", { type: "boolean", alias: "t", default: false })
    .option("jobs", { type: "number", alias: "j" })
    .option("include", { type: "string", array: true })
    .option("exclude", { type: "string", array: true })
    .command("run [script]", "",
        yargs => yargs.positional("script", { type: "string", demandOption: true }),
        async ({ parallel, topological, jobs = Math.max(1, cpus().length >>> 1), include = [], exclude = [], script, _: args }) => {
            const root = findRoot(process.cwd());
            if (!root) throw new Error("Could not determine root.");

            const includeSet = new Set(include);
            const excludeSet = new Set(exclude);
            const output = execSync("yarn --silent workspaces info", { cwd: root, stdio: ["pipe", "pipe", "ignore"], windowsHide: true, encoding: "utf8" });

            /** @type {JsonWorkspacesInfo} */
            const info = JSON.parse(output);

            /** @type {Workspace[]} */
            const workspaces = Object.entries(info).map(([name, { location, workspaceDependencies, mismatchedWorkspaceDependencies }]) => ({
                name,
                dirname: path.join(root, location),
                location,
                workspaceDependencies,
                mismatchedWorkspaceDependencies,
                packageJson: getPackageJson(path.join(root, location))
            }));

            const matchedWorkspaces = workspaces
                .filter(({ name }) => !includeSet.size || includeSet.has(name))
                .filter(({ name }) => !excludeSet.has(name));

            const executionOrder = getExecutionOrder(matchedWorkspaces, parallel && jobs > 1, topological)
                .map(partition => partition.filter(workspace => typeof workspace.packageJson?.scripts?.[script] === "string"))
                .filter(partition => partition.length > 0);

            const sem = new Semaphore(parallel ? jobs : 1);

            let errorCount = 0;
            for (const partition of executionOrder) {
                await Promise.all(partition.map(async workspace => {
                    await sem.wait();
                    try {
                        await exec("yarn", ["workspace", workspace.name, "run", script, ...args], {
                            cwd: workspace.dirname,
                            stdio: "inherit",
                        });
                    }
                    catch {
                        errorCount++;
                    }
                    finally {
                        sem.releaseOne();
                    }
                }));
            }

            process.exit(errorCount);
        }
    )
    .help()
    .argv;

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {object} options
 * @param {boolean} [options.ignoreExitCode]
 * @param {string} [options.cwd]
 * @param {typeof process.env} [options.env]
 * @param {import("child_process").StdioOptions} [options.stdio]
 * @returns {Promise<{ exitCode: number | null, stdout: string, stderr: string }>}
 */
function exec(cmd, args = [], { ignoreExitCode, cwd, env, stdio = "inherit" } = {}) {
    return new Promise((resolve, reject) => {
        const shell = isWindows ? "cmd" : "/bin/sh";
        const shellArgs = isWindows ? ["/c", cmd.includes(" ") ? `"${cmd}"` : cmd, ...args] : ["-c", `${cmd} ${args.join(" ")}`];
        const child = spawn(shell, shellArgs, { stdio, cwd, env, windowsVerbatimArguments: true, windowsHide: true });
        let stdout = "";
        let stderr = "";
        child.stdout?.setEncoding("utf-8").on("data", data => stdout += data);
        child.stderr?.setEncoding("utf-8").on("data", data => stderr += data);
        child.on("exit", (exitCode) => {
            child.removeAllListeners();
            child.stdout?.removeAllListeners();
            child.stderr?.removeAllListeners();
            if (exitCode === 0 || ignoreExitCode) {
                resolve({ exitCode, stdout, stderr });
            }
            else {
                reject(new Error(`Process exited with code: ${exitCode}`));
            }
        });
        child.on("error", error => {
            child.removeAllListeners();
            child.stdout?.removeAllListeners();
            child.stderr?.removeAllListeners();
            reject(error);
        });
    });
}

/**
 * @param {string} dirname
 */
function getPackageJson(dirname) {
    try {
        return JSON.parse(fs.readFileSync(path.join(dirname, "package.json"), "utf8"));
    }
    catch {
    }
}

/**
 * @param {Workspace[]} workspaces
 * @param {boolean} parallel
 * @param {boolean} topological
 * @returns {Workspace[][]}
 */
function getExecutionOrder(workspaces, parallel, topological) {
    const sorted = topological ? getTopologicalExecutionOrder(workspaces) : workspaces;
    const partitioned = parallel ? getParallelExecutionOrder(sorted) : [sorted];
    return partitioned;
}

/**
 * @param {Workspace[]} workspaces
 * @returns {Workspace[]}
 */
function getTopologicalExecutionOrder(workspaces) {
    const lookup = new Map(workspaces.map(({ name }, i) => [name, i]));
    const adjacency = workspaces.map(workspace => workspace.workspaceDependencies.map(dep => lookup.get(dep) ?? -1));

    /** @type {number[]} */
    const stack = [];

    const visited = workspaces.map(() => false);
    for (let i = 0; i < workspaces.length; i++) {
        if (!visited[i]) {
            topoSortRec(i, visited, stack);
        }
    }

    const indices = workspaces.map((_, i) => i);
    indices.sort((a, b) => stack.indexOf(a) - stack.indexOf(b));
    return indices.map(i => workspaces[i]);

    /**
     * @param {number} v
     * @param {boolean[]} visited
     * @param {number[]} stack
     */
    function topoSortRec(v, visited, stack) {
        visited[v] = true;
        for (let i = 0; i < adjacency[v].length; i++) {
            if (!visited[adjacency[v][i]]) {
                topoSortRec(adjacency[v][i], visited, stack);
            }
        }
        stack.push(v);
    }
}

/**
 * @param {Workspace[]} workspaces
 * @returns {Workspace[][]}
 */
function getParallelExecutionOrder(workspaces) {
    /** @type {Workspace[][]} */
    const partitions = [[]];
    let index = 0;
    for (const workspace of workspaces) {
        const partition = partitions[index];
        if (partition.some(partitioned => workspace.workspaceDependencies.includes(partitioned.name))) {
            index = partitions.push([workspace]) - 1;
        }
        else {
            partition.push(workspace);
        }
    }
    return partitions;
}

/**
 * @typedef {Record<string, JsonWorkspaceInfo>} JsonWorkspacesInfo
 */

/**
 * @typedef JsonWorkspaceInfo
 * @property {string} location
 * @property {string[]} workspaceDependencies
 * @property {string[]} mismatchedWorkspaceDependencies
 */

/**
 * @typedef Workspace
 * @property {string} name
 * @property {string} dirname
 * @property {string} location
 * @property {string[]} workspaceDependencies
 * @property {string[]} mismatchedWorkspaceDependencies
 * @property {*} packageJson
 */