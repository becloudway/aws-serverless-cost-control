import { SNSEvent } from 'aws-lambda';
import { SERVICE_DYNAMODB, SERVICE_LAMBDA, SERVICE_RDS } from './config';
import { dynamodbClient, lambdaClient, rdsClient } from './clients';

import { log } from './logger';
import { Resource } from './resource';
import { Pricing } from './pricing';

const parseActionablesFromEvent = ({ Records }: SNSEvent): Resource[] => Records.map((record) => {
    const attributes = record.Sns.MessageAttributes;
    return new Resource(attributes.serviceName.Value, attributes.resourceId.Value);
});

// eslint-disable-next-line func-call-spacing,no-spaced-func
const actions = new Map<string, (id: string) => void>();
const pricings = new Map<string, new() => Pricing>();
actions.set(SERVICE_DYNAMODB, resourceId => dynamodbClient.throttle(resourceId, { readCapacityUnits: 1, writeCapacityUnits: 1 }));
actions.set(SERVICE_RDS, resourceId => rdsClient.throttle(resourceId, { maxCapacity: 2, minCapacity: 2, autoPause: true }));
actions.set(SERVICE_LAMBDA, resourceId => lambdaClient.throttle(resourceId, 0));

export const handler = async (event: SNSEvent) => {
    log.info('Received event', JSON.stringify(event, null, 2));

    try {
        await Promise.all(parseActionablesFromEvent(event).map(async (actionable) => {
            log.info(`Throttling ${actionable.service} resource ${actionable.resourceId}`);
            await actions.get(actionable.service)(actionable.resourceId);
            log.info(`${actionable.resourceId} throttled.`);
        }));

        return { status: 200 };
    } catch (e) {
        log.error('Something went wrong', e);
        return {
            status: 400,
            message: e.message,
        };
    }
};
