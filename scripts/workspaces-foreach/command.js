// @ts-check
/**
 * @template [T={}]
 * @typedef {<U = T>(command: string | readonly string[], describe: string | false, builder: import("yargs").CommandBuilder<T, U>, handler: (args: import("yargs").Arguments<U>) => void) => import("yargs").CommandModule<T, U>} CommandFunction
 */

/**
 * @template [T={}]
 * @template [U=T]
 * @param {string | readonly string[]} command
 * @param {string | false} describe
 * @param {import("yargs").CommandBuilder<T, U>} builder
 * @param {(args: import("yargs").Arguments<U>) => void} handler
 * @returns {import("yargs").CommandModule<T, U>}
 */
function command(command, describe, builder, handler) {
    return { command, describe, builder, handler };
};

command.command = command;

/**
 * @template [T={}]
 * @param {import("yargs").Argv<T>} base
 * @returns {CommandFunction<T>}
 */
command.from = function (base) {
    return command;
};

module.exports = command;
