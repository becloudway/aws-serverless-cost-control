const config = require('../config');

module.exports = class Cloudwatch {
    constructor(client) {
        this.client = client;
    }

    getMetricStatistics({
        nameSpace,
        metricName,
        dimensions,
        startTime,
        endTime,
        period,
        statistics,
    }) {
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
                if (err) reject(err);
                resolve(data);
            });
        });
    }

    putMetricData({
        timestamp, cost, service, resourceId, metricName,
    }) {
        return new Promise((resolve, reject) => {
            this.client.putMetricData({
                Namespace: config.metrics.NAME_SPACE,
                MetricData: [{
                    Timestamp: timestamp,
                    Value: cost,
                    Unit: 'Count',
                    MetricName: metricName,
                    Dimensions: [
                        {
                            Name: config.metrics.DIMENSIONS.SERVICE_NAME,
                            Value: service,
                        },
                        {
                            Name: config.metrics.DIMENSIONS.RESOURCE_ID,
                            Value: resourceId,
                        },
                        {
                            Name: config.metrics.DIMENSIONS.CURRENCY,
                            Value: config.metrics.DIMENSIONS.CURRENCY_USD,
                        },
                    ],
                }],
            }, (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }
};
