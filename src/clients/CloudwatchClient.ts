import { GetMetricStatisticsInput, GetMetricStatisticsOutput, PutMetricDataInput } from 'aws-sdk/clients/cloudwatch';
import { AWSClient } from './AWSClient';
import { metrics } from '../config';

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

export interface PutMetricStatisticsParams {
    timestamp: Date;
    cost: number;
    service: string;
    resourceId: string;
    metricName: string;
}

export class CloudwatchClient extends AWSClient {
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

    public putMetricData({
        timestamp, cost, service, resourceId, metricName,
    }: PutMetricStatisticsParams): Promise<void> {
        const params: PutMetricDataInput = {
            Namespace: metrics.NAME_SPACE,
            MetricData: [{
                Timestamp: timestamp,
                Value: cost,
                Unit: 'Count',
                MetricName: metricName,
                Dimensions: [
                    {
                        Name: metrics.DIMENSIONS.SERVICE_NAME,
                        Value: service,
                    },
                    {
                        Name: metrics.DIMENSIONS.RESOURCE_ID,
                        Value: resourceId,
                    },
                    {
                        Name: metrics.DIMENSIONS.CURRENCY,
                        Value: metrics.DIMENSIONS.CURRENCY_USD,
                    },
                ],
            }],
        };

        return new Promise<void>((resolve, reject) => {
            this.client.putMetricData(params, (err: Error) => {
                if (err) reject(err);
                resolve();
            });
        });
    }
}
