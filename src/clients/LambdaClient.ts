import * as AWS from 'aws-sdk';
import {
    FunctionConfiguration,
    GetFunctionConfigurationRequest,
    MemorySize,
    PutFunctionConcurrencyRequest,
} from 'aws-sdk/clients/lambda';
import { MetricName } from 'aws-sdk/clients/cloudwatch';
import { AWSClient, wrapCallback, wrapCallbackVoid } from './AWSClient';
import { metrics } from '../config';
import { Resource } from '../resource/resource';
import { GetMetricStatisticsParams, CloudwatchClient } from './CloudwatchClient';

export class LambdaClient extends AWSClient<AWS.Lambda> {
    public throttle(resourceId: string, allowedConcurrentExecutions: number = 1): Promise<void> {
        return wrapCallbackVoid<PutFunctionConcurrencyRequest>(this.client.putFunctionConcurrency.bind(this.client), {
            FunctionName: resourceId,
            ReservedConcurrentExecutions: allowedConcurrentExecutions,
        });
    }

    public async calculateLambdaInvocations(resource: Resource, start: Date, end: Date): Promise<number> {
        const metricStatisticsParams: GetMetricStatisticsParams = LambdaClient.buildMetricStatisticsParams(
            'Invocations',
            ['Sum'],
            resource,
            start,
            end,
        );

        const invocations = await this.clwClient.getMetricStatistics(metricStatisticsParams);
        return CloudwatchClient.calculateDatapointsSum(invocations.Datapoints);
    }

    public async calculateLambdaDuration(resource: Resource, start: Date, end: Date): Promise<number> {
        const metricStatisticsParams: GetMetricStatisticsParams = LambdaClient.buildMetricStatisticsParams(
            'Duration',
            ['Average'],
            resource,
            start,
            end,
        );

        const duration = await this.clwClient.getMetricStatistics(metricStatisticsParams);
        return CloudwatchClient.calculateDatapointsAverage(duration.Datapoints);
    }

    public getMemory(resource: Resource): Promise<number> {
        return wrapCallback<GetFunctionConfigurationRequest, MemorySize>(this.client.getFunctionConfiguration.bind(this.client), {
            FunctionName: resource.id,
        }, (data: FunctionConfiguration) => data && data.MemorySize);
    }

    private static buildMetricStatisticsParams(metricName: MetricName, statistics: string[], resource: Resource, start: Date, end: Date): GetMetricStatisticsParams {
        return {
            nameSpace: 'AWS/Lambda',
            metricName,
            dimensions: [{ Name: 'FunctionName', Value: resource.id }],
            startTime: start,
            endTime: end,
            period: 60 * metrics.METRIC_WINDOW,
            statistics,
        };
    }
}
