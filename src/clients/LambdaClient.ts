import * as AWS from 'aws-sdk';
import { FunctionConfiguration } from 'aws-sdk/clients/lambda';
import { AWSClient } from './AWSClient';
import { metrics } from '../config';
import { Resource } from '../resource';

export class LambdaClient extends AWSClient<AWS.Lambda> {
    public throttle(resourceId: string, allowedConcurrentExecutions: number = 1): Promise<void> {
        return new Promise((resolve, reject) => this.client.putFunctionConcurrency({
            FunctionName: resourceId,
            ReservedConcurrentExecutions: allowedConcurrentExecutions,
        }, (err: Error) => {
            if (err) reject(err);
            resolve();
        }));
    }

    public async calculateLambdaInvocations(resource: Resource, start: Date, end: Date): Promise<number> {
        const invocations = await this.clwClient.getMetricStatistics({
            nameSpace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensions: [{ Name: 'FunctionName', Value: resource.id }],
            startTime: start,
            endTime: end,
            period: 60 * metrics.METRIC_WINDOW,
            statistics: ['Sum'],
        });

        if (!invocations.Datapoints || invocations.Datapoints.length === 0) return 0;
        return invocations.Datapoints.reduce((acc, curr) => acc + (curr.Sum || 0), 0);
    }

    public async calculateLambdaDuration(resource: Resource, start: Date, end: Date): Promise<number> {
        const duration = await this.clwClient.getMetricStatistics({
            nameSpace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensions: [{ Name: 'FunctionName', Value: resource.id }],
            startTime: start,
            endTime: end,
            period: 60 * metrics.METRIC_WINDOW,
            statistics: ['Average'],
        });

        if (!duration.Datapoints || duration.Datapoints.length === 0) return 0;
        return duration.Datapoints.reduce((acc, curr) => acc + (curr.Average || 0), 0) / duration.Datapoints.length;
    }

    public getMemory(resource: Resource): Promise<number> {
        return new Promise((resolve, reject) => this.client.getFunctionConfiguration({
            FunctionName: resource.id,
        }, (err: Error, data: FunctionConfiguration) => {
            if (err) reject(err);
            resolve(data.MemorySize);
        }));
    }
}
