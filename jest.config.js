module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: [
        '<rootDir>/packages/'
    ],
    testPathIgnorePatterns: [
        '/dist/'
    ],
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig-base.json'
        }
    }
};