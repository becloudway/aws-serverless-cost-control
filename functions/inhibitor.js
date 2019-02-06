const ResourceManager = require('./resourceManager');
const { LAMBDA, DYNAMODB, RDS } = require('./clients');
const log = require('./logger');

const parseTagFromEvent = ({ Records }) => {
    const snsMessage = Records[0] && Records[0].Sns.Message;
    const dimensions = JSON.parse(snsMessage).Trigger.Dimensions;
    const tag = dimensions.find(d => d.name === 'Tag');
    const serviceName = dimensions.find(d => d.name === 'ServiceName').value;
    const resourceId = dimensions.find(d => d.name === 'ResourceId').value;

    if (!tag) throw new Error('No tags specified');
    const [tagKey, tagValue] = tag.value.split('=');
    return {
        tagKey,
        tagValue,
        resourceId,
        serviceName,
    };
};

const action = {
    lambda: resource => LAMBDA.throttle(resource, 1),
    rds: () => resource => RDS.throttle(resource, { maxCapacity: 2, minCapacity: 2, autoPause: true }),
    dynamodb: resource => DYNAMODB.throttle(resource, { readCapacityUnits: 1, writeCapacityUnits: 1 }),
};

exports.handler = async (event, context) => {
    log.info('Received event', JSON.stringify(event, null, 2));
    log.info('Received context', JSON.stringify(context, null, 2));

    try {
        const {
            tagKey,
            tagValue,
            resourceId,
            serviceName,
        } = parseTagFromEvent(event);

        const resourceManager = await new ResourceManager({ tagKey, tagValue }).init();
        const resource = await resourceManager.getResource(serviceName, resourceId);

        await action[serviceName](resource);

        log.info(`Throttled ${serviceName} resource ${resourceId}`);

        return { status: 200 };
    } catch (e) {
        log.error('Something went wrong', e);
        return {
            status: 400,
            message: e.message,
        };
    }
};
