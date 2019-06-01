---
to: <%=packagePath%>/README.md
---
<% if (internal) { -%>
This package provides internal utilities for `@esfx` and is not intended for use in user-code.
<% } else { -%>
# `<%-packageName%>`

<%-description%>

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i <%-packageName%>
```

# Usage

```ts
```

# API

You can read more about the API [here](https://esfx.github.io/esfx/modules/<%-unscopedPackageName.replace(/-/g, "_")%>.html).
<% } %>
