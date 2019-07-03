import * as AWS from 'aws-sdk';
import { ModifyDBClusterMessage } from 'aws-sdk/clients/rds';
import { MetricName } from 'aws-sdk/clients/cloudwatch';
import { AWSClient, wrapCallbackVoid } from './AWSClient';
import { CloudwatchClient, GetMetricStatisticsParams } from './CloudwatchClient';

export interface RDSThrottleOptions {
    minCapacity?: number;
    maxCapacity?: number;
    autoPause?: boolean;
}

export class RDSClient extends AWSClient<AWS.RDS> {
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

    public async throttle(clusterId: string, options: RDSThrottleOptions = {}): Promise<void> {
        return wrapCallbackVoid<ModifyDBClusterMessage>(this.client.modifyDBCluster, {
            DBClusterIdentifier: clusterId,
            ApplyImmediately: true,
            ScalingConfiguration: {
                AutoPause: !(options.autoPause === false),
                MaxCapacity: options.maxCapacity || 2,
                MinCapacity: options.minCapacity || 2,
            },
        });
    }

    private static buildMetricStatisticsParams(metricName: MetricName, resourceId: string, start: Date, end: Date): GetMetricStatisticsParams {
        return {
            nameSpace: 'AWS/RDS',
            metricName,
            dimensions: [{ Name: 'DBClusterIdentifier', Value: resourceId }],
            startTime: start,
            endTime: end,
            period: 60,
            statistics: ['Average'],
        };
    }
}
