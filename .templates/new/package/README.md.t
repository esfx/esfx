---
to: <%=packagePath%>/README.md
---
<% if (internal) { %>
This package provides internal utilities for `@esfx` and is not intended for use in user-code.
<% } else { %> 
# `<%=packageName%>`

<%=description%>

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i <%=packageName%>
```

# Usage

```ts
```

# API

```ts
```
<% } %>
