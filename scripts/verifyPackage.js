const packlist = require('npm-packlist');
const path = require("path");
const fs = require("fs");

main().catch(e => {
    console.error(e);
    process.exit(1);
});

async function main() {
    const files = await packlist({ path: process.cwd() });
    files.sort();
    const packageName = process.env.npm_package_name ?? "";
    const prefix = packageName ? `verifyPackage.js [${packageName}]: ` : "";

    if (!fs.existsSync(path.resolve(".npmfiles"))) {
        console.log(`${prefix}'.npmfiles' not found. The following files will be included:`);
        for (const file of files) {
            console.log(`  ${file}`);
        }
        return;
    }

    const expectedFiles = new Set(fs.readFileSync(".npmfiles", "utf8")
        .split(/\r?\n/g)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith("#")));

    const extraFiles = new Set();
    for (const file of files) {
        if (!expectedFiles.delete(file)) {
            extraFiles.add(file);
        }
    }

    if (expectedFiles.size || extraFiles.size) {
        console.log(`${prefix}Package contents did not match expected files:`)
        if (expectedFiles.size) {
            console.log("  Missing files:");
            for (const file of expectedFiles) {
                console.log(`    ${file}`);
            }
        }
        if (extraFiles.size) {
            console.log("  Extra files:");
            for (const file of extraFiles) {
                console.log(`    ${file}`);
            }
        }

        process.exit(expectedFiles.size + extraFiles.size);
    }
}
