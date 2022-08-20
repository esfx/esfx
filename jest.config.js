module.exports = {
    // preset: 'ts-jest',
    // testEnvironment: 'node',
    // setupFilesAfterEnv: ["./internal/jest-sequence"],
    projects: [
        // '<rootDir>/internal/*',
        // '<rootDir>/packages/*',
        '<rootDir>/packages/equatable',
    ],
    // transform: {
    //     "^.+\\.tsx?": "ts-jest",
    // },
    // resolver: "<rootDir>/scripts/resolver.js",
    // testPathIgnorePatterns: [
    //     '/dist/',
    //     '/workers/',
    //     '/data/',
    //     '/obj/',
    //     '/test\\.ts$'
    // ],
    // globals: {
    //     'ts-jest': {
    //         tsconfig: 'tsconfig-base.json',
    //         compiler: require.resolve('typescript')
    //     },
    // }
};