---
to: <%=packagePath%>/.npmignore
---
__tests__
src
tsconfig.json
tsconfig.tsbuildinfo
api-extractor.json
<% if (exportMap) { -%>
/.exportmap.json
/*.d.ts
/*.js
!/index.d.ts
!/index.js
<% } %>