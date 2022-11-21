// @ts-check
const gulp = require("gulp");
const path = require("path");
const semver = require("semver");
const hygen = require("hygen");
const { exec, ArgsBuilder } = require("../../scripts/exec.js");
const { fileURLToPath, URL } = require("url");

/**
 * @typedef Matrix
 * @property {string|string[]} runtime
 * @property {string|number|(string | number)[]|null} [target]
 * @property {string|string[]|null} [target_arch]
 * @property {string|string[]|null} [target_platform]
 * @property {string[]} [supported_versions]
 * @property {string[]} [args]
 */

/**
 * @typedef Configuration
 * @property {string} runtime
 * @property {string|null} [target]
 * @property {string|null} [target_arch]
 * @property {string|null} [target_platform]
 * @property {string[]} [supported_versions]
 * @property {string[]} [args]
 */

/**
 * @typedef TaskEntry
 * @property {"build" | "package" | "clean"} action
 * @property {string} runtime
 * @property {string|null} target
 * @property {string} arch
 * @property {string} platform
 * @property {gulp.TaskFunction} task
 */

/**
 * @typedef TaskFilter
 * @property {string} [runtime]
 * @property {string} [target]
 * @property {string} [arch]
 * @property {string} [platform]
 */

// constants
const PACKAGE_DIR = __dirname;
const NATIVE_DIR = path.resolve(PACKAGE_DIR, "..");

/** @type {Matrix[]} */
const matrix = require("./configurations.json");
const configurations = computeConfigurations(matrix);
const { version } = require("./package.json");
const runtimes = configurations.reduce((set, { runtime }) => set.add(runtime), new Set());
const platforms = configurations.reduce((set, { target_platform }) => target_platform ? set.add(target_platform) : set, new Set());
const architectures = configurations.reduce((set, { target_arch }) => target_arch ? set.add(target_arch) : set, new Set());

createTasks(configurations);

gulp.task("generate-native-packages", async () => {
    for (const platform of platforms) for (const arch of architectures) {
        const baseMatches = configurations.filter(conf => conf.target_platform === platform && conf.target_arch === arch);
        if (baseMatches.length) {
            const engines = [];
            for (const runtime of runtimes) {
                /** @type {Set<string>} */4
                const versions = new Set();
                const matches = baseMatches.filter(conf => conf.runtime === runtime);

                for (const match of matches) {
                    if (match.supported_versions) {
                        for (const supported_version of match.supported_versions) {
                            if (semver.validRange(supported_version, { includePrerelease: true })) {
                                versions.add(supported_version);
                            }
                        }
                    }
                }
                if (versions.size) {
                    engines.push({ runtime, versions: [...versions].join(" || ") });
                }
            }

            const packageDir = path.resolve(NATIVE_DIR, `equatable-native-${platform}-${arch}`);

            const locals = {
                packageDir,
                name: `@esfx/equatable-native-${platform}-${arch}`,
                version,
                engines,
                platform,
                arch,
                overwrite: true
            };

            const config = await hygen.resolve({
                templates: ".templates",
                localsDefaults: locals,
                cwd: PACKAGE_DIR,
                logger: {
                    colorful(msg) { console.log(msg); },
                    log(msg) { console.log(msg); },
                    ok(msg) { console.log(msg); },
                    notice(msg) { console.log(msg); },
                    warn(msg) { console.log(msg); },
                    err(msg) { console.log(msg); },
                },
                createPrompter: () => /** @type {*} */({
                    async prompt({ name }) { return { [name]: locals[name] } },
                })
            });

            await hygen.engine(["new", "native"], config);
        }
    }
});

/**
 * @param {Matrix[]} matrix
 */
function computeConfigurations(matrix) {
    /** @type {Configuration[]} */
    const configurations = [];
    for (const { runtime, target, target_platform, target_arch, args, ...rest } of matrix) {
        const runtimes = Array.isArray(runtime) ? runtime : [runtime];
        const targets = Array.isArray(target) ? target : [target];
        const target_archs = Array.isArray(target_arch) ? target_arch : [target_arch];
        const target_platforms = Array.isArray(target_platform) ? target_platform : [target_platform];
        for (const runtime of runtimes)
        for (const target of targets)
        for (const target_arch of target_archs)
        for (const target_platform of target_platforms) {
            const targetStr = typeof target === "number" ? `${target}.0.0` : target;
            const supported_versions = typeof target === "number" ? [`^${target}`] : target ? [`^${target}`] : undefined;
            configurations.push({ runtime, target: targetStr, target_arch, target_platform, args, supported_versions, ...rest });
        }
    }
    return configurations;
}

/**
 * @param {Configuration[]} configurations
 */
function createTasks(configurations) {
    const tasks = computeTaskEntries(configurations);

    createActions("-native", tasks, {});
    for (const runtime of runtimes) {
        createActions(`-${runtime}`, tasks, { runtime });
        createActions(`-${runtime}-current`, tasks, { runtime, platform: process.platform });
        for (const platform of platforms) {
            createActions(`-${runtime}-${platform}`, tasks, { platform, runtime });
            for (const arch of architectures) {
                createActions(`-${runtime}-${platform}-${arch}`, tasks, { platform, runtime, arch });
            }
        }
    }

    for (const platform of platforms) {
        createActions(`-${platform}`, tasks, { platform });
    }
}

/**
 * @param {string} suffix
 * @param {TaskEntry[]} tasks
 * @param {TaskFilter} filter
 */
function createActions(suffix, tasks, filter) {
    const buildTasks = selectTasks(tasks, "build", filter);
    const buildTask = buildTasks.length ? gulp.series(buildTasks) : (async () => { console.log("no matching tasks."); });
    gulp.task(`build${suffix}`, buildTask);

    const packageTasks = selectTasks(tasks, "package", filter);
    const packageTask = packageTasks.length ? gulp.series(packageTasks) : (async () => { console.log("no matching tasks."); });
    gulp.task(`package${suffix}`, packageTask);

    const cleanTasks = selectTasks(tasks, "clean", filter);
    const cleanTask = cleanTasks.length ? gulp.series(cleanTasks) : (async () => { console.log("no matching tasks."); });
    gulp.task(`clean${suffix}`, cleanTask);
}

/**
 * @param {Configuration[]} configurations
 */
function computeTaskEntries(configurations) {
    /** @type {TaskEntry[]} */
    const tasks = [];
    for (const runtime of runtimes)
    for (const platform of platforms)
    for (const arch of architectures)
    for (const config of configurations) {
        if (config.runtime !== runtime) continue;
        if (config.target_platform !== platform) continue;
        if (config.target_arch !== arch) continue;
        const packageTaskName = `package-${runtime}-${platform}-${arch}-${config.target ?? "current"}`;
        const cleanTaskName = `clean-${runtime}-${platform}-${arch}-${config.target ?? "current"}`;
        const buildTaskName = `build-${runtime}-${platform}-${arch}-${config.target ?? "current"}`;

        /** @type {gulp.TaskFunction} */
        const buildTask = async () => {
            const args = new ArgsBuilder();
            args.addValue("configure");
            args.addValue("rebuild");
            args.addValue(`--runtime=${config.runtime}`);
            if (config.target) args.addValue(`--target=${config.target}`);
            if (config.target_arch) args.addValue(`--target_arch=${config.target_arch}`);
            if (config.target_platform) args.addValue(`--target_platform=${config.target_platform}`);
            const configArgs = config.args ?? [];
            const { npmRunPathEnv } = await import("npm-run-path");
            await exec("node-pre-gyp", [...args, ...configArgs], { verbose: true, env: npmRunPathEnv() });
        };
        gulp.task(buildTask.displayName = buildTaskName, buildTask);
        tasks.push({ action: "build", runtime, target: config.target ?? null, platform: platform, arch: arch, task: buildTask });

        /** @type {gulp.TaskFunction} */
        const packageTask = async () => {
            const args = new ArgsBuilder();
            args.addValue("configure");
            args.addValue("rebuild");
            args.addValue("package");
            args.addValue(`--runtime=${config.runtime}`);
            if (config.target) args.addValue(`--target=${config.target}`);
            if (config.target_arch) args.addValue(`--target_arch=${config.target_arch}`);
            if (config.target_platform) args.addValue(`--target_platform=${config.target_platform}`);
            const configArgs = config.args ?? [];
            const { npmRunPathEnv } = await import("npm-run-path");
            await exec("node-pre-gyp", [...args, ...configArgs], { verbose: true, env: npmRunPathEnv() });
        };
        gulp.task(packageTask.displayName = packageTaskName, packageTask);
        tasks.push({ action: "package", runtime, target: config.target ?? null, platform: platform, arch: arch, task: packageTask });

        /** @type {gulp.TaskFunction} */
        const cleanTask = async () => {
            const args = new ArgsBuilder();
            args.addValue("clean");
            args.addValue(`--runtime=${config.runtime}`);
            if (config.target) args.addValue(`--target=${config.target}`);
            if (config.target_arch) args.addValue(`--target_arch=${config.target_arch}`);
            if (config.target_platform) args.addValue(`--target_platform=${config.target_platform}`);
            const configArgs = config.args ?? [];
            const { npmRunPathEnv } = await import("npm-run-path");
            await exec("node-gyp", [...args, ...configArgs], { verbose: true, env: npmRunPathEnv() });
        };
        gulp.task(cleanTask.displayName = cleanTaskName, cleanTask);
        tasks.push({ action: "clean", runtime, target: config.target ?? null, platform: platform, arch: arch, task: cleanTask });
    }
    return tasks;
}

/**
 * @param {TaskEntry[]} tasks
 * @param {TaskEntry["action"]} action
 * @param {TaskFilter} filter
 */
function selectTasks(tasks, action, filter = {}) {
    return tasks.filter(entry =>
        entry.action === action &&
        (!filter.runtime || entry.runtime === filter.runtime) &&
        (!filter.target || entry.target === filter.target) &&
        (!filter.arch || entry.arch === filter.arch) &&
        (!filter.platform || entry.platform === filter.platform))
        .map(entry => entry.task);
}
