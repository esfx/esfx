// @ts-check
const ts = require("typescript");
const { createProjectQueue } = require("./projectQueue");
const { buildSolution, buildNextInvalidatedProject, prebuildSolution } = require("./buildSolution");

/**
 * @param {readonly string[]} projects
 */
async function watchProjects(projects) {
    await prebuildSolution(projects);

    const host = ts.createSolutionBuilderWithWatchHost();
    const builder = ts.createSolutionBuilder(host, projects, { });
    const { resolvedProjects } = await buildSolution(host, builder, /*execPrebuildScripts*/ false);
    await startWatching(host, builder, resolvedProjects);
}

const enqueueWatchProject = createProjectQueue(watchProjects);

/**
 * Watch a project for changes.
 * @param {string} project
 */
function watchProject(project) {
    return enqueueWatchProject(project);
}
exports.watchProject = watchProject;

/**
 * @typedef WatcherState
 * @property {ts.SolutionBuilderWithWatchHost} host
 * @property {ts.SolutionBuilder} builder
 * @property {Map<ts.ResolvedConfigFileName, ts.FileWatcher>} configFiles
 * @property {Map<ts.Path, ts.FileWatcher & { watcher: ts.FileWatcher, projects: Set<ts.ResolvedConfigFileName> }>} extendedConfigFiles
 * @property {Map<ts.ResolvedConfigFileName, Map<string, { watcher: ts.FileWatcher, flags: ts.WatchDirectoryFlags }>>} wildcardDirectories
 * @property {Map<ts.ResolvedConfigFileName, Map<ts.Path, ts.FileWatcher>>} inputFiles
 * @property {Map<ts.ResolvedConfigFileName, Map<ts.Path, ts.FileWatcher>>} packageJsonFiles
 * @property {NodeJS.Timeout} [timeout]
 */

/**
 * @param {ts.SolutionBuilderWithWatchHost} host
 * @param {ts.SolutionBuilder} builder
 * @param {readonly ts.ResolvedConfigFileName[]} projects
 */
function startWatching(host, builder, projects) {
    /** @type {WatcherState} */
    const watcherState = {
        host,
        builder,
        configFiles: new Map(),
        extendedConfigFiles: new Map(),
        wildcardDirectories: new Map(),
        inputFiles: new Map(),
        packageJsonFiles: new Map()
    };
    for (const project of projects) {
        const cfg = host.getParsedCommandLine ? host.getParsedCommandLine(project) : ts.getParsedCommandLineOfConfigFile(project, ts.getDefaultCompilerOptions(), {
            useCaseSensitiveFileNames: host.useCaseSensitiveFileNames(),
            getCurrentDirectory: host.getCurrentDirectory,
            fileExists: host.fileExists,
            readFile: host.readFile,
            readDirectory: host.readDirectory || (() => { throw new Error(); })(),
            onUnRecoverableConfigFileDiagnostic: () => {},
        });
        watchConfigFile(watcherState, project, cfg);
        watchExtendedConfigFiles(watcherState, project, cfg);
        if (cfg) {
            watchWildcardDirectories(watcherState, project, cfg);
            watchInputFiles(watcherState, project, cfg);
            watchPackageJsonFiles(watcherState, project, cfg);
        }
    }

    // This promise never resolves to keep gulp open on this task
    return new Promise(() => {});
}

/**
 * @param {WatcherState} watcherState 
 * @param {ts.ResolvedConfigFileName} resolved 
 * @param {ts.ParsedCommandLine | undefined} parsed 
 */
function watchConfigFile(watcherState, resolved, parsed) {
    if (watcherState.configFiles.has(resolved)) return;
    watcherState.configFiles.set(resolved, watcherState.host.watchFile(
        resolved,
        () => { triggerRebuild(watcherState, resolved, "full"); },
        2000,
        parsed?.watchOptions
    ));
}

/**
 * @param {WatcherState} watcherState 
 * @param {ts.ResolvedConfigFileName} resolved 
 * @param {ts.ParsedCommandLine | undefined} parsed 
 */
function watchExtendedConfigFiles(watcherState, resolved, parsed) {
    const extendedConfigs = new Map(/** @type {ts.TsConfigSourceFile} */(/** @type {*} */(parsed)?.configFile)?.extendedSourceFiles?.map(file => [toPath(watcherState, file), file]) ?? []);
    for (const [extendedConfigFilePath, watcher] of watcherState.extendedConfigFiles) {
        if (!extendedConfigs.has(extendedConfigFilePath)) {
            watcher.projects.delete(resolved);
            watcher.close();
        }
    }

    for (const [path, file] of extendedConfigs) {
        const existing = watcherState.extendedConfigFiles.get(path);
        if (existing) {
            existing.projects.add(resolved);
        }
        else {
            watcherState.extendedConfigFiles.set(path, {
                projects: new Set([resolved]),
                watcher: watcherState.host.watchFile(
                    file,
                    () => { 
                        const existing = watcherState.extendedConfigFiles.get(path);
                        if (existing) {
                            for (const project of existing.projects) {
                                triggerRebuild(watcherState, project, "full");
                            }
                        }
                    },
                    2000,
                    parsed?.watchOptions),
                close: () => {
                    const existing = watcherState.extendedConfigFiles.get(path);
                    if (!existing || existing.projects.size) return;
                    existing.watcher.close();
                    watcherState.extendedConfigFiles.delete(path);
                }
            });
        }
    }
}

/**
 * @param {WatcherState} watcherState 
 * @param {ts.ResolvedConfigFileName} resolved 
 * @param {ts.ParsedCommandLine} parsed 
 */
function watchWildcardDirectories(watcherState, resolved, parsed) {
    if (!parsed.wildcardDirectories) return;

    let watchers = watcherState.wildcardDirectories.get(resolved);
    if (!watchers) watcherState.wildcardDirectories.set(resolved, watchers = new Map());

    const unhandledDirectories = new Map(watchers);
    for (const directory in parsed.wildcardDirectories) {
        unhandledDirectories.delete(directory);
        const flags = parsed.wildcardDirectories[directory];
        const existing = watchers.get(directory);
        if (existing) {
            if (existing.flags === flags) continue;
            existing.watcher.close();
        }
        watchers.set(directory, {
            flags,
            watcher: watcherState.host.watchDirectory(directory, fileOrDirectory => {
                if (tsIsIgnoredFileFromWildCardMatching({
                    watchedDirPath: toPath(watcherState, directory),
                    fileOrDirectory,
                    fileOrDirectoryPath: toPath(watcherState, fileOrDirectory),
                    configFileName: resolved,
                    currentDirectory: watcherState.host.getCurrentDirectory(),
                    options: parsed.options,
                    program: parsed.fileNames,
                    useCaseSensitiveFileNames: watcherState.host.useCaseSensitiveFileNames(),
                    writeLog: () => {},
                    toPath: file => toPath(watcherState, file)
                })) return;
                triggerRebuild(watcherState, resolved, "partial");
            })
        });
    }

    for (const [directory, watcher] of unhandledDirectories) {
        watchers.delete(directory);
        watcher.watcher.close();
    }
}

/**
 * @param {WatcherState} watcherState 
 * @param {ts.ResolvedConfigFileName} resolved 
 * @param {ts.ParsedCommandLine} parsed 
 */
function watchInputFiles(watcherState, resolved, parsed) {
    let watchers = watcherState.inputFiles.get(resolved);
    if (!watchers) watcherState.inputFiles.set(resolved, watchers = new Map());

    const unhandledWatchers = new Map(watchers);
    const inputFiles = new Map(parsed.fileNames.map(file => [toPath(watcherState, file), file]));
    for (const [path, file] of inputFiles) {
        if (!unhandledWatchers.delete(path)) {
            watchers.set(path, watcherState.host.watchFile(
                file,
                () => { triggerRebuild(watcherState, resolved, "none"); },
                250,
                parsed.watchOptions
            ));
        }
    }

    for (const [path, watcher] of watchers) {
        watchers.delete(path);
        watcher.close();
    }
}

/**
 * @param {WatcherState} watcherState 
 * @param {ts.ResolvedConfigFileName} resolved 
 * @param {ts.ParsedCommandLine} parsed 
 */
function watchPackageJsonFiles(watcherState, resolved, parsed) {
    // TODO: not currently feasible
}

/**
 * @param {WatcherState} watcherState 
 * @param {ts.ResolvedConfigFileName} resolved 
 * @param {"full" | "partial" | "none"} reload
 */
function triggerRebuild(watcherState, resolved, reload) {
    /** @type {*} */(watcherState.builder).invalidateProject(resolved, reload === "full" ? 2 : reload === "partial" ? 1 : 0);
    queueRebuild(watcherState);
}

/**
 * @param {WatcherState} watcherState 
 */
function queueRebuild(watcherState) {
    if (!watcherState.host.clearTimeout || !watcherState.host.setTimeout) throw new Error();
    if (watcherState.timeout) watcherState.host.clearTimeout(watcherState.timeout);
    watcherState.timeout = watcherState.host.setTimeout(async () => {
        watcherState.timeout = undefined;
        const result = await buildNextInvalidatedProject(watcherState.host, watcherState.builder);
        if (result) {
            queueRebuild(watcherState);
        }
    }, 250);
}

/** @type {(file: string, base: string | undefined, getCanonicalFileName: (s: string) => string) => ts.Path} */
const tsToPath = /** @type {*} */(ts).toPath;

/** @type {(useCaseSensitiveFileNames: boolean) => (s: string) => string} */
const tsCreateGetCanonicalFileName = /** @type {*} */(ts).createGetCanonicalFileName;

/**
 * @typedef IsIgnoredFileFromWildCardWatchingInput
 * @property {ts.Path} watchedDirPath
 * @property {string} fileOrDirectory
 * @property {ts.Path} fileOrDirectoryPath
 * @property {string} configFileName
 * @property {ts.CompilerOptions} options
 * @property {ts.BuilderProgram | ts.Program | readonly string[] | undefined} program
 * @property {readonly ts.FileExtensionInfo[]} [extraFileExtensions]
 * @property {string} currentDirectory
 * @property {boolean} useCaseSensitiveFileNames
 * @property {(s: string) => void} writeLog
 * @property {(s: string) => ts.Path} toPath
 */
/** @type {(opts: IsIgnoredFileFromWildCardWatchingInput) => boolean} */
const tsIsIgnoredFileFromWildCardMatching = /** @type {*} */(ts).tsIsIgnoredFileFromWildCardMatching;

/**
 * @param {WatcherState} watcherState`
 * @param {string} file 
 */
function toPath(watcherState, file) {
    return tsToPath(file, watcherState.host.getCurrentDirectory(), tsCreateGetCanonicalFileName(watcherState.host.useCaseSensitiveFileNames()));
}