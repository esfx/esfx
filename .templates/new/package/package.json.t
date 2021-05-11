---
to: <%=packagePath%>/package.json
sh: cd <%= cwd %> && lerna bootstrap
---
{
    "name": "<%=packageName%>",
    "version": "<%=version%>",
    "description": "<%-description%>",
    "type": "commonjs",
    "main": "./dist/index.js",
<% if (exportMap) { -%>
    "exports": {
        ".": "./dist/index.js",
        "./index": "./dist/index.js",
        "./index.js": "./dist/index.js"
    },
    "types": "index",
    "typesVersions": {
        "*": {
            "index": ["./dist/index.d.ts"],
            "index.js": ["./dist/index.d.ts"]
        }
    },
<% } else { -%>
    "exports": "./dist/index.js",
    "types": "./dist/index.d.ts",
<% } -%>
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
