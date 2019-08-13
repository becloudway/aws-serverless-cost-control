import * as AWS from 'aws-sdk';
import { DescribeTableInput, DescribeTableOutput, UpdateTableInput } from 'aws-sdk/clients/dynamodb';
import { metrics } from '../config';
import { Resource } from '../resource';
import { AWSClient, wrapCallback, wrapCallbackVoid } from './AWSClient';
import { CloudwatchClient, GetMetricStatisticsParams } from './CloudwatchClient';

type MetricName = 'ConsumedWriteCapacityUnits' | 'ConsumedReadCapacityUnits';

interface ProvisionedThroughPut {
    readCapacityUnits?: number;
    writeCapacityUnits?: number;
}

export class DynamoDBClient extends AWSClient<AWS.DynamoDB> {
    private static DEFAULT_CAPACITY_UNIT: number = 1;

    private static buildMetricStatisticsParams(metricName: MetricName, resource: Resource, start: Date, end: Date): GetMetricStatisticsParams {
        return {
            dimensions: [{ Name: 'TableName', Value: resource.id }],
            endTime: end,
            metricName,
            nameSpace: 'AWS/DynamoDB',
            period: 60 * metrics.METRIC_WINDOW,
            startTime: start,
            statistics: ['Average'],
        };
    }

    public async describeTable(tableName: string): Promise<DescribeTableOutput> {
        return wrapCallback<DescribeTableInput, DescribeTableOutput>(this.client.describeTable.bind(this.client), { TableName: tableName });
    }

    public async getWriteCapacityUnits(resource: Resource, start: Date, end: Date): Promise<number> {
        const metricStatisticsParams: GetMetricStatisticsParams = DynamoDBClient.buildMetricStatisticsParams(
            'ConsumedWriteCapacityUnits',
            resource,
            start,
            end,
        );

        const statistics = await this.clwClient.getMetricStatistics(metricStatisticsParams);
        return CloudwatchClient.calculateDatapointsAverage(statistics.Datapoints);
    }

    public async getReadCapacityUnits(resource: Resource, start: Date, end: Date): Promise<number> {
        const metricStatisticsParams: GetMetricStatisticsParams = DynamoDBClient.buildMetricStatisticsParams(
            'ConsumedReadCapacityUnits',
            resource,
            start,
            end,
        );

        const statistics = await this.clwClient.getMetricStatistics(metricStatisticsParams);
        return CloudwatchClient.calculateDatapointsAverage(statistics.Datapoints);
    }

    public async throttle(
        resourceId: string,
        provisionedThroughPut: ProvisionedThroughPut = {
            readCapacityUnits: DynamoDBClient.DEFAULT_CAPACITY_UNIT,
            writeCapacityUnits: DynamoDBClient.DEFAULT_CAPACITY_UNIT,
        },
    ): Promise<void> {
        return wrapCallbackVoid<UpdateTableInput>(this.client.updateTable.bind(this.client), {
            BillingMode: 'PROVISIIONED',
            ProvisionedThroughput: {
                ReadCapacityUnits: provisionedThroughPut.readCapacityUnits,
                WriteCapacityUnits: provisionedThroughPut.writeCapacityUnits,
            },
            TableName: resourceId,
        });
    }
}
