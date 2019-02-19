const { subMinutes } = require('date-fns');
const ResourceManager = require('./resourceManager');
const config = require('./config');
const { CLOUDWATCH } = require('./clients');
const pricing = require('./pricing');
const dimension = require('./dimension');
const log = require('./logger');

const getTimeRange = () => {
    const end = subMinutes(Date.now(), config.metrics.METRIC_DELAY);
    const start = subMinutes(end, config.metrics.METRIC_WINDOW);
    return { start, end };
};

class CostRecord {
    constructor({ serviceName, resourceType, resourceManager }) {
        this.serviceName = serviceName;
        this.resourceType = resourceType;
        this.resourceManager = resourceManager;
        this.Pricing = pricing[this.serviceName];
        this.Dimension = dimension[this.serviceName];
    }

    async fetch(start, end) {
        const resources = await this.resourceManager.getResources(this.serviceName, this.resourceType);
        const dimensions = await Promise.all(resources.map(resource => new this.Dimension({ start, end, resource }).create()));
        const pricingScheme = await new this.Pricing().init();
        const costRecords = pricingScheme.calculate(dimensions);

        log.info(`Cost records for ${this.serviceName.toUpperCase()}`, costRecords);

        return costRecords;
    }
}

exports.handler = async (event) => {
    log.info('Received event', event);

    try {
        const { start, end } = getTimeRange();
        const resourceManager = await new ResourceManager({ tagKey: config.tags.SCC_MONITOR_GROUP, tagValue: 'true' }).init();

        const lambdaCostRecords = await new CostRecord({
            serviceName: config.SERVICE_LAMBDA,
            resourceType: config.RESOURCE_LAMBDA_FUNCTION,
            resourceManager,
        }).fetch(start, end);
        const rdsCostRecords = await new CostRecord({
            serviceName: config.SERVICE_RDS,
            resourceType: config.RESOURCE_RDS_CLUSTER_INSTANCE,
            resourceManager,
        }).fetch(start, end);
        const dynamoDBCostRecords = await new CostRecord({
            serviceName: config.SERVICE_DYNAMODB,
            resourceType: config.RESOURCE_DYNAMODB_TABLE,
            resourceManager,
        }).fetch(start, end);

        await Promise.all([
            ...lambdaCostRecords.map(costRecord => CLOUDWATCH.putMetricData({
                metricName: config.metrics.NAME_COST,
                service: 'lambda',
                cost: parseFloat(costRecord.totalCost),
                resourceId: costRecord.resourceId,
                timestamp: end,
            })),
            ...lambdaCostRecords.map(costRecord => CLOUDWATCH.putMetricData({
                metricName: config.metrics.NAME_ESTIMATEDCHARGES,
                service: 'lambda',
                cost: parseFloat(costRecord.estimatedMonthlyCharge),
                resourceId: costRecord.resourceId,
                timestamp: end,
            })),
            ...rdsCostRecords.map(costRecord => CLOUDWATCH.putMetricData({
                metricName: config.metrics.NAME_COST,
                service: 'rds',
                cost: parseFloat(costRecord.totalCost),
                resourceId: costRecord.resourceId,
                timestamp: end,
            })),
            ...rdsCostRecords.map(costRecord => CLOUDWATCH.putMetricData({
                metricName: config.metrics.NAME_ESTIMATEDCHARGES,
                service: 'rds',
                cost: parseFloat(costRecord.estimatedMonthlyCharge),
                resourceId: costRecord.resourceId,
                timestamp: end,
            })),
            ...dynamoDBCostRecords.map(costRecord => CLOUDWATCH.putMetricData({
                metricName: config.metrics.NAME_COST,
                service: 'dynamoDB',
                cost: parseFloat(costRecord.totalCost),
                resourceId: costRecord.resourceId,
                timestamp: end,
            })),
            ...dynamoDBCostRecords.map(costRecord => CLOUDWATCH.putMetricData({
                metricName: config.metrics.NAME_ESTIMATEDCHARGES,
                service: 'dynamoDB',
                cost: parseFloat(costRecord.estimatedMonthlyCharge),
                resourceId: costRecord.resourceId,
                timestamp: end,
            })),
        ]);

        return { status: 200 };
    } catch (e) {
        log.error('Something went wrong', e);
        return {
            status: 400,
            message: e.message,
        };
    }
};
