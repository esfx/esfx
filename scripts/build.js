const { spawn } = require("child_process");
const { default: chalk } = require("chalk");
const { CancellationToken, CancelError } = require("prex");
const log = require("fancy-log");
const isWindows = /^win/.test(process.platform);

/**
 * @param {number} timeout
 * @param {() => Promise} action
 */
function debounce(timeout, action) {
    /** @type {{ promise: Promise, resolve: (value: any) => void, reject: (value: any) => void }} */
    let deferred;
    let timer;

    function enqueue() {
        if (timer) {
            clearTimeout(timer);
            timer = undefined;
        }
        if (!deferred) {
            deferred = {};
            deferred.promise = new Promise((resolve, reject) => {
                deferred.resolve = resolve;
                deferred.reject = reject;
            });
        }
        timer = setTimeout(run, timeout);
        return deferred.promise;
    }

    function run() {
        if (timer) {
            clearTimeout(timer);
            timer = undefined;
        }
        const currentDeferred = deferred;
        deferred = undefined;
        try {
            currentDeferred.resolve(action());
        }
        catch (e) {
            currentDeferred.reject(e);
        }
    }

    return enqueue;
}

/**
 * @param {(projects: readonly string[]) => Promise} action
 */
function createProjectQueue(action) {
    /** @type {string[]} */
    const projects = [];
    const debouncer = debounce(100, async () => {
        const currentProjects = projects.slice();
        projects.length = 0;
        return action(currentProjects);
    });
    /**
     * @param {string} project
     */
    function enqueue(project) {
        projects.push(project);
        return debouncer();
    }
    return enqueue;
}

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {object} options
 * @param {boolean} [options.ignoreExitCode]
 * @param {boolean} [options.verbose]
 * @param {CancellationToken} [options.cancelToken]
 * @returns {Promise<{exitCode: number}>}
 */
function exec(cmd, args, { ignoreExitCode, verbose, cancelToken = CancellationToken.none } = {}) {
    return new Promise((resolve, reject) => {
        cancelToken.throwIfCancellationRequested();
        const shell = isWindows ? "cmd" : "/bin/sh";
        const shellArgs = isWindows ? ["/c", cmd.includes(" ") >= 0 ? `"${cmd}"` : cmd, ...args] : ["-c", `${cmd} ${args.join(" ")}`];
        if (verbose) log(`> ${chalk.green(cmd)} ${args.join(" ")}`);
        const child = spawn(shell, shellArgs, { stdio: "inherit", windowsVerbatimArguments: true });
        const reg = cancelToken.register(() => {
            child.removeAllListeners();
            if (verbose) log(`${chalk.red("killing")} '${chalk.green(cmd)} ${args.join(" ")}'...`);
            child.kill("SIGINT");
            child.kill("SIGTERM");
            reject(new CancelError());
        });
        child.on("exit", (exitCode) => {
            child.removeAllListeners();
            reg.unregister();
            if (exitCode === 0 || ignoreExitCode) {
                resolve({ exitCode });
            }
            else {
                reject(new Error(`Process exited with code: ${exitCode}`));
            }
        });
        child.on("error", error => {
            child.removeAllListeners();
            reg.unregister();
            reject(error);
        });
    });
}
exports.exec = exec;

const buildProject = createProjectQueue(async projects => {
    await exec(process.execPath, [require.resolve("typescript/lib/tsc.js"), "-b", ...projects]);
});

const forceBuildProject = createProjectQueue(async projects => {
    await exec(process.execPath, [require.resolve("typescript/lib/tsc.js"), "-b", "--force", ...projects]);
});

/**
 * Build a project.
 * @param {string} project
 * @param {object} options
 * @param {boolean} [options.force]
 */
exports.buildProject = (project, {force} = {}) => force 
    ? forceBuildProject(project) 
    : buildProject(project);

/**
 * Clean a project's outputs.
 * @param {string} project
 */
exports.cleanProject = createProjectQueue(async projects => {
    await exec(process.execPath, [require.resolve("typescript/lib/tsc.js"), "-b", "--clean", ...projects]);
});

/**
 * Watch a project for changes.
 * @param {string} project
 */
exports.watchProject = createProjectQueue(async projects => {
    await exec(process.execPath, [require.resolve("typescript/lib/tsc.js"), "-b", "--watch", ...projects]);
});
