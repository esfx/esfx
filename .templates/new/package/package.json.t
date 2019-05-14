---
to: <%=packagePath%>/package.json
---
{
    "name": "<%=packageName%>",
    "version": "<%=version%>",
    "description": "<%=description%>",
    "main": "index.js",
    "types": "index.d.ts",
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
<% dependencies.forEach((pkg, i) => { -%>
        <%-JSON.stringify(pkg.name)%>: <%-JSON.stringify("^" + pkg.version)%><% if (i !== dependencies.length - 1) {%>,<%}%>
<% }); -%>
    },
    "publishConfig": {
        "access": "public"
    }
}
