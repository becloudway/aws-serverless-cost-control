"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AWSClient_1 = require("./AWSClient");
const config_1 = require("../config");
class Cloudwatch extends AWSClient_1.AWSClient {
    getMetricStatistics({ nameSpace, metricName, dimensions, startTime, endTime, period, statistics, }) {
        return new Promise((resolve, reject) => {
            this.client.getMetricStatistics({
                Namespace: nameSpace,
                MetricName: metricName,
                Dimensions: dimensions,
                StartTime: startTime,
                EndTime: endTime,
                Period: period,
                Statistics: statistics,
            }, (err, data) => {
                if (err)
                    reject(err);
                resolve(data);
            });
        });
    }
    putMetricData({ timestamp, cost, service, resourceId, metricName, }) {
        return new Promise((resolve, reject) => {
            this.client.putMetricData({
                Namespace: config_1.metrics.NAME_SPACE,
                MetricData: [{
                        Timestamp: timestamp,
                        Value: cost,
                        Unit: 'Count',
                        MetricName: metricName,
                        Dimensions: [
                            {
                                Name: config_1.metrics.DIMENSIONS.SERVICE_NAME,
                                Value: service,
                            },
                            {
                                Name: config_1.metrics.DIMENSIONS.RESOURCE_ID,
                                Value: resourceId,
                            },
                            {
                                Name: config_1.metrics.DIMENSIONS.CURRENCY,
                                Value: config_1.metrics.DIMENSIONS.CURRENCY_USD,
                            },
                        ],
                    }],
            }, (err) => {
                if (err)
                    reject(err);
                resolve();
            });
        });
    }
}
exports.Cloudwatch = Cloudwatch;
;
//# sourceMappingURL=cloudwatch.js.map