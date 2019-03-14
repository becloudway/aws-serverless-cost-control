import * as AWS from 'aws-sdk';
import {
    Dimension,
    GetMetricStatisticsInput,
    GetMetricStatisticsOutput,
    PutMetricDataInput,
} from 'aws-sdk/clients/cloudwatch';
import { AWSClient } from './AWSClient';
import { metrics } from '../config';
import { log } from '../logger';
import { DateRange } from '../types';

export interface MetricsDimension {
    Name: string;
    Value: string;
}

export interface GetMetricStatisticsParams {
    nameSpace: string;
    metricName: string;
    dimensions?: MetricsDimension[];
    startTime: Date;
    endTime: Date;
    period: number;
    statistics: string[];
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
        return new Promise((resolve, reject) => {
            this.client.getMetricStatistics(params, (err: Error, data: GetMetricStatisticsOutput) => {
                if (err) reject(err);
                resolve(data);
            });
        });
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

    private static buildCostDimensions(service: string, resourceId: string): Dimension[] {
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

        return this.putMetricData(params);
    }

    public putAnomalyMetricData(timestamp: Date, value: number) {
        const params: PutMetricDataInput = {
            Namespace: metrics.NAME_SPACE,
            MetricData: [{
                Timestamp: timestamp,
                Value: value,
                MetricName: metrics.NAME_ANOMALY_SCORE,
                Unit: 'Count',
            }],
        };

        return this.putMetricData(params);

    }

    private putMetricData(params: PutMetricDataInput): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.client.putMetricData(params, (err: Error) => {
                if (err) reject(err);
                resolve();
            });
        });

    }
}
