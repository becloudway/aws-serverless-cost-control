import * as config from './config';
import { DateRange, LambdaResponse, ResourceTag } from './types';
import { cloudwatchClient, snsClient } from './clients';
import { log } from './logger';
import { ResourceManager } from './resource';
import { getTimeRange } from './util';
import { CostRecord } from './pricing';

export const handler = async (): Promise<LambdaResponse> => {
    try {
        const dateRange: DateRange = getTimeRange(config.metrics.METRIC_DELAY, config.metrics.METRIC_WINDOW);
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

        // TRIGGER NOTIFICATIONS IF NEEDED
        const resourcesInAlarm = costRecords
            .filter(cr => cr.pricing.estimatedMonthlyCharge >= cr.resource.costLimit)
            .map(cr => cr.resource);

        await Promise.all(resourcesInAlarm.map(r => snsClient.publish(process.env.ACTIONABLE_TOPIC_ARN, r)));

        // CREATE COST METRICS
        await Promise.all(costRecords.map(costRecord => cloudwatchClient.putCostMetricData({
            metricName: config.metrics.NAME_COST,
            value: costRecord.pricing.totalCost,
            resourceId: costRecord.resource.id,
            timestamp: dateRange.end,
            service: costRecord.resource.service,
        })));

        // CREATE ESTIMATED CHARGES METRICS
        await Promise.all(costRecords.map(costRecord => cloudwatchClient.putCostMetricData({
            metricName: config.metrics.NAME_ESTIMATEDCHARGES,
            value: costRecord.pricing.estimatedMonthlyCharge,
            resourceId: costRecord.resource.id,
            timestamp: dateRange.end,
            service: costRecord.resource.service,
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
