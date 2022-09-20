// @ts-check
const findRoot = require("find-yarn-workspace-root");
const path = require("path");
const { getPackageJson, exec, Semaphore } = require("./utils");

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

/**
 * @returns {Promise<Workspace>}
 */
async function getRoot(cwd = process.cwd(), ) {
    const dirname = findRoot(cwd);
    if (!dirname) throw new Error("Could not determine root.");
    const location = path.join(dirname, "package.json");
    const packageJson = await getPackageJson(path.join(dirname, location));
    return {
        name: ".",
        dirname,
        location,
        workspaceDependencies: [],
        mismatchedWorkspaceDependencies: [],
        packageJson
    };
}
exports.getRoot = getRoot;

/**
 * @param {string} cwd
 * @param {object} opts
 * @param {readonly string[]} [opts.include]
 * @param {readonly string[]} [opts.exclude]
 */
async function getWorkspaces(cwd = process.cwd(), { include = [], exclude = [] } = {}) {
    const root = findRoot(cwd);
    if (!root) throw new Error("Could not determine root.");

    const includeSet = new Set(include);
    const excludeSet = new Set(exclude);
    const result = await exec("yarn", ["--silent", "workspaces", "info"], { cwd: root, stdio: ["pipe", "pipe", "ignore"] });

    /** @type {JsonWorkspacesInfo} */
    const info = JSON.parse(result.stdout);

    /** @type {Workspace[]} */
    const workspaces = [];
    for (const [name, { location, workspaceDependencies, mismatchedWorkspaceDependencies }] of Object.entries(info)) {
        workspaces.push({
            name,
            dirname: path.join(root, location),
            location,
            workspaceDependencies,
            mismatchedWorkspaceDependencies,
            packageJson: await getPackageJson(path.join(root, location))
        });
    }

    return workspaces
        .filter(({ name }) => !includeSet.size || includeSet.has(name))
        .filter(({ name }) => !excludeSet.has(name));
}
exports.getWorkspaces = getWorkspaces;

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
exports.getExecutionOrder = getExecutionOrder;

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
exports.getTopologicalExecutionOrder = getTopologicalExecutionOrder;

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
exports.getParallelExecutionOrder = getParallelExecutionOrder;

/**
 * @param {Workspace[][]} partitions
 * @param {(workspace: Workspace) => boolean} predicate
 */
function filterPartitions(partitions, predicate) {
    return partitions
        .map(partition => partition.filter(predicate))
        .filter(partition => partition.length > 0);
}
exports.filterPartitions = filterPartitions;

/**
 * @param {Workspace[][]} partitions
 * @param {string} script
 */
function filterPartitionsHavingScript(partitions, script) {
    return filterPartitions(partitions, workspace => typeof workspace.packageJson?.scripts?.[script] === "string");
}
exports.filterPartitionsHavingScript = filterPartitionsHavingScript;


/**
 * @param {Workspace[][]} partitions
 * @param {number} jobs
 * @param {(workspace: Workspace) => void | Promise<void>} cb
 */
 async function execPartitions(partitions, jobs, cb) {
    let errorCount = 0;
    if (jobs >= 1) {
        for (const partition of partitions) {
            await execParallel(partition, jobs, cb);
        }
    }
    else {
        for (const partition of partitions) {
            await execSerial(partition, cb);
        }
    }
    return { errorCount };
}
exports.execPartitions = execPartitions;

/**
 * @param {Workspace[]} partition
 * @param {number} jobs
 * @param {(workspace: Workspace) => void | Promise<void>} cb
 */
async function execParallel(partition, jobs, cb) {
    if (jobs <= 1) {
        return await execSerial(partition, cb);
    }
    let errorCount = 0;
    const sem = new Semaphore(jobs);
    await Promise.all(partition.map(async workspace => {
        await sem.wait();
        try {
            await cb(workspace);
        }
        catch {
            errorCount++;
        }
        finally {
            sem.releaseOne();
        }
    }));
    return { errorCount };
}

/**
 * @param {Workspace[]} partition
 * @param {(workspace: Workspace) => void | Promise<void>} cb
 */
async function execSerial(partition, cb) {
    let errorCount = 0;
    for (const workspace of partition) {
        try {
            await cb(workspace);
        }
        catch {
            errorCount++;
        }
    }
    return { errorCount };
}
