---
to: "<%=packagePath%>/package.json"
sh: cd <%= cwd %> && lerna bootstrap
---
{
    "name": "<%=packageName%>",
    "version": "<%=version%>",
    "description": "<%-description%>",
    "type": "commonjs",
    "types": "./dist/cjs/index.d.ts",
    "main": "./dist/cjs/index.js",
    "exports": {
        ".": {
            "require": {
                "types": "./dist/cjs/index.d.ts",
                "default": "./dist/cjs/index.js"
            },
            "import": {
                "types": "./dist/esm/index.d.mts",
                "default": "./dist/esm/index.mjs"
            }
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
