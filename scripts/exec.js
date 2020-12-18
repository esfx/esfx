const { spawn } = require("child_process");
const { default: chalk } = require("chalk");
const log = require("fancy-log");
const isWindows = /^win/.test(process.platform);

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {object} options
 * @param {boolean} [options.ignoreExitCode]
 * @param {boolean} [options.verbose]
 * @param {string} [options.cwd]
 * @returns {Promise<{exitCode: number}>}
 */
function exec(cmd, args = [], { ignoreExitCode, verbose, cwd } = {}) {
    return new Promise((resolve, reject) => {
        const shell = isWindows ? "cmd" : "/bin/sh";
        const shellArgs = isWindows ? ["/c", cmd.includes(" ") >= 0 ? `"${cmd}"` : cmd, ...args] : ["-c", `${cmd} ${args.join(" ")}`];
        if (verbose) log(`> ${chalk.green(cmd)} ${args.join(" ")}`);
        const child = spawn(shell, shellArgs, { stdio: "inherit", cwd, windowsVerbatimArguments: true });
        child.on("exit", (exitCode) => {
            child.removeAllListeners();
            if (exitCode === 0 || ignoreExitCode) {
                resolve({ exitCode });
            }
            else {
                reject(new Error(`Process exited with code: ${exitCode}`));
            }
        });
        child.on("error", error => {
            child.removeAllListeners();
            reject(error);
        });
    });
}
exports.exec = exec;

class ArgsBuilder {
    constructor(args = []) {
        this.args = args;
    }
    addValue(value) {
        if (value === undefined) return;
        if (Array.isArray(value)) {
            for (const v of value) {
                this.addValue(v);
            }
        }
        else {
            this.args.push(value);
        }
    }
    addSwitch(name, value, defaultValue) {
        if (!name || value === undefined || value === defaultValue) return;
        if (Array.isArray(value)) {
            for (const v of value) {
                this.addSwitch(name, v, defaultValue);
            }
        }
        else if (typeof name === "object") {
            for (const key of Object.keys(name)) {
                this.addSwitch(key, name[key], defaultValue && typeof defaultValue === "object" ? defaultValue[key] : defaultValue);
            }
        }
        else if (typeof name === "string") {
            const [prefix, suffix] =
                name.startsWith("--") ? ["--", name.slice(2)] :
                name.startsWith("-") ? ["-", name.slice(1)] :
                name.startsWith("//") ? ["//", name.slice(2)] :
                name.startsWith("/") ? ["/", name.slice(1)] :
                name.length === "1" ? ["-", name] :
                ["--", name];
            if (typeof value === "boolean") {
                name = `${prefix}${value ? "" : prefix.startsWith("/") ? "no" : "no-"}${suffix}`;
                this.args.push(name);
            }
            else {
                name = `${prefix}${suffix}`;
                this.args.push(name, value);
            }
        }
    }
    [Symbol.iterator]() {
        return this.args.values();
    }
}
exports.ArgsBuilder = ArgsBuilder;