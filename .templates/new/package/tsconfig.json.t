---
to: <%=packagePath%>/tsconfig.json
---
{
    "extends": "../tsconfig-base",
    "compilerOptions": {
        "rootDir": "src",
        "outDir": "dist"
    },
    "include": ["src/**/*.ts"],
    "references": [
<% dependencies.forEach((pkg, i) => { -%>
        { "path": <%-JSON.stringify(pkg.path)%> },
<% }); -%>
    ]
}