---
to: "<%=internal ? null : `${packagePath}/docsrc/overwrite/${unscopedPackageName}.md`%>"
---
---
uid: '<%=packageName%>!'
---

# `<%-packageName%>`

<%-description%>

### Overview

* [Installation](#installation)
* [Usage](#usage)

### Installation

```sh
npm i <%-packageName%>
```

#### [TypeScript](#tab/ts)
[!code-typescript[](../examples/usage.ts)]

#### [JavaScript (CommonJS)](#tab/js)
[!code-javascript[](../examples/usage.js)]

***
