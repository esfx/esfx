// @ts-check
const gulp = require("gulp");
const del = require("del");
const { buildProject, cleanProject } = require("./scripts/build");
const { exec } = require("./scripts/exec");

const { build: build_internal, clean: clean_internal } = makeProjects([
    "internal/binarysearch",
    "internal/collections-hash",
    "internal/guards",
    "internal/hashcode",
    "internal/integers",
    "internal/murmur3",
    // hygen: add new internal projects above this line
]);
gulp.task("internal", build_internal);

const { build: build_packages, clean: clean_packages } = makeProjects([
    "packages/async",
    "packages/async-autoresetevent",
    "packages/async-barrier",
    "packages/async-canceltoken",
    "packages/async-countdown",
    "packages/async-deferred",
    "packages/async-delay",
    "packages/async-manualresetevent",
    "packages/async-queue",
    "packages/async-readerwriterlock",
    "packages/async-semaphore",
    "packages/async-stack",
    "packages/cancelable",
    "packages/cancelable-dom",
    "packages/cancelable-dom-shim",
    "packages/collection-core",
    "packages/collection-core-dom-shim",
    "packages/collection-core-shim",
    "packages/collections-linkedlist",
    "packages/collections-hashmap",
    "packages/collections-hashset",
    "packages/collections-sortedmap",
    "packages/collections-sortedset",
    "packages/collections",
    "packages/decorators",
    "packages/decorators-stage1-core",
    "packages/disposable",
    "packages/equatable",
    "packages/equatable-shim",
    "packages/events",
    "packages/indexed-object",
    "packages/metadata",
    "packages/metadata-shim",
    "packages/ref",
    "packages/reflect-metadata-compat",
    "packages/type-model",
    "packages/lazy",
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

const test = () => exec(process.execPath, [require.resolve("jest/bin/jest")], { verbose: true });
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
