const fs = require("fs");
const gulp = require("gulp");
const del = require("del");
const path = require("path");
const { buildProject, cleanProject } = require("./scripts/build");
const { exec, ArgsBuilder } = require("./scripts/exec");
const { argv } = require("yargs");
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
    args.addSwitch("--testNamePattern", argv.testNamePattern || argv.tests || argv.test || argv.T || argv.t);
    args.addSwitch("--testPathPattern", argv.testPathPattern || argv.files || argv.file || argv.F);
    args.addSwitch("--testPathIgnorePatterns", argv.testPathIgnorePatterns || argv.ignore || argv.I);
    args.addSwitch("--maxWorkers", argv.maxWorkers || argv.w);
    args.addSwitch("--onlyChanged", Boolean(argv.onlyChanged || argv.changed || argv.o || false), false);
    args.addSwitch("--onlyFailures", Boolean(argv.onlyFailures || argv.failed || argv.f || false), false);
    args.addSwitch("--runInBand", Boolean(argv.runInBand || argv.i || false), false);
    args.addSwitch("--watch", Boolean(argv.watch || false), false);
    args.addSwitch("--watchAll", Boolean(argv.watchAll || false), false);
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

const docPackages = publicPackages.filter(docPackage => fs.existsSync(path.resolve(docPackage, "api-extractor.json")));

gulp.task("docs", gulp.series(
    // build,
    // gulp.parallel(docPackages.map(docPackage => fname(`api-extractor:${docPackage}`, () => apiExtractor(docPackage)))),
    fname("api-documenter", () => apiDocumenter(docPackages)),
    // fname("docfx", () => docfx(argv.serve || false))
));
