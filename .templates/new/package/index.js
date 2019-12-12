const fs = require("fs");
const path = require("path");
const yargs = require('yargs-parser');
const Project = require("@lerna/project");

const TSLIB_VERSION = "1.9.3";

module.exports = {
    prompt: async ({ prompter, args }) => {
        const project = new Project(".");

        let { name } = args;
        if (!name) {
            [, , name] = yargs(process.argv.slice(2))._;
        }
        if (!name) {
            ({ name } = await prompter.prompt({
                type: "input",
                name: "name",
                message: "project name",
                required: true,
            }));
        }
        if (!name) {
            throw new Error("Name required!");
        }

        const { internal } = await prompter.prompt({
            type: "confirm",
            name: "internal",
            message: "is this an internal package?"
        });

        const prefix = internal ? "internal" : "packages";

        const { packageSubPath } = await prompter.prompt({
            type: "input",
            name: "packageSubPath",
            message: `path (under '${prefix}/')`,
            initial: name,
            validate: value => fs.existsSync(path.resolve(project.rootPath, prefix, value))
                ? `Package exists at path '${value}'.`
                : true
        });

        const resolvedRootPath = path.resolve(project.rootPath);
        const relativeRootPath = path.relative(process.cwd(), resolvedRootPath) || ".";
        const resolvedPrefix = path.resolve(project.rootPath, prefix);
        const relativePrefix = path.relative(process.cwd(), resolvedPrefix);
        const resolvedPackagePath = path.resolve(resolvedPrefix, packageSubPath);
        const relativePackagePath = path.relative(process.cwd(), resolvedPackagePath);

        const packages = await project.getPackages();
        const dependenciesMap = new Map(packages.map(pkg => [pkg.name, pkg]));
        dependenciesMap.set("tslib", { name: "tslib", version: TSLIB_VERSION });

        const { packageName } = await prompter.prompt({
            type: "input",
            name: "packageName",
            message: "package name",
            initial: internal ? `@esfx/internal-${name}` : `@esfx/${name}`,
            validate: value => packages.some(pkg => pkg.name === value)
                ? `Package '${value}' already exists.`
                : true
        });

        const unscopedPackageName = packageName.replace(/^@\w+\//, "");

        const { description } = await prompter.prompt({
            type: "input",
            name: "description",
            message: "description",
            initial: internal ? "This package provides internal utilities for '@esfx' and is not intended for use in user-code." : "",
        });

        const { dependenciesSelection } = await prompter.prompt([{
            type: "multiselect",
            name: "dependenciesSelection",
            message: "dependencies",
            limit: 10,
            choices: packages
                .filter(pkg => pkg.name !== "esfx")
                .map(pkg => ({ name: pkg.name, value: pkg.name }))
                .sort((a, b) =>
                    compare(packageWeight(a), packageWeight(b)) ||
                    compare(a.name, b.name))
        }]);

        const dependencies = dependenciesSelection
            .map(name => dependenciesMap.get(name))
            .map(pkg => ({
                name: pkg.name,
                version: pkg.version,
                path: cleanPath(path.relative(resolvedPackagePath, pkg.location))
            }));

        return {
            ...args,
            name,
            version: project.version,
            internal,
            rootPath: cleanPath(relativeRootPath),
            prefix: cleanPath(relativePrefix),
            packagePath: cleanPath(relativePackagePath),
            rootRelativePackagePath: cleanPath(path.relative(resolvedRootPath, resolvedPackagePath)).replace(/^\.\//, ""),
            prefixRelativePackagePath: cleanPath(path.relative(resolvedPrefix, resolvedPackagePath)),
            packageName,
            unscopedPackageName,
            description,
            dependencies,
            injectGulpfileBefore: `add new ${internal ? "internal" : "public"} projects above this line`,
        };
    }
};

function cleanPath(s) {
    if (!path.isAbsolute(s) && s.charAt(0) !== ".") s = `./${s}`;
    return s.replace(/\\/g, "/");
}

function packageWeight(pkg) {
    return pkg.name === "tslib" ? 0 :
        pkg.name.startsWith("@esfx/internal-") ? 1 :
        2;
}

function compare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}