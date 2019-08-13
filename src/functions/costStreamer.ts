import { differenceInSeconds } from 'date-fns';
import { CloudwatchClient, cloudwatchClient, kinesisClient } from '../clients';
import * as config from '../config';
import { log } from '../logger';
import { Pricing } from '../pricing';
import { Resource, ResourceManager } from '../resource';
import {
    DateRange, KinesisCostRecord, LambdaResponse, ResourceTag,
} from '../types';
import { DateTime } from '../utils';

export const handler = async (): Promise<LambdaResponse> => {
    try {
        const kinesisStream = process.env.KINESIS_STREAM_NAME;
        const dateRange: DateRange = DateTime.getDateRange(config.metrics.METRIC_DELAY, config.metrics.METRIC_WINDOW);
        const includeTags = config.TAGS.INCLUDE_TAGS.map(t => ({ key: t, value: 'true' }));
        const excludeTags = config.TAGS.EXCLUDE_TAGS.map(t => ({ key: t, value: 'true' }));

        // RESOURCES
        const resourceManager = await new ResourceManager().init(includeTags, excludeTags);
        const resources: Resource[] = [].concat(...(await Promise.all([
            resourceManager.getResources(config.SERVICE_LAMBDA, config.RESOURCE_LAMBDA_FUNCTION),
            resourceManager.getResources(config.SERVICE_RDS, config.RESOURCE_RDS_CLUSTER_INSTANCE),
            resourceManager.getResources(config.SERVICE_DYNAMODB, config.RESOURCE_DYNAMODB_TABLE),
        ]))).filter(i => i != null);

        const resourcesCost: number = (await Promise.all(resources.map(async (resource) => {
            const statistics = await cloudwatchClient.getCostMetricStatistics({
                metricName: config.metrics.NAME_COST,
                range: dateRange,
                resourceId: resource.id,
                service: resource.service,
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
            message: e.message,
            status: 400,
        };
    }
};
