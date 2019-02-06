const config = require('../config');

module.exports = class Dynamodb {
    constructor(client, clwClient) {
        this.client = client;
        this.clwClient = clwClient;
    }

    async describeTable(tableName) {
        return new Promise((resolve, reject) => this.client.describeTable({
            TableName: tableName,
        }, (err, data) => {
            if (err) reject(err);
            resolve(data);
        }));
    }

    async getWriteCapacityUnits(resource, start, end) {
        const statistics = await this.clwClient.getMetricStatistics({
            nameSpace: 'AWS/DynamoDB',
            metricName: 'ConsumedWriteCapacityUnits',
            // dimensions: [{ Name: 'TableName', Value: resource.id }],
            startTime: start,
            endTime: end,
            period: 60 * config.metrics.METRIC_WINDOW,
            statistics: ['Average'],
        });

        if (!statistics.Datapoints || statistics.Datapoints.length === 0) return 0;
        return statistics.Datapoints.reduce((acc, curr) => acc + (curr.Average || 0), 0) / statistics.Datapoints.length;
    }

    async getReadCapacityUnits(resource, start, end) {
        const statistics = await this.clwClient.getMetricStatistics({
            nameSpace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            dimensions: [{ Name: 'TableName', Value: resource.id }],
            startTime: start,
            endTime: end,
            period: 60 * config.metrics.METRIC_WINDOW,
            statistics: ['Average'],
        });

        if (!statistics.Datapoints || statistics.Datapoints.length === 0) return 0;
        return statistics.Datapoints.reduce((acc, curr) => acc + (curr.Average || 0), 0) / statistics.Datapoints.length;
    }
};
