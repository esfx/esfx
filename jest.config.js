module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: ["./internal/jest-sequence"],
    roots: [
        '<rootDir>/internal/',
        '<rootDir>/packages/',
    ],
    transform: {
        "^.+\\.tsx?": "ts-jest",
    },
    resolver: "<rootDir>/scripts/resolver.js",
    testPathIgnorePatterns: [
        '/dist/',
        '/workers/',
        '/data/',
    ],
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig-base.json',
            compiler: require.resolve('typescript')
        },
    }
};