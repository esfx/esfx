const fs = require("fs");

let version = process.env.VERSION_SPEC;
let dist_tag = process.env.DIST_TAG;
let prerelease = process.env.PRERELEASE;

if (!version) { console.error("ERR! $VERSION_SPEC not set"); process.exit(1); }
if (!dist_tag) { console.error("ERR! $DIST_TAG not set"); process.exit(1); }
if (!prerelease) { console.error("ERR! $PRERELEASE not set"); process.exit(1); } else { prerelease = prerelease !== "false"; }

const match = /^(?<major>\d+)\.(?<minor>\d+)\.(?<revision>\d+)(?<pre_part>-(?<valid_pre>(?<pre_tags>(?<pre_tag>alpha|beta|rc)(?:\.[a-zA-Z-][a-zA-Z0-9-]*)*)(?<pre_number>\.(?:0|[1-9]\d*))?)?(?<invalid_pre>[a-zA-Z0-9.-]*))?(?<build_part>\+(?<valid_build>(?<build>[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*))?(?<invalid_build>[a-zA-Z0-9.-]*))?$/.exec(version)?.groups;
if (!match) { console.error(`ERR! invalid version: ${version}`); process.exit(1); }
if (match.invalid_pre && !match.valid_pre) { console.error(`ERR! Unsupported prerelease tag. Expected 'alpha', 'beta', or 'rc' but got '${match.invalid_pre}' instead.`); process.exit(1); }
if (match.invalid_pre) { console.error(`ERR! Unsupported prerelease tag: '${match.pre_part}'.`); process.exit(1); }
if (match.invalid_build) { console.error(`ERR! Unsupported build tag: '${match.build_part}'.`); process.exit(1); }
if (prerelease && !match.pre_tag) { console.error("ERR! version must have a prerelease tag if 'inputs.prerelease' is true."); process.exit(1); }
if (!prerelease && match.pre_tag) { console.error("ERR! version must not have a prerelease tag if 'inputs.prerelease' is false."); process.exit(1); }

switch (dist_tag) {
    case "next":
    case "beta":
    case "rc":
    case "latest":
        break;
    case "<auto>":
        switch (match.pre_tag) {
            case "alpha": dist_tag = "next"; break;
            case "beta": dist_tag = "beta"; break;
            case "rc": dist_tag = "rc"; break;
            default: dist_tag = prerelease ? "latest" : "next"; break;
        }
        break;
    default:
        console.error(`ERR! unrecognized dist_tag: '${dist_tag}'.`);
        process.exit(1);
        break;
}

// reconstruct version
version = `${match.major}.${match.minor}.${match.revision}`;
if (match.pre_tags) {
    version += `-${match.pre_tags}`;
    if (match.pre_number) {
        version += `.${match.pre_number}`;
    }
    else {
        version += `.${new Date().toISOString().replace(/[T:.-]/g, "").slice(0, 12)}`;
    }
}
if (match.build) {
    version += `+${match.build}`;
}

setOutput(`version`, version);
setOutput(`dist_tag`, dist_tag);
setOutput(`prerelease`, prerelease);
process.exit(0);

function setOutput(key, value) {
    if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`, { encoding: "utf8" });
    }
    else {
        process.stdout.write(`::set-output name=${key}::${value}\n`);
    }
}
