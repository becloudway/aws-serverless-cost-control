"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AWSClient_1 = require("./AWSClient");
class Rds extends AWSClient_1.AWSClient {
    async getACUs({ start, end, clusterId }) {
        const acuMetric = await this.clwClient.getMetricStatistics({
            nameSpace: 'AWS/RDS',
            metricName: 'ServerlessDatabaseCapacity',
            dimensions: [{ Name: 'DBClusterIdentifier', Value: clusterId }],
            startTime: start,
            endTime: end,
            period: 60,
            statistics: ['Average'],
        });
        if (!acuMetric.Datapoints || acuMetric.Datapoints.length === 0)
            return 0;
        return acuMetric.Datapoints.reduce((acc, curr) => acc + (curr.Average || 0), 0) / acuMetric.Datapoints.length;
    }
    async getStoredGiBs({ start, end, clusterId }) {
        const storedGiBsMetric = await this.clwClient.getMetricStatistics({
            nameSpace: 'AWS/RDS',
            metricName: 'FreeLocalStorage',
            dimensions: [{ Name: 'DBClusterIdentifier', Value: clusterId }],
            startTime: start,
            endTime: end,
            period: 60,
            statistics: ['Average'],
        });
        if (!storedGiBsMetric.Datapoints || storedGiBsMetric.Datapoints.length === 0)
            return 0;
        return storedGiBsMetric.Datapoints.reduce((acc, curr) => acc + (curr.Average || 0), 0) / storedGiBsMetric.Datapoints.length;
    }
    async getIoRequests({ start, end, clusterId }) {
        const ioRequestsMetric = await this.clwClient.getMetricStatistics({
            nameSpace: 'AWS/RDS',
            metricName: 'NetworkThroughput',
            dimensions: [{ Name: 'DBClusterIdentifier', Value: clusterId }],
            startTime: start,
            endTime: end,
            period: 60,
            statistics: ['Average'],
        });
        if (!ioRequestsMetric.Datapoints || ioRequestsMetric.Datapoints.length === 0)
            return 0;
        return ioRequestsMetric.Datapoints.reduce((acc, curr) => acc + (curr.Average || 0), 0) / ioRequestsMetric.Datapoints.length;
    }
    async throttle(resourceId, { minCapacity = 2, maxCapacity = 2, autoPause = true }) {
        return new Promise((resolve, reject) => this.client.modifyDBCluster({
            DBClusterIdentifier: resourceId,
            ApplyImmediately: true,
            ScalingConfiguration: {
                AutoPause: autoPause,
                MaxCapacity: maxCapacity,
                MinCapacity: minCapacity,
            },
        }, (err, data) => {
            if (err)
                reject(err);
            resolve(data);
        }));
    }
}
;
//# sourceMappingURL=rds.js.map