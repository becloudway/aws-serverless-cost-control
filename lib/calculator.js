"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
const config = require("./config");
const clients_1 = require("./clients");
const logger_1 = require("./logger");
const CostRecord_1 = require("./CostRecord");
const resourceManager_1 = require("./resourceManager");
const getTimeRange = () => {
    const end = date_fns_1.subMinutes(Date.now(), config.metrics.METRIC_DELAY);
    const start = date_fns_1.subMinutes(end, config.metrics.METRIC_WINDOW);
    return { start, end };
};
exports.handler = async () => {
    try {
        const dateRange = getTimeRange();
        const resourceTag = {
            key: config.TAGS.SCC_MONITOR_GROUP,
            value: 'true',
        };
        // RESOURCES
        const resourceManager = await new resourceManager_1.ResourceManager(resourceTag).init();
        const resources = [].concat(...(await Promise.all([
            resourceManager.getResources(config.SERVICE_LAMBDA, config.RESOURCE_LAMBDA_FUNCTION),
            resourceManager.getResources(config.SERVICE_RDS, config.RESOURCE_RDS_CLUSTER_INSTANCE),
            resourceManager.getResources(config.SERVICE_DYNAMODB, config.RESOURCE_DYNAMODB_TABLE),
        ])));
        const costRecords = await Promise.all(resources.map(resource => new CostRecord_1.CostRecord(resource).fetch(dateRange)));
        // TRIGGER ACTIONS IF NEEDED
        const actionableResources = costRecords
            .filter(cr => cr.resource.actionable)
            .filter(cr => cr.pricing.estimatedMonthlyCharge >= cr.resource.costLimit)
            .map(cr => cr.resource);
        logger_1.log.info('Actionable resources: ', actionableResources);
        await Promise.all(actionableResources.map(r => clients_1.snsClient.publish(process.env.ACTIONABLE_TOPIC_ARN, r)));
        // CREATE COST METRICS
        await Promise.all(costRecords.map(costRecord => clients_1.cloudwatchClient.putMetricData({
            metricName: config.metrics.NAME_COST,
            service: costRecord.resource.service,
            cost: costRecord.pricing.totalCost,
            resourceId: costRecord.resource.id,
            timestamp: dateRange.end,
        })));
        // CREATE ESTIMATED CHARGES METRICS
        await Promise.all(costRecords.map(costRecord => clients_1.cloudwatchClient.putMetricData({
            metricName: config.metrics.NAME_ESTIMATEDCHARGES,
            service: costRecord.resource.service,
            cost: costRecord.pricing.estimatedMonthlyCharge,
            resourceId: costRecord.resource.id,
            timestamp: dateRange.end,
        })));
        return { status: 200 };
    }
    catch (e) {
        logger_1.log.error('Something went wrong', e);
        return {
            status: 400,
            message: e.message,
        };
    }
};
//# sourceMappingURL=calculator.js.map