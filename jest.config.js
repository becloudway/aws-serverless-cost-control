module.exports = {
    preset: 'ts-jest',
    coverageDirectory: './coverage/',
    collectCoverage: true,
    collectCoverageFrom: ['./src/**/*.ts'],
    testEnvironment: 'node',
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[t]sx?$',
    globals: {
        'ts-jest': {
            tsConfig: './test/tsconfig.json',
        },
    },
};
