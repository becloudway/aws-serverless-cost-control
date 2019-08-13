import * as AWS from 'aws-sdk';
import { MetricName } from 'aws-sdk/clients/cloudwatch';
import { ModifyDBClusterMessage } from 'aws-sdk/clients/rds';
import { AWSClient, wrapCallbackVoid } from './AWSClient';
import { CloudwatchClient, GetMetricStatisticsParams } from './CloudwatchClient';

export interface RDSThrottleOptions {
    minCapacity: number;
    maxCapacity: number;
    autoPause: boolean;
}

export class RDSClient extends AWSClient<AWS.RDS> {
    public static DEFAULT_MIN_SCALING_CAPACITY: number = 2;

    private static buildMetricStatisticsParams(metricName: MetricName, resourceId: string, start: Date, end: Date): GetMetricStatisticsParams {
        return {
            dimensions: [{ Name: 'DBClusterIdentifier', Value: resourceId }],
            endTime: end,
            metricName,
            nameSpace: 'AWS/RDS',
            period: 60,
            startTime: start,
            statistics: ['Average'],
        };
    }

    public async getACUs(clusterId: string, start: Date, end: Date): Promise<number> {
        const getMetricStatisticsParams: GetMetricStatisticsParams = RDSClient.buildMetricStatisticsParams(
            'ServerlessDatabaseCapacity',
            clusterId,
            start,
            end,
        );
        const acuMetric = await this.clwClient.getMetricStatistics(getMetricStatisticsParams);
        return CloudwatchClient.calculateDatapointsAverage(acuMetric.Datapoints);
    }

    public async getStoredGiBs(clusterId: string, start: Date, end: Date): Promise<number> {
        const getMetricStatisticsParams: GetMetricStatisticsParams = RDSClient.buildMetricStatisticsParams(
            'FreeLocalStorage',
            clusterId,
            start,
            end,
        );
        const storedGiBsMetric = await this.clwClient.getMetricStatistics(getMetricStatisticsParams);
        return CloudwatchClient.calculateDatapointsAverage(storedGiBsMetric.Datapoints);
    }

    public async getIoRequests(clusterId: string, start: Date, end: Date): Promise<number> {
        const getMetricStatisticsParams: GetMetricStatisticsParams = RDSClient.buildMetricStatisticsParams(
            'NetworkThroughput',
            clusterId,
            start,
            end,
        );
        const ioRequestsMetric = await this.clwClient.getMetricStatistics(getMetricStatisticsParams);
        return CloudwatchClient.calculateDatapointsAverage(ioRequestsMetric.Datapoints);
    }

    public async throttle(clusterId: string, rdsThrottleOptions: RDSThrottleOptions = {
        autoPause: true,
        maxCapacity: RDSClient.DEFAULT_MIN_SCALING_CAPACITY,
        minCapacity: RDSClient.DEFAULT_MIN_SCALING_CAPACITY,
    }): Promise<void> {
        return wrapCallbackVoid<ModifyDBClusterMessage>(this.client.modifyDBCluster.bind(this.client), {
            ApplyImmediately: true,
            DBClusterIdentifier: clusterId,
            ScalingConfiguration: {
                AutoPause: rdsThrottleOptions.autoPause,
                MaxCapacity: rdsThrottleOptions.maxCapacity,
                MinCapacity: rdsThrottleOptions.minCapacity,
            },
        });
    }
}
