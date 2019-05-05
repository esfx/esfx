// @ts-check
const gulp = require("gulp");
const del = require("del");
const { buildProject, cleanProject, exec } = require("./scripts/build");

const cancelable = () => buildProject("packages/cancelable");
const cancelable_dom = () => buildProject("packages/cancelable-dom");
const cancelable_dom_shim = () => buildProject("packages/cancelable-dom-shim");
const collection_core = () => buildProject("packages/collection-core");
const collection_core_shim = () => buildProject("packages/collection-core-shim");
const collections = () => buildProject("packages/collections");
const decorators = () => buildProject("packages/decorators");
const decorators_stage1_core = () => buildProject("packages/decorators-stage1-core");
const disposable = () => buildProject("packages/disposable");
const equatable = () => buildProject("packages/equatable");
const equatable_shim = () => buildProject("packages/equatable-shim");
const events = () => buildProject("packages/events");
const internal_binarysearch = () => buildProject("packages/internal-binarysearch");
const internal_guards = () => buildProject("packages/internal-guards");
const internal_hashcode = () => buildProject("packages/internal-hashcode");
const internal_integers = () => buildProject("packages/internal-integers");
const internal_murmur3 = () => buildProject("packages/internal-murmur3");
const indexed_object = () => buildProject("packages/indexed-object");
const metadata = () => buildProject("packages/metadata");
const metadata_shim = () => buildProject("packages/metadata-shim");
const reflect_metadata_compat = () => buildProject("packages/reflect-metadata-compat");
const type_model = () => buildProject("packages/type-model");
const build = gulp.parallel(
    cancelable,
    cancelable_dom,
    cancelable_dom_shim,
    collection_core,
    collection_core_shim,
    collections,
    decorators,
    decorators_stage1_core,
    disposable,
    equatable,
    equatable_shim,
    events,
    internal_binarysearch,
    internal_guards,
    internal_hashcode,
    internal_integers,
    internal_murmur3,
    indexed_object,
    metadata,
    metadata_shim,
    reflect_metadata_compat,
    type_model,
);

const clean_cancelable = () => cleanProject("packages/cancelable");
const clean_cancelable_dom = () => cleanProject("packages/cancelable-dom");
const clean_cancelable_dom_shim = () => cleanProject("packages/cancelable-dom-shim");
const clean_collection_core = () => cleanProject("packages/collection-core");
const clean_collection_core_shim = () => cleanProject("packages/collection-core-shim");
const clean_collections = () => cleanProject("packages/collections");
const clean_decorators = () => cleanProject("packages/decorators");
const clean_decorators_stage1_core = () => cleanProject("packages/decorators-stage1-core");
const clean_disposable = () => cleanProject("packages/disposable");
const clean_equatable = () => cleanProject("packages/equatable");
const clean_equatable_shim = () => cleanProject("packages/equatable-shim");
const clean_events = () => cleanProject("packages/events");
const clean_internal_binarysearch = () => cleanProject("packages/internal-binarysearch");
const clean_internal_guards = () => cleanProject("packages/internal-guards");
const clean_internal_hashcode = () => cleanProject("packages/internal-hashcode");
const clean_internal_integers = () => cleanProject("packages/internal-integers");
const clean_internal_murmur3 = () => cleanProject("packages/internal-murmur3");
const clean_indexed_object = () => cleanProject("packages/indexed-object");
const clean_metadata = () => cleanProject("packages/metadata");
const clean_metadata_shim = () => cleanProject("packages/metadata-shim");
const clean_reflect_metadata_compat = () => cleanProject("packages/reflect-metadata-compat");
const clean_type_model = () => cleanProject("packages/type-model");
const clean_dist = () => del(["packages/*/dist", "packages/*/*.tsbuildinfo"]);
const clean = gulp.series(
    gulp.parallel(
        clean_cancelable,
        clean_cancelable_dom,
        clean_cancelable_dom_shim,
        clean_collection_core,
        clean_collection_core_shim,
        clean_collections,
        clean_decorators,
        clean_decorators_stage1_core,
        clean_disposable,
        clean_equatable,
        clean_equatable_shim,
        clean_events,
        clean_internal_binarysearch,
        clean_internal_guards,
        clean_internal_hashcode,
        clean_internal_integers,
        clean_internal_murmur3,
        clean_indexed_object,
        clean_metadata,
        clean_metadata_shim,
        clean_reflect_metadata_compat,
        clean_type_model,
    ),
    clean_dist
);

const test = () => exec(process.execPath, [require.resolve("jest/bin/jest")], { verbose: true });
// const watch = () => spawn('node', [require.resolve("jest/bin/jest"), "--watch"], { stdio: "inherit" });

const ci = gulp.series(clean, build);

gulp.task("packages/cancelable", cancelable);
gulp.task("packages/cancelable-dom", cancelable_dom);
gulp.task("packages/cancelable-dom-shim", cancelable_dom_shim);
gulp.task("packages/collection-core", collection_core);
gulp.task("packages/collection-core-shim", collection_core_shim);
gulp.task("packages/collections", collections);
gulp.task("packages/decorators", decorators);
gulp.task("packages/decorators-stage1-core", decorators_stage1_core);
gulp.task("packages/disposable", disposable);
gulp.task("packages/equatable", equatable);
gulp.task("packages/equatable-shim", equatable_shim);
gulp.task("packages/events", events);
gulp.task("packages/internal-binarysearch", internal_binarysearch);
gulp.task("packages/internal-guards", internal_guards);
gulp.task("packages/internal-hashcode", internal_hashcode);
gulp.task("packages/internal-integers", internal_integers);
gulp.task("packages/internal-murmur3", internal_murmur3);
gulp.task("packages/indexed-object", indexed_object);
gulp.task("packages/metadata", metadata);
gulp.task("packages/metadata-shim", metadata_shim);
gulp.task("packages/reflect-metadata-compat", reflect_metadata_compat);
gulp.task("packages/type-model", type_model);
gulp.task("packages", build);
gulp.task("build", build);
gulp.task("default", build);
gulp.task("test", gulp.series(build, test));
// gulp.task("watch", watch);
gulp.task("clean", clean);
gulp.task("ci", ci);