const baseConfig = require("./jest.base.config.js");
module.exports = {
    ...baseConfig,
    cacheDirectory: './obj/.jestPerfCache',
    testMatch: [
        "**/__perf__/**/*.[jt]s?(x)",
        "**/?(*.)+(spec|test?(s)).perf.[jt]s?(x)"
    ],
    testPathIgnorePatterns: [
        '/dist/',
        '/workers/',
        '/data/',
        '/scenarios/',
    ],
    setupFilesAfterEnv: ["jest-performance"]
};