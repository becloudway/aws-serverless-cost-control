import * as jestMock from 'jest-mock';

const createMockInstance = (cl: any): any => {
    const Mock = jestMock.generateFromMetadata(jestMock.getMetadata(cl));
    return new Mock();
};

export {
    createMockInstance,
};

