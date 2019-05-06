const { exec } = require("./exec");
const yargs_unparser = require("yargs-unparser");
const yargs = require("yargs");
const yargv = yargs
    .option("otp", { type: "string", demandOption: !process.env.NPM_CONFIG_OTP, description: "One-time password required for publishing." })
    .argv;

if (yargv.otp) {
    process.env.NPM_CONFIG_OTP = yargv.otp;
    yargv.otp = undefined;
}

exec(process.execPath, [require.resolve("lerna/cli"), "publish", ...yargs_unparser(yargv)]).catch(e => {
    console.error(e);
    process.exit(-1);
});