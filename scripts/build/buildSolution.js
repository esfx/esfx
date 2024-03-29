// @ts-check
const ts = require("typescript");
const path = require("path");
const fs = require("fs");
const { createInliner } = require("./inliner");
const { exec } = require("../exec");
const log = require("fancy-log");
const { convertCjsToMjs } = require("./converters/cjs-to-mjs");
const { convertCjsToCjsLegacy } = require("./converters/cjs-to-cjs-legacy");
const { convertDtsToDmts } = require("./converters/dts-to-dmts.js");

/**
 * @param {ts.SolutionBuilderHost} host
 * @param {ts.SolutionBuilder} builder
 */
async function buildSolution(host, builder) {
    /** @type {ts.ResolvedConfigFileName[]} */
    const projects = [];
    let hasCycle = false;
    let hasErrors = false;
    let hasSuccesses = false;
    while (true) {
        const result = await buildNextInvalidatedProject(host, builder);
        if (!result) break;
        switch (result.exitStatus) {
            case ts.ExitStatus.Success:
                hasSuccesses = true;
                break;
            case ts.ExitStatus.ProjectReferenceCycle_OutputsSkipped:
                hasCycle = true;
                break;
            default:
                hasErrors = true;
        }
        projects.push(result.invalidatedProject.project);
    }

    const exitStatus =
        hasCycle ? ts.ExitStatus.ProjectReferenceCycle_OutputsSkipped :
        !hasErrors ? ts.ExitStatus.Success :
        !hasSuccesses ? ts.ExitStatus.DiagnosticsPresent_OutputsSkipped :
        ts.ExitStatus.DiagnosticsPresent_OutputsGenerated;

    return { exitStatus, projects };
}
exports.buildSolution = buildSolution;

/**
 * @param {ts.SolutionBuilderHost} host
 * @param {ts.SolutionBuilder<ts.BuilderProgram>} builder
 */
async function buildNextInvalidatedProject(host, builder) {
    const invalidatedProject = builder.getNextInvalidatedProject();
    if (!invalidatedProject) return;

    let exitStatus;
    if (invalidatedProject.kind === ts.InvalidatedProjectKind.Build) {
        const packageDir = path.dirname(invalidatedProject.project);
        const configName = path.basename(invalidatedProject.project);

        // capture the program before we call 'done', as 'done' makes the program unreachable
        const program = invalidatedProject.getProgram();
        if (!program) throw new Error("Program expected");

        if (configName === "tsconfig.json") {
            log(`Building '${packageDir}'...`);
        }
        else {
            const match = /^tsconfig\.(.*)\.json$/.exec(configName);
            if (match) {
                log(`Building '${packageDir}' [${match[1]}]...`);
            }
            else {
                log(`Building '${invalidatedProject.project}'...`);
            }
        }

        exitStatus = invalidatedProject.done(
            /*cancellationToken*/ undefined,
            /*writeFile*/ undefined,
            /*customTransformers*/ { before: [createInliner(program)] }
        );

        if (exitStatus === ts.ExitStatus.Success ||
            exitStatus === ts.ExitStatus.DiagnosticsPresent_OutputsGenerated) {
            const tsconfigJsonFile = ts.readJsonConfigFile(invalidatedProject.project, file => fs.readFileSync(file, "utf8"));
            const parsed = ts.parseJsonSourceFileConfigFileContent(tsconfigJsonFile, ts.sys, path.dirname(tsconfigJsonFile.fileName), undefined, invalidatedProject.project);
            if (parsed.options.outDir &&
                parsed.raw.esmDir) {
                const cjsDir = path.resolve(invalidatedProject.project, "..", parsed.options.outDir);
                const esmDir = path.resolve(invalidatedProject.project, "..", parsed.raw.esmDir);
                convertCjsToMjs(cjsDir, esmDir);
                if (parsed.options.declaration && !parsed.options.declarationDir) {
                    const cjsDir = path.resolve(invalidatedProject.project, "..", parsed.options.outDir);
                    const esmDir = path.resolve(invalidatedProject.project, "..", parsed.raw.esmDir);
                    convertDtsToDmts(cjsDir, esmDir);
                }
            }
            if (parsed.options.outDir &&
                parsed.raw.cjsLegacyDir) {
                const cjsDir = path.resolve(invalidatedProject.project, "..", parsed.options.outDir);
                const cjsLegacyDir = path.resolve(invalidatedProject.project, "..", parsed.raw.cjsLegacyDir);
                convertCjsToCjsLegacy(cjsDir, cjsLegacyDir);
            }
        }
    }
    else {
        exitStatus = invalidatedProject.done();
    }

    return { exitStatus, invalidatedProject };
}
exports.buildNextInvalidatedProject = buildNextInvalidatedProject;
