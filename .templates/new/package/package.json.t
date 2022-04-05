---
to: <%=packagePath%>/package.json
sh: cd <%= cwd %> && lerna bootstrap
---
{
    "name": "<%=packageName%>",
    "version": "<%=version%>",
    "description": "<%-description%>",
    "type": "commonjs",
    "types": "./dist/types/index.d.ts",
    "main": "./dist/cjs/index.js",
    "exports": {
        ".": {
            "types": "./dist/types/index.d.ts",
            "require": "./dist/cjs/index.js",
            "import": "./dist/esm/index.js"
        }
    },
    "author": "Ron Buckton (rbuckton@chronicles.org)",
    "license": "Apache-2.0",
    "repository": {
        "type": "git",
        "url": "https://github.com/esfx/esfx.git"
    },
    "bugs": {
        "url": "https://github.com/esfx/esfx/issues"
    },
    "dependencies": {
<% dependencies.forEach((pkg, i, dependencies) => { -%>
        <%-JSON.stringify(pkg.name)%>: <%-JSON.stringify("^" + pkg.version)%><% if (i !== dependencies.length - 1) {%>,<%}%>
<% }); -%>
    },
<% if (devDependencies) { -%>
    "devDependencies": {
<% devDependencies.forEach((pkg, i, dependencies) => { -%>
        <%-JSON.stringify(pkg.name)%>: <%-JSON.stringify("^" + pkg.version)%><% if (i !== dependencies.length - 1) {%>,<%}%>
<% }); -%>
    },
<% } %>
    "publishConfig": {
        "access": "public"
    }
}
