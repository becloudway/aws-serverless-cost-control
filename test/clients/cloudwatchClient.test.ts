/* eslint-disable no-undef */
import * as AWS from 'aws-sdk';
import { subMinutes } from 'date-fns';
import * as faker from 'faker';
import { CloudwatchClient } from '../../src/clients';
import { metrics, regions } from '../../src/config';
import {
    GetCostMetricStatisticsParams,
    GetMetricStatisticsParams,
    PutCostMetricStatisticsParams,
} from '../../src/clients/CloudwatchClient';
import { buildMetricsStatisticsInput, buildPutMetricDataInput, buildDimension } from '../_helpers/builders';

const awsCloudWatch = new AWS.CloudWatch({ apiVersion: '2010-08-01', region: regions.CURRENT_REGION });

describe('#CloudwatchClient', () => {
    let client: CloudwatchClient;

    beforeAll(() => {
        this.start = subMinutes(new Date(), 10);
        this.end = subMinutes(new Date(), 5);

        this.getMetricStatisticsMock = jest.fn();
        this.putMetricDataMock = jest.fn();

        awsCloudWatch.getMetricStatistics = this.getMetricStatisticsMock;
        awsCloudWatch.putMetricData = this.putMetricDataMock;
    });
    beforeEach(() => {
        client = new CloudwatchClient(awsCloudWatch);
    });

    afterEach(() => jest.resetAllMocks());
    afterAll(() => jest.restoreAllMocks());

    describe('#getMetricStatistics', () => {
        const getMetricStatisticsParams: GetMetricStatisticsParams = {
            nameSpace: metrics.NAME_SPACE,
            metricName: faker.lorem.word(),
            dimensions: [buildDimension(), buildDimension()],
            startTime: this.start,
            endTime: this.end,
            period: 300,
            statistics: ['Average', 'Sum'],
        };

        it('resolves with result', async () => {
            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, 'OK'));

            await expect(client.getMetricStatistics(getMetricStatisticsParams)).resolves.toEqual('OK');
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(
                buildMetricsStatisticsInput(getMetricStatisticsParams),
                expect.any(Function),
            );
        });

        it('rejects with an error', async () => {
            const awsError = new Error('AWS error');
            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(awsError, null));

            await expect(client.getMetricStatistics(getMetricStatisticsParams)).rejects.toEqual(awsError);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(
                buildMetricsStatisticsInput(getMetricStatisticsParams),
                expect.any(Function),
            );
        });
    });

    describe('#getCostMetricStatistics', () => {
        const getCostMetricStatisticsParams: GetCostMetricStatisticsParams = {
            range: {
                start: subMinutes(new Date(), 10),
                end: subMinutes(new Date(), 5),
            },
            resourceId: faker.lorem.word(),
            metricName: faker.lorem.word(),
            service: faker.lorem.word(),
        };

        const metricsStatisticsInput = buildMetricsStatisticsInput({
            metricName: getCostMetricStatisticsParams.metricName,
            startTime: getCostMetricStatisticsParams.range.start,
            endTime: getCostMetricStatisticsParams.range.end,
            dimensions: [
                buildDimension(metrics.DIMENSIONS.RESOURCE_ID, getCostMetricStatisticsParams.resourceId),
                buildDimension(metrics.DIMENSIONS.SERVICE_NAME, getCostMetricStatisticsParams.service),
            ],
        });

        it('resolves with result', async () => {
            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, 'OK'));

            await expect(client.getCostMetricStatistics(getCostMetricStatisticsParams)).resolves.toEqual('OK');
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(metricsStatisticsInput, expect.any(Function));
        });
        it('rejects with an error', async () => {
            const awsError = new Error('AWS error');
            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(awsError, null));

            await expect(client.getCostMetricStatistics(getCostMetricStatisticsParams)).rejects.toEqual(awsError);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(metricsStatisticsInput, expect.any(Function));
        });
    });

    describe('#putCostMetricData', () => {
        const putCostMetricStatisticsParams: PutCostMetricStatisticsParams = {
            timestamp: faker.date.recent(),
            value: faker.random.number(),
            resourceId: faker.random.word(),
            metricName: faker.random.word(),
            service: faker.lorem.word(),
        };

        it('resolves with result', async () => {
            this.putMetricDataMock.mockImplementation((data: any, callback: Function) => callback(null));

            await expect(client.putCostMetricData(putCostMetricStatisticsParams)).resolves.toBeUndefined();
            expect(awsCloudWatch.putMetricData).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.putMetricData).toHaveBeenCalledWith(buildPutMetricDataInput(putCostMetricStatisticsParams), expect.any(Function));
        });
        it('rejects with an error', async () => {
            const awsError = new Error('AWS error');
            this.putMetricDataMock.mockImplementation((data: any, callback: Function) => callback(awsError));

            await expect(client.putCostMetricData(putCostMetricStatisticsParams)).rejects.toEqual(awsError);
            expect(awsCloudWatch.putMetricData).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.putMetricData).toHaveBeenCalledWith(buildPutMetricDataInput(putCostMetricStatisticsParams), expect.any(Function));
        });
    });

    describe('#putAnomalyMetricData', () => {
        const metricDataInputParams = {
            timestamp: faker.date.recent(),
            value: faker.random.number(),
            metricName: metrics.NAME_ANOMALY_SCORE,
        };

        it('resolves with result', async () => {
            this.putMetricDataMock.mockImplementation((data: any, callback: Function) => callback(null));

            await expect(client.putAnomalyMetricData(metricDataInputParams.timestamp, metricDataInputParams.value)).resolves.toBeUndefined();
            expect(awsCloudWatch.putMetricData).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.putMetricData).toHaveBeenCalledWith(buildPutMetricDataInput(metricDataInputParams), expect.any(Function));
        });
        it('rejects with an error', async () => {
            const awsError = new Error('AWS error');
            this.putMetricDataMock.mockImplementation((data: any, callback: Function) => callback(awsError));

            await expect(client.putAnomalyMetricData(metricDataInputParams.timestamp, metricDataInputParams.value)).rejects.toEqual(awsError);
            expect(awsCloudWatch.putMetricData).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.putMetricData).toHaveBeenCalledWith(buildPutMetricDataInput(metricDataInputParams), expect.any(Function));
        });
    });
});
