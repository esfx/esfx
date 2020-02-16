---
to: "<%= exportMap ? packagePath + '/.gitignore' : null %>"
---
/.exportmap.json
/*.d.ts
/*.js
!/index.d.ts
!/index.js