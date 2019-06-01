---
to: <%=packagePath%>/package.json
---
{
    "name": "<%=packageName%>",
    "version": "<%=version%>",
    "description": "<%-description%>",
    "main": "dist",
    "types": "dist",
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
<% [{ name: "tslib", version: "1.9.3" }].concat(dependencies).forEach((pkg, i, dependencies) => { -%>
        <%-JSON.stringify(pkg.name)%>: <%-JSON.stringify("^" + pkg.version)%><% if (i !== dependencies.length - 1) {%>,<%}%>
<% }); -%>
    },
    "publishConfig": {
        "access": "public"
    }
}
