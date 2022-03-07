// @ts-check
const ts = require("typescript");
const path = require("path");
const fs = require("fs");
const { createInliner } = require("./inliner");
const { exec } = require("../exec");

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
 * @param {ts.SolutionBuilder<ts.BuilderProgram>} builder 
 */
async function buildNextInvalidatedProject(host, builder) {
    const invalidatedProject = builder.getNextInvalidatedProject();
    if (!invalidatedProject) return;
    if (invalidatedProject.kind === ts.InvalidatedProjectKind.Build) {
        let packageJson;
        try {
            packageJson = JSON.parse(fs.readFileSync(path.resolve(path.dirname(invalidatedProject.project), "package.json"), "utf8"));
        }
        catch {
        }

        if (packageJson?.scripts?.prebuild) {
            await exec("yarn", ["workspace", packageJson.name, "run", "prebuild"], { verbose: true });
        }
        
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