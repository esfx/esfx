const path = require("path");
module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: [path.join(__dirname, "internal/jest-sequence")],
    resolver: path.join(__dirname, "scripts/resolverEsm.js"),
    transform: {
        "^.+\\.was?t": [require.resolve("./scripts/jest-wat.js"), { esm: true }]
    },
    testPathIgnorePatterns: [
        '/dist/cjs/',
        '/dist/types/',
        '/src/',
        '/workers/',
        '/data/',
        '/obj/',
        '/build/',
    ],
    roots: ['<rootDir>'],
    testMatch: [
        "**/__test?(s)__/**/*.mjs",
        "**/?(*.)+(spec|test?(s)).mjs"
    ],
};