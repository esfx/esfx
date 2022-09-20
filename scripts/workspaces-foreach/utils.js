// @ts-check
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const isWindows = /^win/.test(process.platform);

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
exports.exec = function exec(cmd, args = [], { ignoreExitCode, cwd, env, stdio = "inherit" } = {}) {
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
};

/**
 * @param {string} dirname
 */
exports.getPackageJson = async function getPackageJson(dirname) {
    try {
        return JSON.parse(await fs.promises.readFile(path.join(dirname, "package.json"), "utf8"));
    }
    catch {
    }
};

exports.Semaphore = class Semaphore {
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
};
