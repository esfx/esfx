---
to: "<%=packageDir%>/package.json"
---
{
    "name": <%-JSON.stringify(name)%>,
    "version": <%-JSON.stringify(version)%>,
    "description": "Native bindings for @esfx/equatable",
    "type": "commonjs",
    "exports": {
        ".": {
            "require": "./index.js",
            "import": "./index.mjs",
            "types": "./index.d.ts"
        }
    },
    "engines": {
<% engines.forEach(({runtime, versions}, i) => {-%>
        <%-JSON.stringify(runtime)%>: <%-JSON.stringify(versions)%><%- i === engines.length - 1 ? "" : ","%>
<% }) -%>
    },
    "os": [<%-JSON.stringify(platform)%>],
    "cpu": [<%-JSON.stringify(arch)%>],
    "publishConfig": {
        "access": "public"
    }
}
