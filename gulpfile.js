const fs = require("fs");
const gulp = require("gulp");
const del = require("del");
const path = require("path");
const { buildProject, cleanProject } = require("./scripts/build");
const { exec, ArgsBuilder } = require("./scripts/exec");
const { Semaphore } = require("./scripts/semaphore");
const { apiExtractor, apiDocumenter, docfx, installDocFx } = require("./scripts/docs");
const { fname } = require("./scripts/fname");
const yargs = require("yargs")
    .option("testNamePattern", { type: "string", alias: ["tests", "test", "T", "t"] })
    .option("testPathPattern", { type: "string", alias: ["files", "file", "F"] })
    .option("testPathIgnorePatterns", { type: "string", alias: ["ignore", "I"] })
    .option("maxWorkers", { type: "string", alias: ["w"] })
    .option("onlyChanged", { type: "boolean", alias: ["changed", "o"], default: false })
    .option("runInBand", { type: "boolean", alias: "i", default: false })
    .option("watch", { type: "boolean", default: false })
    .option("watchAll", { type: "boolean", default: false })
    .option("fix", { type: "boolean", default: false })
    .option("interactive", { type: "boolean", default: true })
    .option("docPackagePattern", { type: "string" })
    .option("force", { type: "boolean", default: false })
    .option("verbose", { type: "boolean", default: false })
    .option("serve", { type: "boolean", default: false })
    .option("prebuild", { type: "boolean", default: true })
    ;

const { argv } = yargs;

const internalPackages = fs.readdirSync("internal")
    .map(name => `internal/${name}`)
    .filter(pkg => fs.existsSync(`${pkg}/tsconfig.json`))
    .sort();

const { build: build_internal, clean: clean_internal } = makeProjects(internalPackages);
gulp.task("internal", build_internal);

const publicPackages = fs.readdirSync("packages")
    .map(name => `packages/${name}`)
    .filter(pkg => fs.existsSync(`${pkg}/tsconfig.json`))
    .sort();

const { build: build_packages, clean: clean_packages } = makeProjects(publicPackages);
gulp.task("packages", build_packages);

const clean_dist = () => del([
    "packages/*/.docs",
    "packages/*/dist",
    "packages/*/*.tsbuildinfo",
    "internal/*/.docs",
    "internal/*/dist",
    "internal/*/*.tsbuildinfo",
]);

const clean = gulp.series(gulp.parallel(clean_internal, clean_packages), clean_dist);
gulp.task("clean", clean);

const build = gulp.parallel(build_internal, build_packages);
gulp.task("build", build);

const ci = gulp.series(clean, build);
gulp.task("ci", ci);

const test = () => {
    const args = new ArgsBuilder();
    args.addSwitch("--testNamePattern", argv.testNamePattern);
    args.addSwitch("--testPathPattern", argv.testPathPattern);
    args.addSwitch("--testPathIgnorePatterns", argv.testPathIgnorePatterns);
    args.addSwitch("--maxWorkers", argv.maxWorkers);
    args.addSwitch("--onlyChanged", argv.onlyChanged, false);
    args.addSwitch("--onlyFailures", argv.onlyFailures, false);
    args.addSwitch("--runInBand", argv.runInBand, false);
    args.addSwitch("--watch", argv.watch, false);
    args.addSwitch("--watchAll", argv.watchAll, false);
    return exec(process.execPath, [require.resolve("jest/bin/jest"), ...args], { verbose: true });
};
// gulp.task("test", gulp.series(build, test));
gulp.task("test", gulp.series(gulp.task("internal/jest-sequence"), test));

const perf = () => {
    const args = new ArgsBuilder();
    args.addSwitch("--config", "./jest.perf.config.js");
    args.addSwitch("--testNamePattern", argv.testNamePattern);
    args.addSwitch("--testPathPattern", argv.testPathPattern);
    args.addSwitch("--testPathIgnorePatterns", argv.testPathIgnorePatterns);
    args.addSwitch("--maxWorkers", argv.maxWorkers);
    args.addSwitch("--onlyChanged", argv.onlyChanged, false);
    args.addSwitch("--onlyFailures", argv.onlyFailures, false);
    args.addSwitch("--runInBand", argv.runInBand, false);
    args.addSwitch("--watch", argv.watch, false);
    args.addSwitch("--watchAll", argv.watchAll, false);
    return exec(process.execPath, [require.resolve("jest/bin/jest"), ...args], { verbose: true });
};
gulp.task("perf", perf);

// const watch = () => spawn('node', [require.resolve("jest/bin/jest"), "--watch"], { stdio: "inherit" });
// gulp.task("watch", watch);

const verify = () => {
    const args = new ArgsBuilder();
    args.addSwitch("--fix", argv.fix, false);
    args.addSwitch("--interactive", argv.interactive, true);
    return exec(process.execPath, [require.resolve("./scripts/verify.js"), ...args], { verbose: true });
};
gulp.task("verify", verify);

gulp.task("default", gulp.series(build, verify, test));

/**
 * @param {string[]} projects
 */
function makeProjects(projects) {
    const builders = [];
    const cleaners = [];
    for (const project of projects) {
        /** @type {gulp.TaskFunction | undefined} */
        let prebuild;

        /** @type {gulp.TaskFunction[]} */
        const buildTasks = [];

        /** @type {gulp.TaskFunction[]} */
        const cleanTasks = [];

        let packageJson;
        try { packageJson = JSON.parse(fs.readFileSync(path.join(project, "package.json"), "utf8")); } catch { }

        if (packageJson?.scripts?.prebuild && argv.prebuild) {
            prebuild = () => exec("yarn", ["workspace", packageJson.name, "run", "prebuild"], { verbose: true });
            prebuild.displayName = `prebuild::yarn:${project}`;
        }

        if (packageJson?.scripts?.clean && argv.clean) {
            const cleanYarn = () => exec("yarn", ["workspace", packageJson.name, "run", "clean"], { verbose: true });
            cleanYarn.displayName = `clean:yarn:${project}`;
            cleanTasks.push(cleanYarn);
        }

        if (fs.existsSync(path.join(project, "tsconfig.esm.json"))) {
            /** @type {gulp.TaskFunction} */
            const buildTypeScriptCjs = () => buildProject(project, { force: argv.force });
            buildTypeScriptCjs.displayName = `build:typescript:cjs:${project}`;

            /** @type {gulp.TaskFunction} */
            const buildTypeScriptEsm = () => buildProject(path.join(project, "tsconfig.esm.json"), { force: argv.force });
            buildTypeScriptEsm.displayName = `build:typescript:esm:${project}`;

            /** @type {gulp.TaskFunction} */
            const postbuildTypeScriptEsm = async () => fs.writeFileSync(path.join(project, "dist/esm/package.json"), JSON.stringify({ "type": "module" }), "utf8");
            postbuildTypeScriptEsm.displayName = `postbuild:typescript:esm:${project}`;

            /** @type {gulp.TaskFunction} */
            const cleanTypeScriptCjs = () => cleanProject(project);
            cleanTypeScriptCjs.displayName = `clean:typescript:cjs:${project}`;

            /** @type {gulp.TaskFunction} */
            const cleanTypeScriptEsm = () => cleanProject(path.join(project, "tsconfig.esm.json"));
            cleanTypeScriptEsm.displayName = `clean:typescript:esm:${project}`;

            /** @type {gulp.TaskFunction} */
            const buildTypeScript = gulp.series(gulp.parallel(buildTypeScriptCjs, buildTypeScriptEsm), postbuildTypeScriptEsm);
            buildTypeScript.displayName = `build:typescript:${project}`;
            buildTasks.push(buildTypeScript);

            /** @type {gulp.TaskFunction} */
            const cleanTypeScript = gulp.parallel(cleanTypeScriptCjs, cleanTypeScriptEsm);
            cleanTypeScript.displayName = `clean:typescript:${project}`;
            cleanTasks.push(cleanTypeScript);
        }
        else {
            /** @type {gulp.TaskFunction} */
            const buildTypeScript = () => buildProject(project, { force: argv.force });
            buildTypeScript.displayName = `build:typescript:${project}`;
            buildTasks.push(buildTypeScript);

            /** @type {gulp.TaskFunction} */
            const cleanTypeScript = () => cleanProject(project);
            cleanTypeScript.displayName = `clean:typescript:${project}`;
            cleanTasks.push(cleanTypeScript);
        }

        if (fs.existsSync(path.join(project, "binding.gyp"))) {
            /** @type {gulp.TaskFunction} */
            const cleanBinding = () => del(`${project}/build`, `${project}/dist/node`);
            cleanBinding.displayName = `clean:node-pre-gyp:${project}`;
            cleanTasks.push(cleanBinding);
        }

        if (fs.existsSync(path.join(project, "api-extractor.json"))) {
            /** @type {gulp.TaskFunction} */
            const cleanDocs = () => del(`${project}/obj`);
            cleanDocs.displayName = `clean:docs:${project}`;
            cleanTasks.push(cleanDocs);
        }

        const build = prebuild ?
            gulp.series(prebuild, gulp.parallel(...buildTasks)) :
            gulp.parallel(...buildTasks);
        build.displayName = project;

        const clean = gulp.parallel(...cleanTasks);
        clean.displayName = `clean:${project}`;

        gulp.task(project, build);
        gulp.task(`clean:${project}`, clean);
        if (prebuild) {
            gulp.task(`prebuild:${project}`, prebuild);
        }

        builders.push(build);
        cleaners.push(clean);
    }
    const build = gulp.parallel(builders);
    const clean = gulp.parallel(cleaners);
    return { build, clean };
}

const docPackagePattern = argv.docPackagePattern && new RegExp(argv.docPackagePattern, "i");
const docPackages = publicPackages.filter(docPackage => fs.existsSync(path.resolve(docPackage, "api-extractor.json")));

const cleanDocsOutputs = () => del([
    "packages/*/obj",
    "obj",
    "docs/**/*",
]);

const cleanLegacyOutputs = () => del([
    "packages/*/.docs",
    ".docs",
]);

gulp.task("clean:docs", gulp.parallel(
    cleanDocsOutputs,
    cleanLegacyOutputs
));

const docsSem = new Semaphore();

const docsApiExtractor = gulp.parallel(docPackages.map(docPackage => fname(`docs:api-extractor:${docPackage}`, () => apiExtractor({ projectFolder: docPackage, force: argv.force, verbose: argv.verbose, docPackagePattern }))));
docsApiExtractor.name = "docs:api-extractor";
const docsApiDocumenter = fname(`docs:api-documenter`, () => apiDocumenter({ projectFolders: docPackages, docPackagePattern }));
const docsDocfx = fname("docs:docfx", () => docfx({ serve: argv.serve, build: true }));
const docsDocfxServe = fname("docs:docfx:serve", () => docfx({ serve: true, build: false }));
const docsDocfxBuild = fname(`docs:docfx`, () => docfx({ serve: false, build: true, incremental: true }));

gulp.task("install:docfx", () => installDocFx(argv.force));
gulp.task("docs:api-extractor", docsApiExtractor);
gulp.task("docs:api-documenter", docsApiDocumenter);
gulp.task("docs:docfx", docsDocfx)
gulp.task("docs", gulp.series(
    gulp.parallel(
        gulp.series(
            build,
            docsApiExtractor,
            docsApiDocumenter,
        ),
        fname("install:docfx", () => installDocFx(false))
    ),
    docsDocfx
));
gulp.task("docs:serve", docsDocfxServe);

const DOCSDEV_STEP_EXTRACT = 0;
const DOCSDEV_STEP_DOCUMENT = 1;
const DOCSDEV_STEP_DOCFX = 2;
const DOCSDEV_STEP_IDLE = 3;

let docsDevStep = DOCSDEV_STEP_IDLE;
async function docsDev(step) {
    if (docsDevStep < step) return;
    await docsSem.wait();
    try {
        if (docsDevStep < step) return;
        docsDevStep = step;
        while (true) {
            switch (step) {
                case DOCSDEV_STEP_EXTRACT:
                    await new Promise((resolve, reject) => { docsApiExtractor(e => e ? reject(e) : resolve()); });
                    step = DOCSDEV_STEP_DOCUMENT;
                    continue;

                case DOCSDEV_STEP_DOCUMENT:
                    await docsApiDocumenter();
                    step = DOCSDEV_STEP_DOCFX;
                    continue;

                case DOCSDEV_STEP_DOCFX:
                    await docsDocfxBuild();
                    step = DOCSDEV_STEP_IDLE;
                    return;
            }
        }
    }
    finally {
        docsSem.release();
    }
}

gulp.task("docs:dev", gulp.parallel(
    docsDocfxServe,
    fname("watch:api-extractor", () => gulp.watch(["api-extractor-base.json", "packages/*/api-extractor.json", "packages/*/dist/**/*.d.ts"], () => docsDev(DOCSDEV_STEP_EXTRACT))),
    fname("watch:api-documenter", () => gulp.watch(["packages/*/obj/api/**/*"], () => docsDev(DOCSDEV_STEP_DOCUMENT))),
    fname("watch:docfx", () => gulp.watch(["obj/yml/**/*", "docsrc/**/*", "packages/*/docsrc/**/*", "docfx.json"], { ignorePermissionErrors: true }, () => docsDev(DOCSDEV_STEP_DOCFX))),
));
