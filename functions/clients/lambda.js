const config = require('../config');

module.exports = class Lambda {
    constructor(client, clwClient) {
        this.client = client;
        this.clwClient = clwClient;
    }

    throttle(resource, allowedConcurrentExecutions = 1) {
        return new Promise((resolve, reject) => this.client.putFunctionConcurrency({
            FunctionName: resource.id,
            ReservedConcurrentExecutions: allowedConcurrentExecutions,
        }, (err) => {
            if (err) reject(err);
            resolve();
        }));
    }

    async calculateLambdaInvocations(resource, start, end) {
        const invocations = await this.clwClient.getMetricStatistics({
            nameSpace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensions: [{ Name: 'FunctionName', Value: resource.id }],
            startTime: start,
            endTime: end,
            period: 60 * config.metrics.METRIC_WINDOW,
            statistics: ['Sum'],
        });

        if (!invocations.Datapoints || invocations.Datapoints.length === 0) return 0;
        return invocations.Datapoints.reduce((acc, curr) => acc + (curr.Sum || 0), 0);
    }

    async calculateLambdaDuration(resource, start, end) {
        const duration = await this.clwClient.getMetricStatistics({
            nameSpace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensions: [{ Name: 'FunctionName', Value: resource.id }],
            startTime: start,
            endTime: end,
            period: 60 * config.metrics.METRIC_WINDOW,
            statistics: ['Average'],
        });

        if (!duration.Datapoints || duration.Datapoints.length === 0) return 0;
        return duration.Datapoints.reduce((acc, curr) => acc + (curr.Average || 0), 0) / duration.Datapoints.length;
    }

    getMemory(resource) {
        return new Promise((resolve, reject) => this.client.getFunctionConfiguration({
            FunctionName: resource.id,
        }, (err, data) => {
            if (err) reject(err);
            resolve(data.MemorySize);
        }));
    }
};
