const fs = require("fs");
const path = require("path");
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
 * @param {typeof process.env} [options.env]
 * @param {import("child_process").StdioOptions} [options.stdio]
 * @returns {Promise<{ exitCode: number, stdout: string, stderr: string }>}
 */
function exec(cmd, args = [], { ignoreExitCode, verbose, cwd, env, stdio = "inherit" } = {}) {
    return new Promise((resolve, reject) => {
        const shell = isWindows ? "cmd" : "/bin/sh";
        const shellArgs = isWindows ? ["/c", cmd.includes(" ") >= 0 ? `"${cmd}"` : cmd, ...args] : ["-c", `${cmd} ${args.join(" ")}`];
        if (verbose) {
            let prefix = "";
            if (cwd && cwd !== process.cwd()) {
                prefix = path.relative(process.cwd(), cwd).replace(/\\/g, "/");
                if (prefix) prefix = chalk.gray(`${prefix} `);
            }
            log(`${prefix}$ ${chalk.green(cmd)} ${args.join(" ")}`);
        }

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