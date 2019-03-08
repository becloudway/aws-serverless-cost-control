import { AWSClient } from './AWSClient';

export interface RDSThrottleOptions {
    minCapacity: number;
    maxCapacity: number;
    autoPause: boolean;
}

export class RDSClient extends AWSClient {
    public async getACUs(clusterId: string, start: Date, end: Date): Promise<number> {
        const acuMetric = await this.clwClient.getMetricStatistics({
            nameSpace: 'AWS/RDS',
            metricName: 'ServerlessDatabaseCapacity',
            dimensions: [{ Name: 'DBClusterIdentifier', Value: clusterId }],
            startTime: start,
            endTime: end,
            period: 60,
            statistics: ['Average'],
        });

        if (!acuMetric.Datapoints || acuMetric.Datapoints.length === 0) return 0;
        return acuMetric.Datapoints.reduce((acc, curr) => acc + (curr.Average || 0), 0) / acuMetric.Datapoints.length;
    }

    public async getStoredGiBs(clusterId: string, start: Date, end: Date): Promise<number> {
        const storedGiBsMetric = await this.clwClient.getMetricStatistics({
            nameSpace: 'AWS/RDS',
            metricName: 'FreeLocalStorage',
            dimensions: [{ Name: 'DBClusterIdentifier', Value: clusterId }],
            startTime: start,
            endTime: end,
            period: 60,
            statistics: ['Average'],
        });

        if (!storedGiBsMetric.Datapoints || storedGiBsMetric.Datapoints.length === 0) return 0;
        return storedGiBsMetric.Datapoints.reduce((acc, curr) => acc + (curr.Average || 0), 0) / storedGiBsMetric.Datapoints.length;
    }

    public async getIoRequests(clusterId: string, start: Date, end: Date): Promise<number> {
        const ioRequestsMetric = await this.clwClient.getMetricStatistics({
            nameSpace: 'AWS/RDS',
            metricName: 'NetworkThroughput',
            dimensions: [{ Name: 'DBClusterIdentifier', Value: clusterId }],
            startTime: start,
            endTime: end,
            period: 60,
            statistics: ['Average'],
        });

        if (!ioRequestsMetric.Datapoints || ioRequestsMetric.Datapoints.length === 0) return 0;
        return ioRequestsMetric.Datapoints.reduce((acc, curr) => acc + (curr.Average || 0), 0) / ioRequestsMetric.Datapoints.length;
    }

    public async throttle(clusterId: string, { minCapacity = 2, maxCapacity = 2, autoPause = true }: RDSThrottleOptions): Promise<void> {
        return new Promise<void>((resolve, reject) => this.client.modifyDBCluster({
            DBClusterIdentifier: clusterId,
            ApplyImmediately: true,
            ScalingConfiguration: {
                AutoPause: autoPause,
                MaxCapacity: maxCapacity,
                MinCapacity: minCapacity,
            },
        }, (err: Error) => {
            if (err) reject(err);
            resolve();
        }));
    }
}
