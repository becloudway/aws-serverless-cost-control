/* eslint-disable no-undef */
import * as AWS from 'aws-sdk';
import { ModifyDBClusterMessage } from 'aws-sdk/clients/rds';
import { GetMetricStatisticsInput, GetMetricStatisticsOutput } from 'aws-sdk/clients/cloudwatch';
import { regions } from '../../src/config';
import { CloudwatchClient, RDSClient } from '../../src/clients';
import { Resource } from '../../src/resource';
import { buildMetricsStatisticsInput, buildRange, buildResource } from '../_helpers/builders';
import { DateRange } from '../../src/types';
import { RDSThrottleOptions } from '../../src/clients/RDSClient';

describe('#RDSClient', () => {
    const awsCloudWatch = new AWS.CloudWatch({ apiVersion: '2010-08-01', region: regions.CURRENT_REGION });
    const awsRDS = new AWS.RDS({ apiVersion: '2014-10-31', region: regions.CURRENT_REGION });
    const clwClient: CloudwatchClient = new CloudwatchClient(awsCloudWatch);
    const client: RDSClient = new RDSClient(awsRDS, clwClient);
    const resource: Resource = buildResource();
    const range: DateRange = buildRange();

    beforeAll(() => {
        this.modifyDBClusterMock = jest.fn();
        this.getMetricStatisticsMock = jest.fn();

        awsRDS.modifyDBCluster = this.modifyDBClusterMock;
        awsCloudWatch.getMetricStatistics = this.getMetricStatisticsMock;
    });

    afterEach(() => jest.resetAllMocks());
    afterAll(() => jest.restoreAllMocks());

    describe('#getACUs', () => {
        const input: GetMetricStatisticsInput = buildMetricsStatisticsInput({
            nameSpace: 'AWS/RDS',
            metricName: 'ServerlessDatabaseCapacity',
            dimensions: [{ Name: 'DBClusterIdentifier', Value: resource.id }],
            startTime: range.start,
            endTime: range.end,
            period: 60,
            statistics: ['Average'],
        });

        it('returns acu average if datapoints exist', async () => {
            const acuAverage = 5;
            const output: GetMetricStatisticsOutput = { Datapoints: [{ Average: acuAverage }] };

            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));
            await expect(client.getACUs(resource.id, range.start, range.end)).resolves.toEqual(acuAverage);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('returns 0 if datapoints have no Average information', async () => {
            const output: GetMetricStatisticsOutput = { Datapoints: [{ Timestamp: new Date() }] };

            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));
            await expect(client.getACUs(resource.id, range.start, range.end)).resolves.toEqual(0);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('returns 0 if no datapoints exist', async () => {
            const output: GetMetricStatisticsOutput = { Datapoints: [] };

            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));
            await expect(client.getACUs(resource.id, range.start, range.end)).resolves.toEqual(0);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });
    });

    describe('#getIoRequests', () => {
        const input: GetMetricStatisticsInput = buildMetricsStatisticsInput({
            nameSpace: 'AWS/RDS',
            metricName: 'NetworkThroughput',
            dimensions: [{ Name: 'DBClusterIdentifier', Value: resource.id }],
            startTime: range.start,
            endTime: range.end,
            period: 60,
            statistics: ['Average'],
        });

        it('returns average throughput if datapoints exist', async () => {
            const average = 300;
            const output: GetMetricStatisticsOutput = { Datapoints: [{ Average: average }] };

            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));
            await expect(client.getIoRequests(resource.id, range.start, range.end)).resolves.toEqual(average);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('returns 0 if no average datapoints exist', async () => {
            const output: GetMetricStatisticsOutput = { Datapoints: [] };

            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));
            await expect(client.getIoRequests(resource.id, range.start, range.end)).resolves.toEqual(0);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('returns 0 if datapoints has no Average information', async () => {
            const output: GetMetricStatisticsOutput = { Datapoints: [{ Timestamp: new Date() }] };

            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));
            await expect(client.getIoRequests(resource.id, range.start, range.end)).resolves.toEqual(0);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });
    });

    describe('#getStoredGiBs', () => {
        const input: GetMetricStatisticsInput = buildMetricsStatisticsInput({
            nameSpace: 'AWS/RDS',
            metricName: 'FreeLocalStorage',
            dimensions: [{ Name: 'DBClusterIdentifier', Value: resource.id }],
            startTime: range.start,
            endTime: range.end,
            period: 60,
            statistics: ['Average'],
        });

        it('returns average stored GiBs if datapoints exist', async () => {
            const average = 300;
            const output: GetMetricStatisticsOutput = { Datapoints: [{ Average: average }] };

            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));
            await expect(client.getStoredGiBs(resource.id, range.start, range.end)).resolves.toEqual(average);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('returns 0 if no average datapoints exist', async () => {
            const output: GetMetricStatisticsOutput = { Datapoints: [] };

            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));
            await expect(client.getStoredGiBs(resource.id, range.start, range.end)).resolves.toEqual(0);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('returns 0 if datapoints has no Average information', async () => {
            const output: GetMetricStatisticsOutput = { Datapoints: [{ Timestamp: new Date() }] };

            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));
            await expect(client.getStoredGiBs(resource.id, range.start, range.end)).resolves.toEqual(0);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });
    });
    describe('#throttle', () => {
        const options: RDSThrottleOptions = {
            autoPause: true,
            maxCapacity: 1,
            minCapacity: 1,
        };

        const input: ModifyDBClusterMessage = {
            DBClusterIdentifier: resource.id,
            ApplyImmediately: true,
            ScalingConfiguration: {
                AutoPause: options.autoPause,
                MaxCapacity: options.maxCapacity,
                MinCapacity: options.minCapacity,
            },
        };

        it('invokes aws.modifyDBCluster', async () => {
            this.modifyDBClusterMock.mockImplementation((data: any, callback: Function) => callback(null, 'OK'));

            await expect(client.throttle(resource.id, options)).resolves.toBeUndefined();
            expect(awsRDS.modifyDBCluster).toHaveBeenCalledTimes(1);
            expect(awsRDS.modifyDBCluster).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('throttles by default to a max and min capacity of 2 and autopause 2', async () => {
            const mockInput: ModifyDBClusterMessage = JSON.parse(JSON.stringify(input));
            mockInput.ScalingConfiguration = {
                AutoPause: true,
                MaxCapacity: 2,
                MinCapacity: 2,
            };
            this.modifyDBClusterMock.mockImplementation((data: any, callback: Function) => callback(null, 'OK'));

            await expect(client.throttle(resource.id)).resolves.toBeUndefined();
            expect(awsRDS.modifyDBCluster).toHaveBeenCalledTimes(1);
            expect(awsRDS.modifyDBCluster).toHaveBeenCalledWith(mockInput, expect.any(Function));
        });
    });
});
