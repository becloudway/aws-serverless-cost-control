import { SNSEvent } from 'aws-lambda';
import { SERVICE_DYNAMODB, SERVICE_LAMBDA, SERVICE_RDS } from '../config';
import { dynamodbClient, lambdaClient, rdsClient } from '../clients';
import { log } from '../logger';
import { Resource } from '../resource';
import { LambdaResponse } from '../types';

const parseActionablesFromEvent = ({ Records }: SNSEvent): Resource[] => Records.map((record): Resource => {
    const attributes = record.Sns.MessageAttributes;
    const isActionable = attributes.actionable.Value === 'true';
    return new Resource(attributes.serviceName.Value, attributes.resourceId.Value, null, null, null, isActionable);
}).filter((r): boolean => r.actionable);

// eslint-disable-next-line func-call-spacing,no-spaced-func
const actions = new Map<string, (id: string) => void>();
actions.set(SERVICE_DYNAMODB, (resourceId): Promise<void> => dynamodbClient.throttle(resourceId, { readCapacityUnits: 1, writeCapacityUnits: 1 }));
actions.set(SERVICE_RDS, (resourceId): Promise<void> => rdsClient.throttle(resourceId, { maxCapacity: 2, minCapacity: 2, autoPause: true }));
actions.set(SERVICE_LAMBDA, (resourceId): Promise<void> => lambdaClient.throttle(resourceId, 0));

export const handler = async (event: SNSEvent): Promise<LambdaResponse> => {
    log.info('Received event', JSON.stringify(event, null, 2));

    try {
        await Promise.all(parseActionablesFromEvent(event).map(async (actionable): Promise<void> => {
            log.info(`Throttling ${actionable.service} resource ${actionable.resourceId}`);
            if (!actions.has(actionable.service)) {
                throw new Error('Unknown service');
            }
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
