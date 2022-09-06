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
        '/obj/',
        '/build/',
    ],
    roots: ['<rootDir>'],
    globals: {
        'ts-jest': {
            tsconfig: true,
            compiler: require.resolve('typescript')
        },
    },
    testMatch: [
        "**/__test?(s)__/**/*.[jt]s?(x)",
        "**/?(*.)+(spec|test?(s)).[jt]s?(x)"
    ],
};