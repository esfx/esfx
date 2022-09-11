---
to: "<%=packagePath%>/tsconfig.esm.json"
---
{
    "extends": "./tsconfig",
    "compilerOptions": {
        "outDir": "dist/esm",
        "module": "esnext",
    },
    "references": [
        // devDependencies
<% devDependencies.filter(pkg => !!pkg.path).forEach((pkg, i) => { -%>
        { "path": <%-JSON.stringify(`${pkg.path}/tsconfig.esm.json`)%> },
<% }); -%>

        // dependencies
<% dependencies.filter(pkg => !!pkg.path).forEach((pkg, i) => { -%>
        { "path": <%-JSON.stringify(`${pkg.path}/tsconfig.esm.json`)%> },
<% }); -%>
    ]
}