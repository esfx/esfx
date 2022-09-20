#!/usr/bin/env node

// @ts-check

require("./baseOpts.js")
    .scriptName("workspaces-foreach")
    .usage("$0 <command> [options]")
    .command(require("./commands/run/command.js"))
    .command(require("./commands/pack/command.js"))
    .demandCommand()
    .recommendCommands()
    .help()
    .alias("h", "help")
    .argv;
