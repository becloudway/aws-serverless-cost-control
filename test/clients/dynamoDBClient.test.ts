/* eslint-disable no-undef */
import * as AWS from 'aws-sdk';
import { DescribeTableInput, DescribeTableOutput, UpdateTableInput } from 'aws-sdk/clients/dynamodb';
import * as faker from 'faker';
import { GetMetricStatisticsInput, GetMetricStatisticsOutput } from 'aws-sdk/clients/cloudwatch';
import { CloudwatchClient, dynamodbClient, DynamoDBClient } from '../../src/clients';
import { metrics, regions } from '../../src/config';
import { buildMetricsStatisticsInput, buildRange, buildResource } from '../_helpers/builders';
import { Resource } from '../../src/resource';
import { DateRange } from '../../src/types';

describe('#DynamoDBClient', () => {
    const awsCloudWatch = new AWS.CloudWatch({ apiVersion: '2010-08-01', region: regions.CURRENT_REGION });
    const awsDynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10', region: regions.CURRENT_REGION });
    const clwClient: CloudwatchClient = new CloudwatchClient(awsCloudWatch);
    const client: DynamoDBClient = new DynamoDBClient(awsDynamodb, clwClient);
    const resource: Resource = buildResource();
    const range: DateRange = buildRange();

    beforeAll(() => {
        this.getMetricStatisticsMock = jest.fn();
        this.putMetricDataMock = jest.fn();
        this.describeTableMock = jest.fn();
        this.updateTableMock = jest.fn();

        awsCloudWatch.getMetricStatistics = this.getMetricStatisticsMock;
        awsCloudWatch.putMetricData = this.putMetricDataMock;
        awsDynamodb.describeTable = this.describeTableMock;
        awsDynamodb.updateTable = this.updateTableMock;
    });

    afterEach(() => jest.resetAllMocks());
    afterAll(() => jest.restoreAllMocks());

    describe('#describeTable', () => {
        it('invokes aws.describeTable', async () => {
            const tableName = faker.random.word();
            const input: DescribeTableInput = { TableName: tableName };
            const output: DescribeTableOutput = { Table: { TableName: tableName } };
            this.describeTableMock.mockImplementation((data: any, callback: Function) => callback(null, output));

            await expect(client.describeTable(tableName)).resolves.toEqual(output);
            expect(this.describeTableMock).toHaveBeenCalledTimes(1);
            expect(this.describeTableMock).toHaveBeenCalledWith(input, expect.any(Function));
        });
    });
    describe('#getReadCapacityUnits', () => {
        const input: GetMetricStatisticsInput = buildMetricsStatisticsInput({
            nameSpace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            dimensions: [{ Name: 'TableName', Value: resource.id }],
            startTime: range.start,
            endTime: range.end,
            period: 60 * metrics.METRIC_WINDOW,
            statistics: ['Average'],
        });

        it('returns dynamodb read metric statistics', async () => {
            const readCapacity = faker.random.number();
            const output: GetMetricStatisticsOutput = { Datapoints: [{ Average: readCapacity }] };
            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));

            await expect(client.getReadCapacityUnits(resource, range.start, range.end)).resolves.toEqual(readCapacity);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('returns dynamodb read metric statistics = 0 when no datapoints are available', async () => {
            const output: GetMetricStatisticsOutput = { Datapoints: [] };
            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));

            await expect(client.getReadCapacityUnits(resource, range.start, range.end)).resolves.toEqual(0);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });
    });
    describe('#getWriteCapacityUnits', () => {
        const input: GetMetricStatisticsInput = buildMetricsStatisticsInput({
            nameSpace: 'AWS/DynamoDB',
            metricName: 'ConsumedWriteCapacityUnits',
            dimensions: [{ Name: 'TableName', Value: resource.id }],
            startTime: range.start,
            endTime: range.end,
            period: 60 * metrics.METRIC_WINDOW,
            statistics: ['Average'],
        });

        it('returns dynamodb write metric statistics', async () => {
            const writeCapacity = faker.random.number();
            const output: GetMetricStatisticsOutput = { Datapoints: [{ Average: writeCapacity }] };
            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));

            await expect(client.getWriteCapacityUnits(resource, range.start, range.end)).resolves.toEqual(writeCapacity);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('returns dynamodb write metric statistics = 0 when no datapoints are available', async () => {
            const output: GetMetricStatisticsOutput = { Datapoints: [{ Timestamp: new Date() }] };
            this.getMetricStatisticsMock.mockImplementation((data: any, callback: Function) => callback(null, output));

            await expect(client.getWriteCapacityUnits(resource, range.start, range.end)).resolves.toEqual(0);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledTimes(1);
            expect(awsCloudWatch.getMetricStatistics).toHaveBeenCalledWith(input, expect.any(Function));
        });
    });

    describe('#throttle', () => {
        it('invokes aws.updateTable using default throttle values', async () => {
            const input: UpdateTableInput = {
                TableName: resource.id,
                BillingMode: 'PROVISIIONED',
                ProvisionedThroughput: {
                    ReadCapacityUnits: 1,
                    WriteCapacityUnits: 1,
                },
            };
            this.updateTableMock.mockImplementation((data: any, callback: Function) => callback(null, 'OK'));

            await expect(client.throttle(resource.id)).resolves.toBeUndefined();
            expect(awsDynamodb.updateTable).toHaveBeenCalledTimes(1);
            expect(awsDynamodb.updateTable).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('invokes aws.updateTable using custom throttle values', async () => {
            const input: UpdateTableInput = {
                TableName: resource.id,
                BillingMode: 'PROVISIIONED',
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5,
                },
            };
            this.updateTableMock.mockImplementation((data: any, callback: Function) => callback(null, 'OK'));

            await expect(client.throttle(resource.id, { readCapacityUnits: 5, writeCapacityUnits: 5 })).resolves.toBeUndefined();
            expect(awsDynamodb.updateTable).toHaveBeenCalledTimes(1);
            expect(awsDynamodb.updateTable).toHaveBeenCalledWith(input, expect.any(Function));
        });
    });
});
