const { LAMBDA, DYNAMODB, RDS } = require('./clients');
const log = require('./logger');

const parseActionablesFromEvent = ({ Records }) => Records.map((record) => {
    const attributes = record.Sns.MessageAttributes;

    return {
        serviceName: attributes.serviceName.Value,
        resourceId: attributes.resourceId.Value,
    };
});

const action = {
    lambda: resource => LAMBDA.throttle(resource, 0),
    rds: () => resource => RDS.throttle(resource, { maxCapacity: 2, minCapacity: 2, autoPause: true }),
    dynamodb: resource => DYNAMODB.throttle(resource, { readCapacityUnits: 1, writeCapacityUnits: 1 }),
};

exports.handler = async (event, context) => {
    log.info('Received event', JSON.stringify(event, null, 2));
    log.info('Received context', JSON.stringify(context, null, 2));

    try {
        await Promise.all(parseActionablesFromEvent(event).map(async (actionable) => {
            await action[actionable.serviceName](actionable.resourceId);
            log.info(`Throttled ${actionable.serviceName} resource ${actionable.resourceId}`);
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
