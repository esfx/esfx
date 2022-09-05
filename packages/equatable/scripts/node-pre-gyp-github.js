const path = require("path");
const fs = require("fs");
const { URL } = require("url");
const NodePreGypGithub = require("node-pre-gyp-github");
const { program } = require("commander");

/**
 * @typedef {object} Options
 * @property {string} token
 * @property {string} host
 * @property {string} owner
 * @property {string} repo
 * @property {string} stageDir
 * @property {boolean} whatIf
 * @property {boolean} force
 * @property {*} packageJson
 */

class NodePreGypGithubEx extends NodePreGypGithub {
    #token;
    #whatIf;
    #force;
    #verbose;

    /**
     * @param {Options} options
     */
    constructor(options) {
        super();
        this.#token = options.token;
        this.#whatIf = options.whatIf;
        this.#force = options.force;
        this.package_json = options.packageJson;
        this.stage_dir = options.stageDir ?? this.stage_dir;
        this.host = options.host;
        this.owner = options.owner;
        this.repo = options.repo;
    }

    init() {
        if (!this.package_json ||
            !this.host ||
            !this.owner ||
            !this.repo ||
            !this.stage_dir ||
            !this.#token
        ) throw new TypeError("Missing required options.");
        this.octokit = this.createOctokitInstance(this.#token);
        if (this.#whatIf) {
            this.octokit.rest.repos.createRelease = async options => {
                console.log("what-if? createRelease", options);
                /** @type {NodePreGypGithub["release"]} */
                const data = {
                    draft: !!options.draft,
                    tag_name: options.tag_name,
                };
                return { data };
            };
            this.octokit.rest.repos.uploadReleaseAsset = async options => {
                console.log("what-if? uploadReleaseAsset", options);
                const data = {};
                return { data };
            };
            this.octokit.rest.repos.deleteReleaseAsset = async options => {
                console.log("what-if? deleteReleaseAsset", options);
            };
        }
    }

    async publish(options = {}) {
        this.#verbose = options.verbose ?? true;
        await super.publish(options);
    }

    async createRelease(args) {
        if (args.name) {
            console.log(typeof args.name);
            args.name = args.name
                .replaceAll("{name}", this.package_json.name)
                .replaceAll("{version}", this.package_json.version);
        }
        if (args.body) {
            args.body = args.body
                .replaceAll("{name}", this.package_json.name)
                .replaceAll("{version}", this.package_json.version);
        }
        return super.createRelease(args);
    }

    async uploadAssets() {
        const files = new Set(fs.readdirSync(this.stage_dir));
        if (files.size && this.release.assets?.length) {
            // filter out assets we should ignore
            const force = this.#force;
            const verbose = this.#verbose;
            const draft = this.release.draft;
            const releaseAssets = this.release.assets;
            const existingAssets = this.release.assets.filter(asset => files.has(asset.name));
            const existingAssetsSet = new Set(existingAssets);
            const existingAssetsMap = new Map(existingAssets.map(asset => [asset.name, asset]));
            if (existingAssets.length) {
                // remove existing assets to ignore errors
                this.release.assets = this.release.assets.filter(asset => !existingAssetsSet.has(asset));
            }
            try {
                // patch `uploadReleaseAsset` during call to `uploadAssets`
                const savedUploadReleaseAsset = this.octokit.rest.repos.uploadReleaseAsset;
                this.octokit.rest.repos.uploadReleaseAsset = async function(params) {
                    const asset = existingAssetsMap.get(params.name);
                    if (asset) {
                        if (draft || force) {
                            // delete existing asset before continuing.
                            console.log(`Asset '${asset.name}' already exists. Deleting.`);
                            await this.deleteReleaseAsset({
                                owner: params.owner,
                                repo: params.repo,
                                asset_id: asset.id
                            });
                        }
                        else {
                            if (verbose) {
                                console.log(`Asset '${asset.name}' already exists. Skipping.`);
                            }
                            return asset;
                        }
                    }

                    return await savedUploadReleaseAsset.call(this, params);
                };

                try {
                    await super.uploadAssets();
                }
                finally {
                    // undo patch
                    this.octokit.rest.repos.uploadReleaseAsset = savedUploadReleaseAsset;
                }
            }
            finally {
                // restore original assets
                this.release.assets = releaseAssets;
            }
        }
        else {
            await super.uploadAssets();
        }
    }
}

program
    .command("publish")
    .option("--token [token]")
    .option("--owner [owner]")
    .option("--repo [repo]")
    .option("--host [host]")
    .option("--commit [commit]")
    .option("--packageJsonPath [file]")
    .option("--name [name]")
    .option("--body [body]")
    .option("--prerelease")
    .option("--stageDir")
    .option("--whatIf")
    .option("--release")
    .option("--silent")
    .action(main);

program.parseAsync(process.argv);

async function main(args) {
    // extract and validate primary args
    const {
        packageJsonPath = process.env.NODE_PRE_GYP_GITHUB_PACKAGE_JSON_PATH ?? path.resolve(__dirname, "..", "package.json"),
        token = process.env.NODE_PRE_GYP_GITHUB_TOKEN,
        release = false,
        silent = false,
        whatIf = false,
        force = false,
        stageDir,
    } = args;

    if (!packageJsonPath || !fs.existsSync(packageJsonPath)) throw new Error("'package.json' not found.");
    if (!token) throw new Error("Could not determine GitHub token. Please specify '--token' or set the NODE_PRE_GYP_GITHUB_TOKEN environment variable.");

    // parse package.json and extract repository info
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    const packageJsonRepositoryUrl = packageJson.repository?.url;
    const packageJsonRepository = packageJsonRepositoryUrl ? parsePackageJsonRepositoryUrl(packageJsonRepositoryUrl) : undefined;

    // extract and validate dependent args
    const {
        owner = process.env.NODE_PRE_GYP_GITHUB_OWNER ?? packageJsonRepository?.owner,
        repo = process.env.NODE_PRE_GYP_GITHUB_REPO ?? packageJsonRepository?.repo,
        host = process.env.NODE_PRE_GYP_GITHUB_HOST ?? packageJsonRepository?.hostname,
        commit = process.env.NODE_PRE_GYP_GITHUB_COMMIT ?? "main",
        prerelease = /^\d+\.\d+\.\d+-.?/.test(packageJson.version),
        name = `v{version}`,
        body = `{name} {version}`,
    } = args;
    if (!host) throw new Error("Could not determine GitHub API endpoint. Please specify '--host' or set the NODE_PRE_GYP_GITHUB_HOST environment variable.");
    if (!owner) throw new Error("Could not determine GitHub owner. Please specify '--owner' or set the NODE_PRE_GYP_GITHUB_OWNER environment variable.");
    if (!repo) throw new Error("Could not determine GitHub repository. Please specify '--repository' or set the NODE_PRE_GYP_GITHUB_REPO environment variable.");

    // publish build outputs
    const nodePreGypGithub = new NodePreGypGithubEx({
        packageJson,
        token,
        stageDir,
        host,
        owner,
        repo,
        whatIf,
        force,
    });
    await nodePreGypGithub.publish({
        draft: !release,
        verbose: !silent,
        target_commitish: commit,
        prerelease,
        ...(name ? { name } : undefined),
        ...(body ? { body } : undefined),
    });
}


function parsePackageJsonRepositoryUrl(urlString) {
    const url = new URL(urlString);
    const [, owner, repo] = url.pathname.split(/\/|\.git/g);
    return {
        hostname: `api.${url.hostname}`,
        owner,
        repo
    };
}
