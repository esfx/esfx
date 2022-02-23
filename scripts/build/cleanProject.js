// @ts-check
const ts = require("typescript");
const { createProjectQueue } = require("./projectQueue");

/**
 * @param {readonly string[]} projects
 */
async function cleanProjects(projects) {
    const host = ts.createSolutionBuilderHost();
    const builder = ts.createSolutionBuilder(host, projects, {});
    builder.clean();
};

const enqueueCleanProject = createProjectQueue(cleanProjects);

/**
 * Clean a project's outputs.
 * @param {string} project
 */
function cleanProject(project) {
    enqueueCleanProject(project);
}

exports.cleanProject = cleanProject;
