// @ts-check
// fix a failed npm publish from lerna
const { exec } = require("./exec");
const { argv } = require("yargs")
    .version(false)
    .option("version", { type: "string", demandOption: true })
    .option("publishBranch", { type: "string", default: "master" });

async function getBranchName() {
    const { exitCode, stdout, stderr } = await exec("git", ["rev-parse", "--abbrev-ref", "HEAD"], { stdio: "pipe", ignoreExitCode: true });
    if (exitCode !== 0) {
        console.error(`Failed to acquire branchname. Process exited with code ${exitCode}:`, stderr);
        process.exit(-1);
    }
    return stdout.trim();
}

async function getLastCommitMessage() {
    const { exitCode, stdout, stderr } = await exec("git", ["log", "-1", "--pretty=%B", "--"], { stdio: "pipe", ignoreExitCode: true });
    if (exitCode !== 0 && !/^fatal: bad revision/.test(stderr)) {
        console.error(`Failed to acquire commit message. Process exited with code ${exitCode}:`, stderr);
        process.exit(-1);
    }
    return exitCode === 0 ? stdout.trim() : "";
}

async function getMatchingLocalTag(tag) {
    const { exitCode, stdout, stderr } = await exec("git", ["describe", "--abbrev=0", "--tags", tag], { stdio: "pipe", ignoreExitCode: true });
    if (exitCode !== 0 && !/^fatal: Not a valid object name/.test(stderr)) {
        console.error(`Failed to acquire latest local tag. Process exited with code ${exitCode}:`, stderr);
        process.exit(exitCode);
    }
    return exitCode === 0 ? stdout.trim() : "";
}

async function getMatchingRemoteTag(tag) {
    const { exitCode, stdout, stderr } = await exec("git", ["ls-remote", "--tags", "--sort=-version:refname", "--refs", "origin", `refs/tags/${tag.replace(".", "\\.").replace("+", "\\+")}`], { stdio: "pipe", ignoreExitCode: true });
    if (exitCode !== 0) {
        console.error(`Failed to acquire latest remote tag. Process exited with code ${exitCode}:`, stderr);
        process.exit(exitCode);
    }
    const firstLine = /^[^\r\n]+/.exec(stdout.trim())?.[0] ?? "";
    return firstLine && (/^[a-f\d]+\s+refs\/tags\/([^\s]+)\s*$/.exec(firstLine)?.[1] ?? "");
}

async function revertLastCommit() {
    console.log("Reverting last commit...");
    await exec("git", ["reset", "--hard", "HEAD^"], { verbose: true, stdio: "inherit" });
}

async function deleteLocalTag(tag) {
    console.log(`Deleting local tag '${tag}'...`);
    await exec("git", ["tag", "-d", tag], { verbose: true, stdio: "inherit" });
}

async function forcePushCommitRollback() {
    console.log("Force pushing roll-back of last commit");
    await exec("git", ["push", "origin", "+HEAD"], { verbose: true, stdio: "inherit" });
}

async function deleteRemoteTag(tag) {
    console.log(`Deleting remote tag '${tag}'...`);
    await exec("git", ["push", "--delete", "origin", tag], { verbose: true, stdio: "inherit" });
}

async function main() {
    try {
        const onPublishBranch = argv.publishBranch === await getBranchName();
        if (!onPublishBranch) {
            console.error(`Not on publish branch '${argv.publishBranch}'. Aborting.`);
            process.exit(-1);
        }

        const shouldRevertLastCommit = argv.version === await getLastCommitMessage();
        const shouldRevertLocalTag = argv.version === await getMatchingLocalTag(argv.version);
        const shouldRevertRemoteTag = argv.version === await getMatchingRemoteTag(argv.version);
        if (!shouldRevertLastCommit && !shouldRevertLocalTag && !shouldRevertRemoteTag) {
            console.log("Nothing to revert.");
            process.exit(0);
        }

        console.log(`Reverting failed publish of version: ${argv.version}...`);
        if (shouldRevertLastCommit) {
            await revertLastCommit();
        }
        if (shouldRevertLocalTag) {
            await deleteLocalTag(argv.version);
        }
        if (shouldRevertLastCommit) {
            await forcePushCommitRollback();
        }
        if (shouldRevertRemoteTag) {
            await deleteRemoteTag(argv.version);
        }
        console.log("Done. You may attempt to publish again.");
    }
    catch (e) {
        console.error(e);
        process.exit(-1);
    }
}

main();