// @ts-check
const ts = require("typescript");
const path = require("path");
const fs = require("fs");
const { createInliner } = require("./inliner");
const { exec } = require("../exec");
const log = require("fancy-log");

/**
 * @param {readonly string[]} projects
 */
async function prebuildSolution(projects) {
    /**
     * @typedef {readonly ts.ResolvedConfigFileName[]} BuildOrder
     * @typedef {{ buildOrder: BuildOrder, circularDiagnostics: readonly ts.Diagnostic[] }} CircularBuildOrder
     * @typedef {BuildOrder | CircularBuildOrder} AnyBuildOrder
     */

    const host = ts.createSolutionBuilderHost();
    const builder = ts.createSolutionBuilder(host, projects, { force: true });
    const anyBuildOrder = /** @type {AnyBuildOrder}*/(/** @type {*} */(builder).getBuildOrder());
    const buildOrder = "buildOrder" in anyBuildOrder ? anyBuildOrder.buildOrder : anyBuildOrder;

    // run prebuild scripts
    for (const configFile of buildOrder) {
        const packageDir = path.dirname(configFile);

        let packageJson;
        try { packageJson = JSON.parse(fs.readFileSync(path.resolve(packageDir, "package.json"), "utf8")); } catch { }

        if (packageJson?.scripts?.prebuild) {
            await exec("yarn", ["workspace", packageJson.name, "run", "prebuild"], { verbose: true });
        }
    }
}

exports.prebuildSolution = prebuildSolution;

/**
 * @param {ts.SolutionBuilderHost} host
 * @param {ts.SolutionBuilder} builder
 * @param {boolean} [execPrebuildScripts]
 */
async function buildSolution(host, builder, execPrebuildScripts = true) {
    /** @type {ts.ResolvedConfigFileName[]} */
    const projects = [];
    let hasCycle = false;
    let hasErrors = false;
    let hasSuccesses = false;
    while (true) {
        const result = await buildNextInvalidatedProject(host, builder, execPrebuildScripts);
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
 * @param {boolean} [execPrebuildScripts]
 */
async function buildNextInvalidatedProject(host, builder, execPrebuildScripts = true) {
    const invalidatedProject = builder.getNextInvalidatedProject();
    if (!invalidatedProject) return;

    let exitStatus;
    if (invalidatedProject.kind === ts.InvalidatedProjectKind.Build) {
        const packageDir = path.dirname(invalidatedProject.project);

        if (execPrebuildScripts) {
            let packageJson;
            try { packageJson = JSON.parse(fs.readFileSync(path.resolve(packageDir, "package.json"), "utf8")); } catch { }

            if (packageJson?.scripts?.prebuild) {
                await exec("yarn", ["workspace", packageJson.name, "run", "prebuild"], { verbose: true });
            }
        }

        // capture the program before we call 'done', as 'done' makes the program unreachable
        const program = invalidatedProject.getProgram();
        if (!program) throw new Error("Program expected");

        log(`Building '${packageDir}'...`);

        exitStatus = invalidatedProject.done(
            /*cancellationToken*/ undefined,
            /*writeFile*/ undefined,
            /*customTransformers*/ { before: [createInliner(program)] }
        );

        // recompile as an esm module or cjs module, as needed.
        const compilerOptions = invalidatedProject.getCompilerOptions();
        if (compilerOptions.outDir?.endsWith("/dist/cjs")) {
            recompileAs(invalidatedProject.project, program, compilerOptions.outDir.slice(0, -"/dist/cjs".length) + "/dist/esm", "module");
        }
        else if (compilerOptions.outDir?.endsWith("/dist/esm")) {
            recompileAs(invalidatedProject.project, program, compilerOptions.outDir.slice(0, -"/dist/esm".length) + "/dist/cjs", "commonjs");
        }
    }
    else {
        exitStatus = invalidatedProject.done();
    }

    return { exitStatus, invalidatedProject };
}
exports.buildNextInvalidatedProject = buildNextInvalidatedProject;

/**
 * @param {ts.ResolvedConfigFileName} project
 * @param {ts.Program} program
 * @param {string} outDir
 * @param {"commonjs" | "module"} moduleType
 */
function recompileAs(project, program, outDir, moduleType) {
    const projectDir = path.dirname(project);
    const compilerOptions = program.getCompilerOptions();
    const newProgram = ts.createProgram({
        options: {
            ...compilerOptions,
            outDir,
            declaration: false,
            declarationDir: undefined,
            declarationMap: undefined,
            moduleResolution: ts.ModuleResolutionKind.NodeJs,
            module: moduleType === "commonjs" ? ts.ModuleKind.CommonJS : ts.ModuleKind.ESNext,
            composite: false,
            incremental: false,
            tsBuildInfoFile: `${projectDir}/tsconfig.${moduleType}.tsbuildinfo`
        },
        rootNames: program.getRootFileNames(),
        projectReferences: program.getProjectReferences(),
        oldProgram: program,
    });

    log(`Recompiling '${projectDir}' for '${moduleType}'...`);

    newProgram.emit(
        /*targetSourceFile*/ undefined,
        /*writeFile*/ undefined,
        /*cancellationToken*/ undefined,
        /*emitOnlyDtsFiles*/ undefined,
        /*customTransformers*/ { before: [createInliner(newProgram)] }
    );

    const packageStubFile = path.join(outDir, "package.json");
    const packageStub = `{ "type": "${moduleType}" }`;
    if (!fs.existsSync(packageStubFile) || fs.readFileSync(packageStubFile, "utf8") !== packageStub) {
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(packageStubFile, packageStub);
    }
}