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

        let packageJson;
        try { packageJson = JSON.parse(fs.readFileSync(path.resolve(packageDir, "package.json"), "utf8")); } catch { }

        if (packageJson?.scripts?.prebuild) {
            await exec("yarn", ["workspace", packageJson.name, "run", "prebuild"], { verbose: true });
        }

        // capture the program before we call 'done', as 'done' makes the program unreachable
        const program = invalidatedProject.getProgram();
        exitStatus = invalidatedProject.done(
            /*cancellationToken*/ undefined,
            /*writeFile*/ undefined,
            /*customTransformers*/ { before: [createInliner(invalidatedProject.getProgram())] }
        );

        // recompile as an esm module or cjs module, as needed.
        const compilerOptions = invalidatedProject.getCompilerOptions();
        if (compilerOptions.outDir?.endsWith("/dist/cjs")) {
            recompileAs(program, compilerOptions.outDir.slice(0, -"/dist/cjs".length) + "/dist/esm", "module");
        }
        else if (compilerOptions.outDir?.endsWith("/dist/esm")) {
            recompileAs(program, compilerOptions.outDir.slice(0, -"/dist/esm".length) + "/dist/cjs", "commonjs");
        }
    }
    else {
        exitStatus = invalidatedProject.done();
    }
    return { exitStatus, invalidatedProject };
}
exports.buildNextInvalidatedProject = buildNextInvalidatedProject;

/**
 * @param {ts.Program} program 
 * @param {string} outDir
 * @param {"commonjs" | "module"} moduleType
 */
function recompileAs(program, outDir, moduleType) {
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
        },
        rootNames: program.getRootFileNames(),
        projectReferences: program.getProjectReferences(),
        oldProgram: program,
    });
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