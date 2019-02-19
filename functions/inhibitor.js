const ResourceManager = require('./resourceManager');
const config = require('./config');
const { LAMBDA, DYNAMODB, RDS } = require('./clients');
const log = require('./logger');

const parseDataFromEvent = ({ Records }) => {
    const snsMessage = Records[0] && Records[0].Sns.Message;
    const dimensions = JSON.parse(snsMessage).Trigger.Dimensions;
    const serviceName = dimensions.find(d => d.name === 'ServiceName').value;
    const resourceId = dimensions.find(d => d.name === 'ResourceId').value;

    return {
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
            resourceId,
            serviceName,
        } = parseDataFromEvent(event);

        const resourceManager = await new ResourceManager({ tagKey: config.tags.SCC_ACTIONABLE, tagValue: 'true' }).init();
        const resource = await resourceManager.getResource(serviceName, resourceId);

        if (resource) {
            await action[serviceName](resource);
            log.info(`Throttled ${serviceName} resource ${resourceId}`);
        }

        return { status: 200 };
    } catch (e) {
        log.error('Something went wrong', e);
        return {
            status: 400,
            message: e.message,
        };
    }
};
