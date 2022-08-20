const path = require("path");
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: [path.join(__dirname, "internal/jest-sequence")],
    transform: {
        "^.+\\.tsx?": "ts-jest",
    },
    resolver: path.join(__dirname, "scripts/resolver.js"),
    testPathIgnorePatterns: [
        '/dist/',
        '/workers/',
        '/data/',
    ],
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
            compiler: require.resolve('typescript')
        },
    }
};