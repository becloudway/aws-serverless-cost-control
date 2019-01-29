const ResourceManager = require('./resourceManager');
const config = require('./config');
const { LAMBDA } = require('./clients');
const log = require('./logger');

const parseTagFromEvent = ({ Records }) => {
    const snsMessage = Records[0] && Records[0].Sns.Message;
    const dimensions = JSON.parse(snsMessage).Trigger.Dimensions;
    const tag = dimensions.find(d => d.name === 'Tag');

    if (!tag) throw new Error('No tags specified');
    const [tagKey, tagValue] = tag.value.split('=');
    return { tagKey, tagValue };
};

exports.handler = async (event, context) => {
    log.info('Received event', JSON.stringify(event, null, 2));
    log.info('Received constext', JSON.stringify(context, null, 2));

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
