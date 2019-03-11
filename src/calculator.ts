import { subMinutes } from 'date-fns';
import * as config from './config';
import { DateRange, ResourceTag } from './types';
import { cloudwatchClient, snsClient } from './clients';
import { log } from './logger';
import { CostRecord } from './CostRecord';
import { ResourceManager } from './resourceManager';

const getTimeRange = (): DateRange => {
    const end = subMinutes(Date.now(), config.metrics.METRIC_DELAY);
    const start = subMinutes(end, config.metrics.METRIC_WINDOW);
    return { start, end };
};

export const handler = async () => {
    try {
        const dateRange = getTimeRange();
        const resourceTag: ResourceTag = {
            key: config.TAGS.SCC_MONITOR_GROUP,
            value: 'true',
        };

        // RESOURCES
        const resourceManager = await new ResourceManager(resourceTag).init();
        const resources = [].concat(...(await Promise.all([
            resourceManager.getResources(config.SERVICE_LAMBDA, config.RESOURCE_LAMBDA_FUNCTION),
            resourceManager.getResources(config.SERVICE_RDS, config.RESOURCE_RDS_CLUSTER_INSTANCE),
            resourceManager.getResources(config.SERVICE_DYNAMODB, config.RESOURCE_DYNAMODB_TABLE),
        ])));
        const costRecords = await Promise.all(resources.map(resource => new CostRecord(resource).fetch(dateRange)));

        // TRIGGER ACTIONS IF NEEDED
        const actionableResources = costRecords
            .filter(cr => cr.resource.actionable)
            .filter(cr => cr.pricing.estimatedMonthlyCharge >= cr.resource.costLimit)
            .map(cr => cr.resource);

        log.info('Actionable resources: ', actionableResources);

        await Promise.all(actionableResources.map(r => snsClient.publish(process.env.ACTIONABLE_TOPIC_ARN, r)));

        // CREATE COST METRICS
        await Promise.all(costRecords.map(costRecord => cloudwatchClient.putMetricData({
            metricName: config.metrics.NAME_COST,
            service: costRecord.resource.service,
            cost: costRecord.pricing.totalCost,
            resourceId: costRecord.resource.id,
            timestamp: dateRange.end,
        })));

        // CREATE ESTIMATED CHARGES METRICS
        await Promise.all(costRecords.map(costRecord => cloudwatchClient.putMetricData({
            metricName: config.metrics.NAME_ESTIMATEDCHARGES,
            service: costRecord.resource.service,
            cost: costRecord.pricing.estimatedMonthlyCharge,
            resourceId: costRecord.resource.id,
            timestamp: dateRange.end,
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
