const gulp = require("gulp");
const del = require("del");
const { buildProject, cleanProject } = require("./scripts/build");
const { exec, ArgsBuilder } = require("./scripts/exec");
const { argv } = require("yargs");

const { build: build_internal, clean: clean_internal } = makeProjects([
    "internal/binarysearch",
    "internal/collections-hash",
    "internal/guards",
    "internal/hashcode",
    "internal/integers",
    "internal/murmur3",
    "internal/tag",
    // hygen: add new internal projects above this line
]);
gulp.task("internal", build_internal);

const { build: build_packages, clean: clean_packages } = makeProjects([
    "packages/async-autoresetevent",
    "packages/async-barrier",
    "packages/async-canceltoken",
    "packages/async-conditionvariable",
    "packages/async-countdown",
    "packages/async-deferred",
    "packages/async-delay",
    "packages/async-lazy",
    "packages/async-lockable",
    "packages/async-manualresetevent",
    "packages/async-mutex",
    "packages/async-queue",
    "packages/async-readerwriterlock",
    "packages/async-semaphore",
    "packages/async-stack",
    "packages/async-waitqueue",
    "packages/async",
    "packages/cancelable-dom-shim",
    "packages/cancelable-dom",
    "packages/cancelable",
    "packages/collection-core-dom-shim",
    "packages/collection-core-shim",
    "packages/collection-core",
    "packages/collections-hashmap",
    "packages/collections-hashset",
    "packages/collections-linkedlist",
    "packages/collections-sortedmap",
    "packages/collections-sortedset",
    "packages/collections",
    "packages/decorators-stage1-core",
    "packages/decorators",
    "packages/disposable",
    "packages/equatable-shim",
    "packages/equatable",
    "packages/events",
    "packages/indexed-object",
    "packages/lazy",
    "packages/metadata-shim",
    "packages/metadata",
    "packages/ref",
    "packages/reflect-metadata-compat",
    "packages/type-model",
    // hygen: add new public projects above this line
]);
gulp.task("packages", build_packages);

const clean_dist = () => del([
    "packages/*/dist",
    "packages/*/*.tsbuildinfo",
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
    args.add("--testNamePattern", argv.testNamePattern || argv.tests || argv.test || argv.T || argv.t);
    args.add("--testPathPattern", argv.testPathPattern || argv.files || argv.file || argv.F);
    args.add("--testPathIgnorePatterns", argv.testPathIgnorePatterns || argv.ignore || argv.I);
    args.add("--maxWorkers", argv.maxWorkers || argv.w);
    args.add("--onlyChanged", Boolean(argv.onlyChanged || argv.changed || argv.o || false), false);
    args.add("--onlyFailures", Boolean(argv.onlyFailures || argv.failed || argv.f || false), false);
    args.add("--runInBand", Boolean(argv.runInBand || argv.i || false), false);
    args.add("--watch", Boolean(argv.watch || false), false);
    args.add("--watchAll", Boolean(argv.watchAll || false), false);
    return exec(process.execPath, [require.resolve("jest/bin/jest"), ...args], { verbose: true });
};
gulp.task("test", gulp.series(build, test));

// const watch = () => spawn('node', [require.resolve("jest/bin/jest"), "--watch"], { stdio: "inherit" });
// gulp.task("watch", watch);

gulp.task("default", build);

function makeProjects(projects) {
    const builders = [];
    const cleaners = [];
    for (const project of projects) {
        const build = { [project]: () => buildProject(project) }[project];
        const clean = { [`clean:${project}`]: () => cleanProject(project) }[`clean:${project}`];
        gulp.task(project, build);
        builders.push(build);
        cleaners.push(clean);
    }
    const build = gulp.parallel(builders);
    const clean = gulp.parallel(cleaners);
    return { build, clean };
}
