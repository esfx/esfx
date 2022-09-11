---
inject: true
to: "<%=prefix%>/tsconfig.json"
before: add new project references above this line
---
        { "path": <%-JSON.stringify(prefixRelativePackagePath)%> },