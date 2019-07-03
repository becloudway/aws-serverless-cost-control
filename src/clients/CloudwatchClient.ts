import * as AWS from 'aws-sdk';
import {
    Datapoint,
    Dimension,
    GetMetricStatisticsInput,
    GetMetricStatisticsOutput, Namespace, Period,
    PutMetricDataInput, Statistics,
} from 'aws-sdk/clients/cloudwatch';
import {
    AWSClient, wrapCallback, wrapCallbackVoid,
} from './AWSClient';
import { metrics } from '../config';
import { DateRange } from '../types';

export interface MetricsDimension {
    Name: string;
    Value: string;
}

export interface GetMetricStatisticsParams {
    nameSpace: Namespace;
    metricName: string;
    dimensions?: MetricsDimension[];
    startTime: Date;
    endTime: Date;
    period: Period;
    statistics: Statistics;
}

export interface PutCostMetricStatisticsParams {
    timestamp: Date;
    value: number;
    resourceId: string;
    metricName: string;
    service: string;
}

export interface GetCostMetricStatisticsParams {
    range: DateRange;
    resourceId: string;
    metricName: string;
    service: string;
}

export class CloudwatchClient extends AWSClient<AWS.CloudWatch> {
    public getMetricStatistics({
        nameSpace,
        metricName,
        dimensions,
        startTime,
        endTime,
        period,
        statistics,
    }: GetMetricStatisticsParams): Promise<GetMetricStatisticsOutput> {
        const params: GetMetricStatisticsInput = {
            Namespace: nameSpace,
            MetricName: metricName,
            Dimensions: dimensions,
            StartTime: startTime,
            EndTime: endTime,
            Period: period,
            Statistics: statistics,
        };
        return wrapCallback<GetMetricStatisticsInput, GetMetricStatisticsOutput>(this.client.getMetricStatistics, params);
    }

    public getCostMetricStatistics(params: GetCostMetricStatisticsParams): Promise<GetMetricStatisticsOutput> {
        return this.getMetricStatistics({
            nameSpace: metrics.NAME_SPACE,
            metricName: params.metricName,
            dimensions: CloudwatchClient.buildCostDimensions(params.service, params.resourceId),
            startTime: params.range.start,
            endTime: params.range.end,
            period: 60 * metrics.METRIC_WINDOW,
            statistics: ['Average'],
        });
    }

    public static buildCostDimensions(service: string, resourceId: string): Dimension[] {
        return [
            {
                Name: metrics.DIMENSIONS.RESOURCE_ID,
                Value: resourceId,
            },
            {
                Name: metrics.DIMENSIONS.SERVICE_NAME,
                Value: service,
            },
        ];
    }

    public putCostMetricData({
        timestamp, value, resourceId, metricName, service,
    }: PutCostMetricStatisticsParams): Promise<void> {
        const params: PutMetricDataInput = {
            Namespace: metrics.NAME_SPACE,
            MetricData: [{
                Timestamp: timestamp,
                Value: value,
                MetricName: metricName,
                Dimensions: CloudwatchClient.buildCostDimensions(service, resourceId),
                Unit: 'Count',
            }],
        };

        return wrapCallbackVoid<PutMetricDataInput>(this.client.putMetricData, params);
    }

    public putAnomalyMetricData(timestamp: Date, value: number): Promise<void> {
        const params: PutMetricDataInput = {
            Namespace: metrics.NAME_SPACE,
            MetricData: [{
                Timestamp: timestamp,
                Value: value,
                MetricName: metrics.NAME_ANOMALY_SCORE,
                Unit: 'Count',
            }],
        };

        return wrapCallbackVoid<PutMetricDataInput>(this.client.putMetricData, params);
    }

    public static calculateDatapointsAverage(datapoints?: Datapoint[]): number {
        if (!datapoints || datapoints.length === 0) return 0;
        return datapoints.reduce((acc, curr) => acc + (curr.Average || 0), 0) / datapoints.length;
    }

    public static calculateDatapointsSum(datapoints?: Datapoint[]): number {
        if (!datapoints || datapoints.length === 0) return 0;
        return datapoints.reduce((acc, curr) => acc + (curr.Sum || 0), 0);
    }
}
