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

const buildProject = createProjectQueue(async projects => {
    await exec(process.execPath, [require.resolve("typescript/lib/tsc.js"), "-b", ...projects]);
});

const forceBuildProject = createProjectQueue(async projects => {
    await exec(process.execPath, [require.resolve("typescript/lib/tsc.js"), "-b", "--force", ...projects]);
});

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
    await exec(process.execPath, [require.resolve("typescript/lib/tsc.js"), "-b", "--clean", ...projects]);
});

/**
 * Watch a project for changes.
 * @param {string} project
 */
exports.watchProject = createProjectQueue(async projects => {
    await exec(process.execPath, [require.resolve("typescript/lib/tsc.js"), "-b", "--watch", ...projects]);
});
