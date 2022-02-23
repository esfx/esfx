// @ts-check
const ts = require("typescript");
const path = require("path");
const { build } = require('esbuild');

/**
 * @param {ts.SolutionBuilderHost} host 
 * @param {ts.SolutionBuilder} builder 
 */
async function buildSolution(host, builder) {
    /** @type {ts.ResolvedConfigFileName[]} */
    const projects = [];
    while (true) {
        const invalidatedProject = await buildNextInvalidatedProject(host, builder);
        if (!invalidatedProject) break;
        projects.push(invalidatedProject.project);
    }
    return projects;
}
exports.buildSolution = buildSolution;

/**
 * @param {ts.SolutionBuilderHost} host 
 * @param {ts.SolutionBuilder} builder 
 */
async function buildNextInvalidatedProject(host, builder) {
    const invalidatedProject = builder.getNextInvalidatedProject();
    if (!invalidatedProject) return;

    const packageDir = path.dirname(invalidatedProject.project);
    const esbuildConfigJsFile = path.join(packageDir, "esbuild.config.js");
    if (host.fileExists(esbuildConfigJsFile)) {
        invalidatedProject.done(/*cancellationToken*/ undefined, /*writeFile*/ (fileName, data, writeBom) => {
            // skip '.js' and '.js.map' files files
            if (fileName.endsWith(".js") || fileName.endsWith(".js.map")) return;
            host.writeFile(fileName, data, writeBom);
        });
        await build({ ...require(esbuildConfigJsFile), absWorkingDir: packageDir });
    }
    else {
        invalidatedProject.done();
    }
    return invalidatedProject;
}
exports.buildNextInvalidatedProject = buildNextInvalidatedProject;