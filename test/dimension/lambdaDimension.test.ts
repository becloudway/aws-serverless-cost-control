/* eslint-disable no-undef */

import { subMinutes } from 'date-fns';
import { LambdaDimension } from '../../src/dimension';
import { buildResource } from '../_helpers/builders';
import { Resource } from '../../src/resource';
import { SERVICE_LAMBDA } from '../../src/config';
import { lambdaClient } from '../../src/clients';

jest.mock('../../src/logger');
describe('#LambdaDimension', () => {
    let dimension: LambdaDimension;
    const resource: Resource = buildResource({ service: SERVICE_LAMBDA });
    const end = subMinutes(new Date(), 1);
    const start = subMinutes(end, 1);


    describe('#accessors', () => {
        beforeEach(() => {
            dimension = new LambdaDimension(resource, start, end);
        });

        it('has averageDuration getter and setter', () => {
            dimension.averageDuration = 10;
            expect(dimension.averageDuration).toEqual(10);
        });

        it('has memory getter and setter', () => {
            dimension.memory = 512;
            expect(dimension.memory).toEqual(512);
        });

        it('has requestCount getter and setter', () => {
            dimension.requestCount = 100 * 1000;
            expect(dimension.requestCount).toEqual(100 * 1000);
        });

        it('has dataTransferOutInternetGb getter', () => {
            expect(dimension).toHaveProperty('dataTransferOutInternetGb', 0);
        });
        it('has dataTransferOutIntraRegionGb getter', () => {
            expect(dimension).toHaveProperty('dataTransferOutIntraRegionGb', 0);
        });
        it('has dataTransferOutInterRegionsGb getter', () => {
            expect(dimension).toHaveProperty('dataTransferOutInterRegionsGb', 0);
        });
        it('has toRegion getter', () => {
            expect(dimension).toHaveProperty('toRegion', '');
        });
    });
    describe('#create', () => {
        const duration = 3000;
        const invocations = 500 * 1000 * 1000;
        const memory = 1024;

        beforeEach(() => {
            lambdaClient.calculateLambdaDuration = jest.fn().mockResolvedValue(duration);
            lambdaClient.calculateLambdaInvocations = jest.fn().mockResolvedValue(invocations);
            lambdaClient.getMemory = jest.fn().mockResolvedValue(memory);
            dimension = new LambdaDimension(resource, start, end);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('returns instance of dimension', async () => {
            await expect(dimension.create()).resolves.toBeInstanceOf(LambdaDimension);
        });

        it('fetches lambda parameters from aws and sets corresponding properties', async () => {
            await dimension.create();

            expect(lambdaClient.calculateLambdaInvocations).toHaveBeenCalledTimes(1);
            expect(lambdaClient.calculateLambdaInvocations).toHaveBeenCalledWith(resource, start, end);
            expect(dimension.requestCount).toEqual(invocations);

            expect(lambdaClient.calculateLambdaDuration).toHaveBeenCalledTimes(1);
            expect(lambdaClient.calculateLambdaDuration).toHaveBeenCalledWith(resource, start, end);
            expect(dimension.averageDuration).toEqual(duration);

            expect(lambdaClient.getMemory).toHaveBeenCalledTimes(1);
            expect(lambdaClient.getMemory).toHaveBeenCalledWith(resource);
            expect(dimension.memory).toEqual(memory);
        });
    });
});
