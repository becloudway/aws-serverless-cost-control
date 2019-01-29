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

    /*
var params = {
  MetricData: [ /* required *
    {
      MetricName: 'STRING_VALUE', /* required *
      Counts: [
        0.0,
          /* more items *
      ],
      Dimensions: [
        {
          Name: 'STRING_VALUE', /* required *
          Value: 'STRING_VALUE' /* required *
        },
          /* more items *
      ],
      StatisticValues: {
        Maximum: 0.0, /* required *
        Minimum: 0.0, /* required *
        SampleCount: 0.0, /* required *
        Sum: 0.0 /* required *
      },
      StorageResolution: 0,
      Timestamp: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789,
      Unit: Seconds | Microseconds | Milliseconds | Bytes | Kilobytes | Megabytes | Gigabytes | Terabytes | Bits | Kilobits | Megabits | Gigabits | Terabits | Percent | Count | Bytes/Second | Kilobytes/Second | Megabytes/Second | Gigabytes/Second | Terabytes/Second | Bits/Second | Kilobits/Second | Megabits/Second | Gigabits/Second | Terabits/Second | Count/Second | None,
      Value: 0.0,
      Values: [
        0.0,
          /* more items *
      ]
    },
      /* more items *
  ],
  Namespace: 'STRING_VALUE' /* required *
};
*/
    putMetricData({
        timestamp, cost, service, tagKey, tagValue,
    }) {
        return new Promise((resolve, reject) => {
            this.client.putMetricData({
                Namespace: config.metrics.NAME_SPACE,
                MetricData: [{
                    Timestamp: timestamp,
                    Value: cost,
                    Unit: 'Count',
                    MetricName: config.metrics.NAME_ESTIMATEDCHARGES,
                    Dimensions: [
                        {
                            Name: config.metrics.DIMENSIONS.SERVICE_NAME,
                            Value: service,
                        },
                        {
                            Name: config.metrics.DIMENSIONS.PERIOD,
                            Value: config.forecast.PERIOD_DEFAULT,
                        },
                        {
                            Name: config.metrics.DIMENSIONS.CURRENCY,
                            Value: config.metrics.DIMENSIONS.CURRENCY_USD,
                        },
                        {
                            Name: config.metrics.DIMENSIONS.TAG,
                            Value: `${tagKey}=${tagValue}`,
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
