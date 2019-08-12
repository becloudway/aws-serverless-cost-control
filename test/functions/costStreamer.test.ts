/* eslint-disable no-undef */
import * as faker from 'faker';
import { SNSEvent, SNSEventRecord } from 'aws-lambda';
import { handler } from '../../src/functions/costStreamer';
import { KinesisCostRecordWithAnomalyScore, LambdaResponse } from '../../src/types';
import { CloudwatchClient, cloudwatchClient, kinesisClient } from '../../src/clients';
import { Resource, ResourceManager } from '../../src/resource';
import { buildResource, buildSNSRecord } from '../_helpers/builders';
import { metrics, SERVICE_LAMBDA, TAGS } from '../../src/config';
import { Pricing } from '../../src/pricing';
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

    beforeAll(() => {
        this.resourceManagerMock = createMockInstance(ResourceManager);
        this.putRecordMock = jest.fn();
        this.getCostMetricStatisticsMock = jest.fn();
        this.calculateDatapointsAverageMock = jest.fn();
        this.getMonthlyEstimateMock = jest.fn();
        this.getDateRangeMock = jest.fn();
        this.resourceManagerInitMock = jest.fn();

        ResourceManager.prototype.init = this.resourceManagerInitMock;
        CloudwatchClient.calculateDatapointsAverage = this.calculateDatapointsAverageMock;
        Pricing.getMonthlyEstimate = this.getMonthlyEstimateMock;
        cloudwatchClient.getCostMetricStatistics = this.getCostMetricStatisticsMock;
        kinesisClient.putRecord = this.putRecordMock;
        DateTime.getDateRange = this.getDateRangeMock;
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
    });

    afterAll(() => jest.restoreAllMocks());

    it('correctly streams cost 0 to kinesis when no resources are found', async () => {
        const actionableResource = buildResource({ service: SERVICE_LAMBDA, actionable: true });
        const inputEvent = buildInputEvent([actionableResource]);
        const response: LambdaResponse = await handler();

        expect(this.resourceManagerInitMock).toHaveBeenCalledTimes(1);
        expect(this.resourceManagerMock.getResources).toHaveBeenCalledTimes(3);
        expect(this.getCostMetricStatisticsMock).not.toHaveBeenCalled();
        expect(this.calculateDatapointsAverageMock).not.toHaveBeenCalled();
        expect(this.getMonthlyEstimateMock).toHaveBeenCalledTimes(1);
        expect(this.getMonthlyEstimateMock).toHaveBeenCalledWith(0, 60);
        expect(this.putRecordMock).toHaveBeenCalledTimes(1);
        expect(this.putRecordMock).toHaveBeenCalledWith(process.env.KINESIS_STREAM_NAME, { cost: monthlyEstimate, timestamp: range.end });
        expect(response.status).toEqual(200);
    });

    it('correctly streams cost to kinesis for existing resources', async () => {
        const actionableResource = buildResource({ service: SERVICE_LAMBDA, actionable: true });
        const inputEvent = buildInputEvent([actionableResource]);
        this.resourceManagerMock.getResources.mockResolvedValueOnce([actionableResource]);
        const response: LambdaResponse = await handler();

        expect(this.resourceManagerInitMock).toHaveBeenCalledTimes(1);
        expect(this.resourceManagerMock.getResources).toHaveBeenCalledTimes(3);
        expect(this.getCostMetricStatisticsMock).toHaveBeenCalledTimes(1);

        expect(this.getCostMetricStatisticsMock).toHaveBeenCalledWith({
            metricName: metrics.NAME_COST,
            resourceId: actionableResource.id,
            service: actionableResource.service,
            range,
        });
        expect(this.calculateDatapointsAverageMock).toHaveBeenCalledTimes(1);
        expect(this.getMonthlyEstimateMock).toHaveBeenCalledTimes(1);
        expect(this.getMonthlyEstimateMock).toHaveBeenCalledWith(datapointsAverage, 60);
        expect(this.putRecordMock).toHaveBeenCalledTimes(1);
        expect(this.putRecordMock).toHaveBeenCalledWith(process.env.KINESIS_STREAM_NAME, { cost: monthlyEstimate, timestamp: range.end });
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
