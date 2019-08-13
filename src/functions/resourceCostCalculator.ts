import { cloudwatchClient, snsClient } from '../clients';
import * as config from '../config';
import { log } from '../logger';
import { CostRecord } from '../pricing';
import { ResourceManager } from '../resource';
import { DateRange, LambdaResponse, ResourceTag } from '../types';
import { DateTime } from '../utils';

export const handler = async (): Promise<LambdaResponse> => {
    try {
        const dateRange: DateRange = DateTime.getDateRange(config.metrics.METRIC_DELAY, config.metrics.METRIC_WINDOW);
        const includeTags = config.TAGS.INCLUDE_TAGS.map(t => ({ key: t, value: 'true' }));
        const excludeTags = config.TAGS.EXCLUDE_TAGS.map(t => ({ key: t, value: 'true' }));

        // RESOURCES
        const resourceManager = await new ResourceManager().init(includeTags, excludeTags);
        const resources = [].concat(...(await Promise.all([
            resourceManager.getResources(config.SERVICE_LAMBDA, config.RESOURCE_LAMBDA_FUNCTION),
            resourceManager.getResources(config.SERVICE_RDS, config.RESOURCE_RDS_CLUSTER_INSTANCE),
            resourceManager.getResources(config.SERVICE_DYNAMODB, config.RESOURCE_DYNAMODB_TABLE),
        ]))).filter(i => i != null);

        const costRecords = await Promise.all(resources.map(resource => new CostRecord(resource).fetch(dateRange)));

        // TRIGGER NOTIFICATIONS IF NEEDED
        const resourcesInAlarm = costRecords
            .filter(cr => cr.pricing.estimatedMonthlyCharge >= cr.resource.costLimit)
            .map(cr => cr.resource);

        await Promise.all(resourcesInAlarm.map(r => snsClient.publish(process.env.ACTIONABLE_TOPIC_ARN, r)));

        // CREATE COST METRICS
        await Promise.all(costRecords.map(costRecord => cloudwatchClient.putCostMetricData({
            metricName: config.metrics.NAME_COST,
            resourceId: costRecord.resource.id,
            service: costRecord.resource.service,
            timestamp: dateRange.end,
            value: costRecord.pricing.totalCost,
        })));

        // CREATE ESTIMATED CHARGES METRICS
        await Promise.all(costRecords.map(costRecord => cloudwatchClient.putCostMetricData({
            metricName: config.metrics.NAME_ESTIMATEDCHARGES,
            resourceId: costRecord.resource.id,
            service: costRecord.resource.service,
            timestamp: dateRange.end,
            value: costRecord.pricing.estimatedMonthlyCharge,
        })));

        return { status: 200 };
    } catch (e) {
        log.error('Something went wrong', e);
        return {
            message: e.message,
            status: 400,
        };
    }
};
