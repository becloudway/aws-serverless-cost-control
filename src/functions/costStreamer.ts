import { differenceInSeconds } from 'date-fns';
import { log } from '../logger';
import {CloudwatchClient, cloudwatchClient, kinesisClient} from '../clients';
import * as config from '../config';
import { DateTime } from '../util';
import { Resource, ResourceManager } from '../resource';
import {
    DateRange, KinesisCostRecord, LambdaResponse, ResourceTag,
} from '../types';
import { Pricing } from '../pricing';

export const handler = async (): Promise<LambdaResponse> => {
    try {
        const kinesisStream = process.env.KINESIS_STREAM_NAME;
        const dateRange: DateRange = DateTime.getDateRange(config.metrics.METRIC_DELAY, config.metrics.METRIC_WINDOW);
        const resourceTag: ResourceTag = { key: config.TAGS.SCC_MONITOR_GROUP, value: 'true' };

        // RESOURCES
        const resourceManager: ResourceManager = await new ResourceManager(resourceTag).init();
        const resources: Resource[] = [].concat(...(await Promise.all([
            resourceManager.getResources(config.SERVICE_LAMBDA, config.RESOURCE_LAMBDA_FUNCTION),
            resourceManager.getResources(config.SERVICE_RDS, config.RESOURCE_RDS_CLUSTER_INSTANCE),
            resourceManager.getResources(config.SERVICE_DYNAMODB, config.RESOURCE_DYNAMODB_TABLE),
        ]))).filter(i => i != null);

        const resourcesCost: number = (await Promise.all(resources.map(async (resource) => {
            const statistics = await cloudwatchClient.getCostMetricStatistics({
                metricName: config.metrics.NAME_COST,
                resourceId: resource.id,
                service: resource.service,
                range: dateRange,
            });

            return CloudwatchClient.calculateDatapointsAverage(statistics.Datapoints);
        }))).reduce((acc, curr) => acc + curr, 0);

        await kinesisClient.putRecord<KinesisCostRecord>(
            kinesisStream,
            {
                cost: Pricing.getMonthlyEstimate(resourcesCost, differenceInSeconds(dateRange.end, dateRange.start)),
                timestamp: dateRange.end,
            },
        );

        return { status: 200 };
    } catch (e) {
        log.error('Something went wrong', e);
        return {
            status: 400,
            message: e.message,
        };
    }
};
