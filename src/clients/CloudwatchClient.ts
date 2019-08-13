import * as AWS from 'aws-sdk';
import {
    Datapoint,
    Dimension,
    GetMetricStatisticsInput,
    GetMetricStatisticsOutput, Namespace, Period,
    PutMetricDataInput, Statistics,
} from 'aws-sdk/clients/cloudwatch';
import { metrics } from '../config';
import { DateRange } from '../types';
import {
    AWSClient, wrapCallback, wrapCallbackVoid,
} from './AWSClient';

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

    public static calculateDatapointsAverage(datapoints?: Datapoint[]): number {
        if (!datapoints || datapoints.length === 0) { return 0; }
        return datapoints.reduce((acc, curr) => acc + (curr.Average || 0), 0) / datapoints.length;
    }

    public static calculateDatapointsSum(datapoints?: Datapoint[]): number {
        if (!datapoints || datapoints.length === 0) { return 0; }
        return datapoints.reduce((acc, curr) => acc + (curr.Sum || 0), 0);
    }

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
            Dimensions: dimensions,
            EndTime: endTime,
            MetricName: metricName,
            Namespace: nameSpace,
            Period: period,
            StartTime: startTime,
            Statistics: statistics,
        };
        return wrapCallback<GetMetricStatisticsInput, GetMetricStatisticsOutput>(this.client.getMetricStatistics.bind(this.client), params);
    }

    public getCostMetricStatistics(params: GetCostMetricStatisticsParams): Promise<GetMetricStatisticsOutput> {
        return this.getMetricStatistics({
            dimensions: CloudwatchClient.buildCostDimensions(params.service, params.resourceId),
            endTime: params.range.end,
            metricName: params.metricName,
            nameSpace: metrics.NAME_SPACE,
            period: 60 * metrics.METRIC_WINDOW,
            startTime: params.range.start,
            statistics: ['Average'],
        });
    }

    public putCostMetricData({
        timestamp, value, resourceId, metricName, service,
    }: PutCostMetricStatisticsParams): Promise<void> {
        const params: PutMetricDataInput = {
            MetricData: [{
                Dimensions: CloudwatchClient.buildCostDimensions(service, resourceId),
                MetricName: metricName,
                Timestamp: timestamp,
                Unit: 'Count',
                Value: value,
            }],
            Namespace: metrics.NAME_SPACE,
        };

        return wrapCallbackVoid<PutMetricDataInput>(this.client.putMetricData.bind(this.client), params);
    }

    public putAnomalyMetricData(timestamp: Date, value: number): Promise<void> {
        const params: PutMetricDataInput = {
            MetricData: [{
                MetricName: metrics.NAME_ANOMALY_SCORE,
                Timestamp: timestamp,
                Unit: 'Count',
                Value: value,
            }],
            Namespace: metrics.NAME_SPACE,
        };

        return wrapCallbackVoid<PutMetricDataInput>(this.client.putMetricData.bind(this.client), params);
    }
}
