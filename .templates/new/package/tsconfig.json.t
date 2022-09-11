---
to: "<%=packagePath%>/tsconfig.json"
---
{
    "extends": "../tsconfig-base",
    "compilerOptions": {
        "rootDir": "src",
        "outDir": "dist/cjs",
        "declarationDir": "dist/types"
    },
    "include": ["src/**/*.ts"],
    "references": [
        // devDependencies
<% devDependencies.filter(pkg => !!pkg.path).forEach((pkg, i) => { -%>
        { "path": <%-JSON.stringify(pkg.path)%> },
<% }); -%>

        // dependencies
<% dependencies.filter(pkg => !!pkg.path).forEach((pkg, i) => { -%>
        { "path": <%-JSON.stringify(pkg.path)%> },
<% }); -%>
    ]
}