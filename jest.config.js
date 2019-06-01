module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: [
        '<rootDir>/internal/',
        '<rootDir>/packages/',
    ],
    transform: {
        "^.+\\.tsx?": "ts-jest",
    },
    testPathIgnorePatterns: [
        '/dist/',
        '/workers/',
    ],
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig-base.json',
        },
    }
};