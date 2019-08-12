/* eslint-disable no-undef */
import * as faker from 'faker';
import { SNSEvent, SNSEventRecord } from 'aws-lambda';
import { handler } from '../../src/functions/resourceCostCalculator';
import { KinesisCostRecordWithAnomalyScore, LambdaResponse } from '../../src/types';
import {
    CloudwatchClient, cloudwatchClient, kinesisClient, snsClient,
} from '../../src/clients';
import { Resource, ResourceManager } from '../../src/resource';
import { buildResource, buildSNSRecord } from '../_helpers/builders';
import { metrics, SERVICE_LAMBDA, TAGS } from '../../src/config';
import { CostRecord, Pricing } from '../../src/pricing';
import { DateTime } from '../../src/util';
import { createMockInstance } from '../_helpers/mocks';

jest.mock('../../src/logger');

const buildInputEvent = (resources: Resource[]): SNSEvent => ({
    Records: resources.map(r => buildSNSRecord(r)),
});

describe('costStreamer', () => {
    const range = DateTime.getDateRange(5, 1);
    const monthlyEstimate = faker.random.number();
    const datapointsAverage = faker.random.number();
    const resourceCostLimit = faker.random.number();
    const totalCost = faker.random.number();

    beforeAll(() => {
        this.resourceManagerMock = createMockInstance(ResourceManager);
        this.putRecordMock = jest.fn();
        this.getCostMetricStatisticsMock = jest.fn();
        this.calculateDatapointsAverageMock = jest.fn();
        this.getMonthlyEstimateMock = jest.fn();
        this.getDateRangeMock = jest.fn();
        this.resourceManagerInitMock = jest.fn();
        this.costRecordFetchMock = jest.fn();
        this.publishMock = jest.fn();
        this.putCostMetricDataMock = jest.fn();

        ResourceManager.prototype.init = this.resourceManagerInitMock;
        CloudwatchClient.calculateDatapointsAverage = this.calculateDatapointsAverageMock;
        Pricing.getMonthlyEstimate = this.getMonthlyEstimateMock;
        cloudwatchClient.putCostMetricData = this.putCostMetricDataMock;
        kinesisClient.putRecord = this.putRecordMock;
        DateTime.getDateRange = this.getDateRangeMock;
        CostRecord.prototype.fetch = this.costRecordFetchMock;
        snsClient.publish = this.publishMock;
    });

    beforeEach(() => {
        this.resourceManagerMock.init.mockResolvedValue(this.resourceManagerMock);
        this.resourceManagerInitMock.mockResolvedValue(this.resourceManagerMock);
        this.getCostMetricStatisticsMock.mockResolvedValue({ Datapoints: [] });
        this.calculateDatapointsAverageMock.mockReturnValue(datapointsAverage);
        this.getMonthlyEstimateMock.mockReturnValue(monthlyEstimate);
        this.getDateRangeMock.mockReturnValue(range);
    });

    afterEach(() => {
        jest.resetAllMocks();
        this.resourceManagerMock.getResources.mockReset();
        this.costRecordFetchMock.mockReset();
    });

    afterAll(() => {
        jest.restoreAllMocks();
        this.costRecordFetchMock.mockRestore();
    });

    it('does not create costrecords when no resources are available', async () => {
        const response: LambdaResponse = await handler();
        this.resourceManagerMock.getResources.mockResolvedValue([]);

        expect(this.resourceManagerInitMock).toHaveBeenCalledTimes(1);
        expect(this.resourceManagerMock.getResources).toHaveBeenCalledTimes(3);
        expect(this.putCostMetricDataMock).not.toHaveBeenCalled();
        expect(this.publishMock).not.toHaveBeenCalled();
        expect(response.status).toEqual(200);
    });

    it('correctly creates cost records for monitored resources', async () => {
        this.costRecordFetchMock.mockImplementation(function () {
            this._pricing = {
                currency: 'USD',
                estimatedMonthlyCharge: resourceCostLimit - 1,
                totalCostWindowSeconds: faker.random.number(),
                totalCost,
            };
            return this;
        });

        const monitoredResource = buildResource({ service: SERVICE_LAMBDA, actionable: true, costLimit: resourceCostLimit });
        this.resourceManagerMock.getResources.mockResolvedValueOnce([monitoredResource]);
        const response: LambdaResponse = await handler();

        expect(this.resourceManagerInitMock).toHaveBeenCalledTimes(1);
        expect(this.resourceManagerMock.getResources).toHaveBeenCalledTimes(3);
        expect(this.costRecordFetchMock).toHaveBeenCalledTimes(1);
        expect(this.putCostMetricDataMock).toHaveBeenCalledTimes(2);

        [
            { metricName: metrics.NAME_COST, value: totalCost },
            { metricName: metrics.NAME_ESTIMATEDCHARGES, value: resourceCostLimit - 1 },
        ].map(r => expect(this.putCostMetricDataMock).toHaveBeenCalledWith({
            metricName: r.metricName,
            value: r.value,
            resourceId: monitoredResource.id,
            timestamp: range.end,
            service: monitoredResource.service,
        }));

        expect(this.publishMock).not.toHaveBeenCalled();
        expect(response.status).toEqual(200);
    });

    it('triggers alarm when resource estimatedMonthlyCost >= resource costLimit', async () => {
        this.costRecordFetchMock.mockImplementation(function () {
            this._pricing = {
                currency: 'USD',
                estimatedMonthlyCharge: resourceCostLimit + 1,
                totalCostWindowSeconds: faker.random.number(),
                totalCost,
            };
            return this;
        });

        const monitoredResource = buildResource({ service: SERVICE_LAMBDA, actionable: true, costLimit: resourceCostLimit });
        this.resourceManagerMock.getResources.mockResolvedValueOnce([monitoredResource]);
        const response: LambdaResponse = await handler();

        expect(this.resourceManagerInitMock).toHaveBeenCalledTimes(1);
        expect(this.resourceManagerMock.getResources).toHaveBeenCalledTimes(3);
        expect(this.costRecordFetchMock).toHaveBeenCalledTimes(1);
        expect(this.putCostMetricDataMock).toHaveBeenCalledTimes(2);

        [
            { metricName: metrics.NAME_COST, value: totalCost },
            { metricName: metrics.NAME_ESTIMATEDCHARGES, value: resourceCostLimit + 1 },
        ].map(r => expect(this.putCostMetricDataMock).toHaveBeenCalledWith({
            metricName: r.metricName,
            value: r.value,
            resourceId: monitoredResource.id,
            timestamp: range.end,
            service: monitoredResource.service,
        }));

        expect(this.publishMock).toHaveBeenCalledTimes(1);
        expect(response.status).toEqual(200);
    });

    it('correctly sets include and exclude tags', async () => {
        TAGS.INCLUDE_TAGS = ['hello', 'world'];
        TAGS.EXCLUDE_TAGS = ['exclude_me'];

        const response: LambdaResponse = await handler();
        expect(this.resourceManagerInitMock).toHaveBeenCalledTimes(1);
        expect(this.resourceManagerInitMock).toHaveBeenCalledWith(
            [{ key: 'hello', value: 'true' }, { key: 'world', value: 'true' }],
            [{ key: 'exclude_me', value: 'true' }],
        );
    });

    it('returns 400 status with errorMessage when an error occurs', async () => {
        const error = new Error(faker.lorem.sentence());
        this.getDateRangeMock.mockImplementation(() => { throw error; });
        const response: LambdaResponse = await handler();
        expect(response.status).toEqual(400);
        expect(response.message).toEqual(error.message);
    });
});
