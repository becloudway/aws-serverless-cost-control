module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[t]sx?$',
    setupFiles: ['dotenv/config'],
    globals: {
        'ts-jest': {
            tsConfig: './test/tsconfig.json',
        },
    },
};
