"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AWSClient_1 = require("./AWSClient");
const config_1 = require("../config");
class DynamoDBClient extends AWSClient_1.AWSClient {
    async describeTable(tableName) {
        return new Promise((resolve, reject) => this.client.describeTable({
            TableName: tableName,
        }, (err, data) => {
            if (err)
                reject(err);
            resolve(data);
        }));
    }
    async getWriteCapacityUnits(resource, start, end) {
        const metricStatisticsParams = {
            nameSpace: 'AWS/DynamoDB',
            metricName: 'ConsumedWriteCapacityUnits',
            startTime: start,
            endTime: end,
            period: 60 * config_1.metrics.METRIC_WINDOW,
            statistics: ['Average'],
        };
        const statistics = await this.clwClient.getMetricStatistics(metricStatisticsParams);
        if (!statistics.Datapoints || statistics.Datapoints.length === 0)
            return 0;
        return statistics.Datapoints.reduce((acc, curr) => acc + (curr.Average || 0), 0) / statistics.Datapoints.length;
    }
    async getReadCapacityUnits(resource, start, end) {
        const statistics = await this.clwClient.getMetricStatistics({
            nameSpace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            dimensions: [{ Name: 'TableName', Value: resource.id }],
            startTime: start,
            endTime: end,
            period: 60 * config_1.metrics.METRIC_WINDOW,
            statistics: ['Average'],
        });
        if (!statistics.Datapoints || statistics.Datapoints.length === 0)
            return 0;
        return statistics.Datapoints.reduce((acc, curr) => acc + (curr.Average || 0), 0) / statistics.Datapoints.length;
    }
    async throttle(resourceId, { readCapacityUnits = 1, writeCapacityUnits = 1 } = {}) {
        return new Promise((resolve, reject) => this.client.updateTable({
            TableName: resourceId,
            BillingMode: 'PROVISIIONED',
            ProvisionedThroughput: {
                ReadCapacityUnits: readCapacityUnits,
                WriteCapacityUnits: writeCapacityUnits,
            },
        }, (err) => {
            if (err)
                reject(err);
            return resolve();
        }));
    }
}
exports.DynamoDBClient = DynamoDBClient;
//# sourceMappingURL=DynamoDBClient.js.map