/* eslint-disable no-undef */
import * as AWS from 'aws-sdk';
import {
    FunctionConfiguration,
    GetFunctionConfigurationRequest, MemorySize,
    PutFunctionConcurrencyRequest,
} from 'aws-sdk/clients/lambda';
import { GetMetricStatisticsInput, GetMetricStatisticsOutput } from 'aws-sdk/clients/cloudwatch';
import { metrics, regions } from '../../src/config';
import { CloudwatchClient, LambdaClient } from '../../src/clients';
import { Resource } from '../../src/resource';
import { buildMetricsStatisticsInput, buildRange, buildResource } from '../_helpers/builders';
import { DateRange } from '../../src/types';

describe('#LambdaClient', () => {
    const awsCloudWatch = new AWS.CloudWatch({ apiVersion: '2010-08-01', region: regions.CURRENT_REGION });
    const awsLambda = new AWS.Lambda({ apiVersion: '2015-03-31', region: regions.CURRENT_REGION });
    const clwClient: CloudwatchClient = new CloudwatchClient(awsCloudWatch);
    const client: LambdaClient = new LambdaClient(awsLambda, clwClient);
    const resource: Resource = buildResource();
    const range: DateRange = buildRange();

    beforeAll(() => {
        this.putFunctionConcurrencyMock = jest.fn();
        this.getFunctionConfigurationMock = jest.fn();
        this.getMetricStatisticsMock = jest.fn();

        awsLambda.putFunctionConcurrency = this.putFunctionConcurrencyMock;
        awsLambda.getFunctionConfiguration = this.getFunctionConfigurationMock;
        awsCloudWatch.getMetricStatistics = this.getMetricStatisticsMock;
    });

    afterEach(() => jest.resetAllMocks());
    afterAll(() => jest.restoreAllMocks());

    describe('#calculateLambdaInvocations', () => {
        const input: GetMetricStatisticsInput = buildMetricsStatisticsInput({
            nameSpace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensions: [{ Name: 'FunctionName', Value: resource.id }],
            startTime: range.start,
            endTime: range.end,
            period: 60 * metrics.METRIC_WINDOW,
            statistics: ['Sum'],
        });

        it('returns number of invocation if datapoints exist', async () => {
            const invocationSum = 5;
            const output: GetMetricStatisticsOutput = { Datapoints: [{ Sum: invocationSum }] };

            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));
            await expect(client.calculateLambdaInvocations(resource, range.start, range.end)).resolves.toEqual(invocationSum);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('returns 0 if datapoints have no Sum information', async () => {
            const output: GetMetricStatisticsOutput = { Datapoints: [{ Timestamp: new Date() }] };

            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));
            await expect(client.calculateLambdaInvocations(resource, range.start, range.end)).resolves.toEqual(0);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('returns 0 if no datapoints exist', async () => {
            const output: GetMetricStatisticsOutput = { Datapoints: [] };

            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));
            await expect(client.calculateLambdaInvocations(resource, range.start, range.end)).resolves.toEqual(0);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });
    });

    describe('#calculateLambdaDuration', () => {
        const input: GetMetricStatisticsInput = buildMetricsStatisticsInput({
            nameSpace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensions: [{ Name: 'FunctionName', Value: resource.id }],
            startTime: range.start,
            endTime: range.end,
            period: 60 * metrics.METRIC_WINDOW,
            statistics: ['Average'],
        });

        it('returns average duration if datapoints exist', async () => {
            const averageDuration = 300;
            const output: GetMetricStatisticsOutput = { Datapoints: [{ Average: averageDuration }] };

            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));
            await expect(client.calculateLambdaDuration(resource, range.start, range.end)).resolves.toEqual(averageDuration);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('returns 0 if no average datapoints exist', async () => {
            const output: GetMetricStatisticsOutput = { Datapoints: [] };

            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));
            await expect(client.calculateLambdaDuration(resource, range.start, range.end)).resolves.toEqual(0);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('returns 0 if datapoints has no Average information', async () => {
            const output: GetMetricStatisticsOutput = { Datapoints: [{ Timestamp: new Date() }] };

            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));
            await expect(client.calculateLambdaDuration(resource, range.start, range.end)).resolves.toEqual(0);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });
    });

    describe('#getMemory', () => {
        it('invokes aws.getFunctionConfiguration', async () => {
            const memorySize: MemorySize = 1024;
            const input: GetFunctionConfigurationRequest = { FunctionName: resource.id };
            const output: FunctionConfiguration = { MemorySize: memorySize };

            this.getFunctionConfigurationMock.mockImplementation((data: any, callback: Function) => callback(null, output));
            await expect(client.getMemory(resource)).resolves.toEqual(memorySize);
            expect(awsLambda.getFunctionConfiguration).toHaveBeenCalledTimes(1);
            expect(awsLambda.getFunctionConfiguration).toHaveBeenCalledWith(input, expect.any(Function));
        });
    });

    describe('#throttle', () => {
        it('invokes aws.putFunctionConcurrence', async () => {
            const input: PutFunctionConcurrencyRequest = {
                FunctionName: resource.id,
                ReservedConcurrentExecutions: 1,
            };

            this.putFunctionConcurrencyMock.mockImplementation((data: any, callback: Function) => callback(null, 'OK'));
            await expect(client.throttle(resource.id, 1)).resolves.toBeUndefined();
            expect(awsLambda.putFunctionConcurrency).toHaveBeenCalledTimes(1);
            expect(awsLambda.putFunctionConcurrency).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('throttles by default to one concurrent execution', async () => {
            const input: PutFunctionConcurrencyRequest = {
                FunctionName: resource.id,
                ReservedConcurrentExecutions: 1,
            };

            this.putFunctionConcurrencyMock.mockImplementation((data: any, callback: Function) => callback(null, 'OK'));
            await expect(client.throttle(resource.id)).resolves.toBeUndefined();
            expect(awsLambda.putFunctionConcurrency).toHaveBeenCalledTimes(1);
            expect(awsLambda.putFunctionConcurrency).toHaveBeenCalledWith(input, expect.any(Function));
        });
    });
});
