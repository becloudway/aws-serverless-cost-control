const log = require('log4js').getLogger();
const { parse, addMinutes, subMinutes } = require('date-fns');
const ResourceManager = require('./resourceManager');
const config = require('./config');
const { LAMBDA, TAG } = require('./clients');

log.level = 'debug';

const parseTagFromEvent = ({ tag }) => {
    if (tag) return { tagKey: tag.key, tagValue: tag.value };
    throw new Error('No tags specified');
};

const getTimeRange = () => {
    const start = subMinutes(Date.now(), config.metrics.METRIC_DELAY);
    const end = parse(Date.now()); // addMinutes(start, config.metrics.METRIC_WINDOW);
    return { start, end };
};

exports.handler = async (event, context) => {
    log.info('Recevied context', JSON.stringify(context, null, 2));
    log.info('Received event', JSON.stringify(event, null, 2));

    try {
        const { tagKey, tagValue } = parseTagFromEvent(event);
        const { start, end } = getTimeRange();
        const resourceManager = new ResourceManager({ tagKey, tagValue });
        await resourceManager.init();

        const lambdaFunctions = resourceManager.getResources(
            config.SERVICE_LAMBDA,
            config.RESOURCE_LAMBDA_FUNCTION,
        );

        const executions = await LAMBDA.calculateLambdaExecutions(lambdaFunctions[0], start, end);
        const duration = await LAMBDA.calculateLambdaDuration(lambdaFunctions[0], start, end);
        const memory = await LAMBDA.getMemory(lambdaFunctions[0]);

        log.info('Executions for Lambda function %s: %d - Memory: %dMb - Avg Duration: %dms', lambdaFunctions[0].id, executions, memory, duration);

        return {
            status: 200,
            message: 'received',
        };
    } catch (e) {
        log.error('Something went wrong', e);
        return {
            status: 400,
            message: e.message,
        };
    }
};
