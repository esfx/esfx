const { spawn } = require("child_process");
const { default: chalk } = require("chalk");
const { CancellationToken, CancelError } = require("prex");
const log = require("fancy-log");
const isWindows = /^win/.test(process.platform);

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