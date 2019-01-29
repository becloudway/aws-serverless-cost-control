const ResourceManager = require('./resourceManager');
const config = require('./config');
const { LAMBDA } = require('./clients');
const log = require('./logger');

const parseTagFromEvent = ({ tag }) => {
    if (tag) return { tagKey: tag.key, tagValue: tag.value };
    throw new Error('No tags specified');
};

exports.handler = async (event) => {
    log.info('Received event', event);

    try {
        const { tagKey, tagValue } = parseTagFromEvent(event);
        const resourceManager = await new ResourceManager({ tagKey, tagValue }).init();

        const lambdaFunctions = await resourceManager.getResources(
            config.SERVICE_LAMBDA,
            config.RESOURCE_LAMBDA_FUNCTION,
        );

        await Promise.all(lambdaFunctions.map(f => LAMBDA.throttle(f, 1)));

        log.info('Throttled Lambda functions', lambdaFunctions.map(f => f.id));

        return { status: 200 };
    } catch (e) {
        log.error('Something went wrong', e);
        return {
            status: 400,
            message: e.message,
        };
    }
};
