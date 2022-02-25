// @ts-check
const ts = require("typescript");
const { createProjectQueue } = require("./projectQueue");
const { buildSolution } = require("./buildSolution");

/**
 * @param {readonly string[]} projects
 * @param {boolean} force
 */
async function buildProjects(projects, force) {
    const host = ts.createSolutionBuilderHost();
    const builder = ts.createSolutionBuilder(host, projects, { force });
    buildSolution(host, builder);
}

const enqueueBuildProject = createProjectQueue(projects => buildProjects(projects, /*force*/ false));
const enqueueForceBuildProject = createProjectQueue(projects => buildProjects(projects, /*force*/ true));

/**
 * Build a project.
 * @param {string} project
 * @param {object} options
 * @param {boolean} [options.force]
 */
function buildProject(project, options) {
    return options?.force ? enqueueForceBuildProject(project) : enqueueBuildProject(project);
}

exports.buildProject = buildProject;
