// @ts-check
const ts = require("typescript");
const path = require("path");
const fs = require("fs");
const { exec } = require("./exec");

/**
 * @param {number} timeout
 * @param {() => Promise} action
 */
function debounce(timeout, action) {
    /** @type {{ promise: Promise, resolve: (value: any) => void, reject: (value: any) => void }} */
    let deferred;
    let timer;

    function enqueue() {
        if (timer) {
            clearTimeout(timer);
            timer = undefined;
        }
        if (!deferred) {
            // @ts-ignore
            deferred = {};
            deferred.promise = new Promise((resolve, reject) => {
                deferred.resolve = resolve;
                deferred.reject = reject;
            });
        }
        timer = setTimeout(run, timeout);
        return deferred.promise;
    }

    function run() {
        if (timer) {
            clearTimeout(timer);
            timer = undefined;
        }
        const currentDeferred = deferred;
        deferred = undefined;
        try {
            currentDeferred.resolve(action());
        }
        catch (e) {
            currentDeferred.reject(e);
        }
    }

    return enqueue;
}

/**
 * @param {(projects: readonly string[]) => Promise} action
 */
function createProjectQueue(action) {
    /** @type {string[]} */
    const projects = [];
    const debouncer = debounce(100, async () => {
        const currentProjects = projects.slice();
        projects.length = 0;
        return action(currentProjects);
    });
    /**
     * @param {string} project
     */
    function enqueue(project) {
        projects.push(project);
        return debouncer();
    }
    return enqueue;
}

/**
 * @param {ProjectInfo} project 
 * @param {string[]} args
 */
async function execBundleTask(project, args) {
    if (!project.bundleTask) throw new Error("Illegal state");
    const packageDir = path.dirname(project.resolvedProject);
    const binDir = path.join(process.cwd(), "node_modules/.bin");
    return exec(project.bundleTask, args, {
        verbose: true,
        cwd: packageDir,
        env: {
            ...process.env,
            PATH: `${process.env.PATH};${binDir}`
        }
    });
}

/**
 * @param {readonly string[]} projects
 * @param {boolean} force
 */
async function buildProjectWorker(projects, force) {
    const stages = composeBuildStages(projects);
    for (const stage of stages) {
        await exec(process.execPath, [require.resolve("typescript/lib/tsc.js"), "-b", ...(force ? ["--force"] : []), ...stage.projects.map(info => info.project)]);
        if (stage.kind === "bundle") {
            for (const project of stage.projects) {
                await execBundleTask(project, []);
            }
        }
    }
}

const buildProject = createProjectQueue(projects => buildProjectWorker(projects, false));
const forceBuildProject = createProjectQueue(projects => buildProjectWorker(projects, true));

/**
 * Build a project.
 * @param {string} project
 * @param {object} options
 * @param {boolean} [options.force]
 */
exports.buildProject = (project, {force} = {}) => force
    ? forceBuildProject(project)
    : buildProject(project);

/**
 * Clean a project's outputs.
 * @param {string} project
 */
exports.cleanProject = createProjectQueue(async projects => {
    const stages = composeBuildStages(projects);
    for (const stage of stages) {
        if (stage.kind === "tsc") {
            await exec(process.execPath, [require.resolve("typescript/lib/tsc.js"), "-b", "--clean", ...stage.projects.map(info => info.project)]);
        }
        else {
            const projects = stage.projects.map(info => {
                const packageDir = path.dirname(info.resolvedProject);
                const tsconfigCleanFile = path.resolve(packageDir, "tsconfig-clean.json");
                if (fs.existsSync(tsconfigCleanFile)) return tsconfigCleanFile;
                return info.project;
            });
            await exec(process.execPath, [require.resolve("typescript/lib/tsc.js"), "-b", "--clean", ...projects], { verbose: true });
        }
    }
});

/**
 * Watch a project for changes.
 * @param {string} project
 */
exports.watchProject = createProjectQueue(async projects => {
    const promises = [exec(process.execPath, [require.resolve("typescript/lib/tsc.js"), "-b", "--watch", ...projects])];
    const bundles = projects.map(getProjectInfo).filter(info => info.kind === "bundle");
    if (bundles.length) {
        for (const project of bundles) {
            promises.push(execBundleTask(project, ["--watch"]));
        }
    }
    await Promise.all(promises);
});

/**
 * @typedef {import("typescript").ResolvedConfigFileName[]} BuildOrder
 */

/**
 * @typedef {object} CircularBuildOrder
 * @property {BuildOrder} buildOrder
 * @property {readonly import("typescript").Diagnostic[]} circularDiagnostics
 */

const host = ts.createSolutionBuilderHost();

/** @type {(file: string, base: string | undefined, getCanonicalFileName: (s: string) => string) => string} */
const toPath = /** @type {*} */(ts).toPath;

/** @type {(ci: boolean) => (s: string) => string} */
const createGetCanonicalFileName = /** @type {*} */(ts).createGetCanonicalFileName;
const getCanonicalFileName = createGetCanonicalFileName(host.useCaseSensitiveFileNames());
const cwd = toPath("", host.getCurrentDirectory(), getCanonicalFileName).replace(/\/$/, "");

/**
 * @param {string} project
 */
function resolveProjectName(project) {
    const resolvedProject = toPath(project, host.getCurrentDirectory(), getCanonicalFileName);
    return resolvedProject.endsWith(".json") ? resolvedProject : `${resolvedProject.replace(/\/$/, "")}/tsconfig.json`;
}

/**
 * @param {string} project
 */
function getProjectId(project) {
    project = resolveProjectName(project);
    if (project.startsWith(cwd + "/")) project = project.slice(cwd.length + 1);
    if (project.endsWith("/tsconfig.json")) project = project.slice(0, project.length - "/tsconfig.json".length);
    return project;
}

/**
 * @typedef {object} ProjectInfo
 * @property {string} resolvedProject
 * @property {string} project
 * @property {"tsc" | "bundle"} kind
 * @property {string} name
 * @property {string} [bundleTask]
 */

/**
 * @param {string} project
 * @returns {ProjectInfo}
 */
function getProjectInfo(project) {
    const resolvedProject = resolveProjectName(project);
    const packageDir = path.dirname(resolvedProject);
    const packageJsonText = fs.readFileSync(path.join(packageDir, "package.json"), "utf8");
    const packageJson = JSON.parse(packageJsonText);
    return {
        resolvedProject: resolvedProject,
        project: getProjectId(resolvedProject),
        kind: packageJson.scripts?.bundle ? "bundle" : "tsc",
        name: packageJson.name,
        bundleTask: packageJson.scripts?.bundle
    };
}

/**
 * @param {string[]} projects
 */
function getBuildOrder(projects) {
    const builder = ts.createSolutionBuilder(host, projects, { });
    const buildOrder = /** @type {BuildOrder | CircularBuildOrder} */(/** @type {*} */(builder).getBuildOrder());
    return Array.isArray(buildOrder) ? buildOrder : buildOrder.buildOrder;
}

/**
 * @typedef {object} BuildStage
 * @property {"tsc" | "bundle"} kind
 * @property {ProjectInfo[]} projects
 */

/**
 * @param {readonly string[]} projects
 */
function composeBuildStages(projects) {
    const buildOrder = getBuildOrder(projects.map(resolveProjectName));

    /** @type {BuildStage} */
    let stage = { kind: "tsc", projects: [] };

    /** @type {BuildStage[]} */
    const stages = [stage];

    for (const resolvedProject of buildOrder) {
        const projectInfo = getProjectInfo(resolvedProject);
        if (projectInfo.kind !== stage.kind) {
            if (stage.projects.length > 0) {
                stage = { kind: projectInfo.kind, projects: [projectInfo] };
                stages.push(stage);
                continue;
            }
            stage.kind = projectInfo.kind;
        }
        stage.projects.push(projectInfo);
    }

    return stages;
}
