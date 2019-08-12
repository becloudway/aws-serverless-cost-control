import * as AWS from 'aws-sdk';
import { DescribeTableInput, DescribeTableOutput, UpdateTableInput } from 'aws-sdk/clients/dynamodb';
import { Datapoint } from 'aws-sdk/clients/cloudwatch';
import { AWSClient, wrapCallback, wrapCallbackVoid } from './AWSClient';
import { metrics } from '../config';
import { CloudwatchClient, GetMetricStatisticsParams } from './CloudwatchClient';
import { Resource } from '../resource';

type MetricName = 'ConsumedWriteCapacityUnits' | 'ConsumedReadCapacityUnits';

export class DynamoDBClient extends AWSClient<AWS.DynamoDB> {
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

    public async throttle(resourceId: string, { readCapacityUnits = 1, writeCapacityUnits = 1 } = {}): Promise<void> {
        return wrapCallbackVoid<UpdateTableInput>(this.client.updateTable.bind(this.client), {
            TableName: resourceId,
            BillingMode: 'PROVISIIONED',
            ProvisionedThroughput: {
                ReadCapacityUnits: readCapacityUnits,
                WriteCapacityUnits: writeCapacityUnits,
            },
        });
    }

    private static buildMetricStatisticsParams(metricName: MetricName, resource: Resource, start: Date, end: Date): GetMetricStatisticsParams {
        return {
            nameSpace: 'AWS/DynamoDB',
            metricName,
            dimensions: [{ Name: 'TableName', Value: resource.id }],
            startTime: start,
            endTime: end,
            period: 60 * metrics.METRIC_WINDOW,
            statistics: ['Average'],
        };
    }
}
