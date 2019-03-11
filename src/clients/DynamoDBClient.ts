import * as AWS from 'aws-sdk';
import { DescribeTableOutput, UpdateTableOutput } from 'aws-sdk/clients/dynamodb';
import { AWSClient } from './AWSClient';
import { metrics } from '../config';
import { GetMetricStatisticsParams } from './CloudwatchClient';
import { Resource } from '../resource';

export class DynamoDBClient extends AWSClient<AWS.DynamoDB> {
    public async describeTable(tableName: string): Promise<DescribeTableOutput> {
        return new Promise((resolve, reject) => this.client.describeTable({
            TableName: tableName,
        }, (err: Error, data: DescribeTableOutput) => {
            if (err) reject(err);
            resolve(data);
        }));
    }

    public async getWriteCapacityUnits(resource: Resource, start: Date, end: Date): Promise<number> {
        const metricStatisticsParams: GetMetricStatisticsParams = {
            nameSpace: 'AWS/DynamoDB',
            metricName: 'ConsumedWriteCapacityUnits',
            startTime: start,
            endTime: end,
            period: 60 * metrics.METRIC_WINDOW,
            statistics: ['Average'],
        };
        const statistics = await this.clwClient.getMetricStatistics(metricStatisticsParams);

        if (!statistics.Datapoints || statistics.Datapoints.length === 0) return 0;
        return statistics.Datapoints.reduce((acc, curr) => acc + (curr.Average || 0), 0) / statistics.Datapoints.length;
    }

    public async getReadCapacityUnits(resource: Resource, start: Date, end: Date): Promise<number> {
        const statistics = await this.clwClient.getMetricStatistics({
            nameSpace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            dimensions: [{ Name: 'TableName', Value: resource.id }],
            startTime: start,
            endTime: end,
            period: 60 * metrics.METRIC_WINDOW,
            statistics: ['Average'],
        });

        if (!statistics.Datapoints || statistics.Datapoints.length === 0) return 0;
        return statistics.Datapoints.reduce((acc, curr) => acc + (curr.Average || 0), 0) / statistics.Datapoints.length;
    }

    public async throttle(resourceId: string, { readCapacityUnits = 1, writeCapacityUnits = 1 } = {}): Promise<void> {
        return new Promise<void>((resolve, reject) => this.client.updateTable({
            TableName: resourceId,
            BillingMode: 'PROVISIIONED',
            ProvisionedThroughput: {
                ReadCapacityUnits: readCapacityUnits,
                WriteCapacityUnits: writeCapacityUnits,
            },
        }, (err: Error) => {
            if (err) reject(err);
            return resolve();
        }));
    }
}
