const { subMinutes } = require('date-fns');
const ResourceManager = require('./resourceManager');
const config = require('./config');
const { CLOUDWATCH, SNS } = require('./clients');
const pricing = require('./pricing');
const dimension = require('./dimension');
const log = require('./logger');

const getTimeRange = () => {
    const end = subMinutes(Date.now(), config.metrics.METRIC_DELAY);
    const start = subMinutes(end, config.metrics.METRIC_WINDOW);
    return { start, end };
};

class CostRecord {
    constructor(resource) {
        this.resource = resource;
        this.Pricing = pricing[resource.service];
        this.Dimension = dimension[resource.service];
    }

    async fetch(start, end) {
        const costDimension = await new this.Dimension({ start, end, resource: this.resource }).create();
        const pricingScheme = await new this.Pricing().init();
        const costRecord = pricingScheme.calculateForDimension(costDimension);

        log.info(`Cost record for ${this.resource.service.toUpperCase()}`, costRecord);

        return { ...this, ...costRecord };
    }
}

exports.handler = async (event) => {
    log.info('Received event', event);

    try {
        const { start, end } = getTimeRange();

        // RESOURCES
        const resourceManager = await new ResourceManager({ tagKey: config.tags.SCC_MONITOR_GROUP, tagValue: 'true' }).init();
        const resources = [].concat(...(await Promise.all([
            resourceManager.getResources(config.SERVICE_LAMBDA, config.RESOURCE_LAMBDA_FUNCTION),
            resourceManager.getResources(config.SERVICE_RDS, config.RESOURCE_RDS_CLUSTER_INSTANCE),
            resourceManager.getResources(config.SERVICE_DYNAMODB, config.RESOURCE_DYNAMODB_TABLE),
        ])));
        const costRecords = await Promise.all(resources.map(resource => new CostRecord(resource).fetch(start, end)));

        // TRIGGER ACTIONS IF NEEDED
        const actionableResources = costRecords
            .filter(cr => cr.resource.actionable)
            .filter(cr => cr.estimatedMonthlyCharge >= cr.resource.costLimit)
            .map(cr => cr.resource);

        log.info('Actionable resources: ', actionableResources);

        await Promise.all(actionableResources.map(r => SNS.publish({
            topicArn: process.env.ACTIONABLE_TOPIC_ARN,
            resource: r,
        })));

        // CREATE COST METRICS
        await Promise.all(costRecords.map(costRecord => CLOUDWATCH.putMetricData({
            metricName: config.metrics.NAME_COST,
            service: costRecord.resource.service,
            cost: parseFloat(costRecord.totalCost),
            resourceId: costRecord.resource.id,
            timestamp: end,
        })));

        // CREATE ESTIMATED CHARGES METRICS
        await Promise.all(costRecords.map(costRecord => CLOUDWATCH.putMetricData({
            metricName: config.metrics.NAME_ESTIMATEDCHARGES,
            service: costRecord.resource.service,
            cost: parseFloat(costRecord.estimatedMonthlyCharge),
            resourceId: costRecord.resource.id,
            timestamp: end,
        })));

        return { status: 200 };
    } catch (e) {
        log.error('Something went wrong', e);
        return {
            status: 400,
            message: e.message,
        };
    }
};
