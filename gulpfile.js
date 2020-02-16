const fs = require("fs");
const gulp = require("gulp");
const del = require("del");
const path = require("path");
const { buildProject, cleanProject } = require("./scripts/build");
const { exec, ArgsBuilder } = require("./scripts/exec");
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
    ;

const { argv } = yargs;
const { apiExtractor, apiDocumenter, docfx } = require("./scripts/docs");
const { fname } = require("./scripts/fname");

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

// const watch = () => spawn('node', [require.resolve("jest/bin/jest"), "--watch"], { stdio: "inherit" });
// gulp.task("watch", watch);

const verify = () => {
    const args = new ArgsBuilder();
    args.addSwitch("--fix", argv.fix, false);
    args.addSwitch("--interactive", argv.interactive, true);
    return exec(process.execPath, [require.resolve("./scripts/verify.js"), ...args], { verbose: true });
};
gulp.task("verify", verify);

gulp.task("default", gulp.series(verify, build, test));

function makeProjects(projects) {
    const builders = [];
    const cleaners = [];
    for (const project of projects) {
        const build = { [project]: () => buildProject(project) }[project];
        const clean = { [`clean:${project}`]: () => cleanProject(project) }[`clean:${project}`];
        gulp.task(project, build);
        gulp.task(`clean:${project}`, clean);
        builders.push(build);
        cleaners.push(clean);
    }
    const build = gulp.parallel(builders);
    const clean = gulp.parallel(cleaners);
    return { build, clean };
}

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

gulp.task("docs", gulp.series(
    build,
    gulp.parallel(docPackages.map(docPackage => fname(`api-extractor:${docPackage}`, () => apiExtractor(docPackage)))),
    fname("api-documenter", () => apiDocumenter(docPackages)),
    fname("docfx", () => docfx(argv.serve || false))
));
