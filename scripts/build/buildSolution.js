// @ts-check
const ts = require("typescript");
const { createInliner } = require("./inliner");

/**
 * @param {ts.SolutionBuilderHost} host 
 * @param {ts.SolutionBuilder} builder 
 */
function buildSolution(host, builder) {
    /** @type {ts.ResolvedConfigFileName[]} */
    const projects = [];
    while (true) {
        const invalidatedProject = buildNextInvalidatedProject(host, builder);
        if (!invalidatedProject) break;
        projects.push(invalidatedProject.project);
    }
    return projects;
}
exports.buildSolution = buildSolution;

/**
 * @param {ts.SolutionBuilderHost} host 
 * @param {ts.SolutionBuilder<ts.BuilderProgram>} builder 
 */
function buildNextInvalidatedProject(host, builder) {
    const invalidatedProject = builder.getNextInvalidatedProject();
    if (!invalidatedProject) return;
    if (invalidatedProject.kind === ts.InvalidatedProjectKind.Build) {
        invalidatedProject.done(
            /*cancellationToken*/ undefined,
            /*writeFile*/ undefined,
            /*customTransformers*/ { before: [createInliner(invalidatedProject.getProgram())] }
        );
    }
    else {
        invalidatedProject.done();
    }
    return invalidatedProject;
}
exports.buildNextInvalidatedProject = buildNextInvalidatedProject;