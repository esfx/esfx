---
inject: true
to: "<%=prefix%>/tsconfig.esm.json"
before: add new project references above this line
---
        { "path": <%-JSON.stringify(`${prefixRelativePackagePath}/tsconfig.esm.json`)%> },