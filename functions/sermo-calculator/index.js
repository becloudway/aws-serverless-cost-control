const { addMinutes, subMinutes } = require('date-fns');
const ResourceManager = require('./resourceManager');
const config = require('./config');
const { CLOUDWATCH } = require('./clients');
const { LambdaPricing } = require('./pricing');
const { LambdaDimension } = require('./dimension');
const log = require('./logger');

const parseTagFromEvent = ({ tag }) => {
    if (tag) return { tagKey: tag.key, tagValue: tag.value };
    throw new Error('No tags specified');
};

const getTimeRange = () => {
    const start = subMinutes(Date.now(), config.metrics.METRIC_DELAY + config.metrics.METRIC_WINDOW);
    const end = addMinutes(start, config.metrics.METRIC_WINDOW);
    return { start, end };
};

exports.handler = async (event) => {
    log.info('Received event', event);

    try {
        const { tagKey, tagValue } = parseTagFromEvent(event);
        const { start, end } = getTimeRange();
        const resourceManager = await new ResourceManager({ tagKey, tagValue }).init();

        const lambdaFunctions = await resourceManager.getResources(
            config.SERVICE_LAMBDA,
            config.RESOURCE_LAMBDA_FUNCTION,
        );

        const lambdaDimensions = await Promise.all(lambdaFunctions.map(
            lambdaFunction => new LambdaDimension({ start, end, lambdaFunction }).create(),
        ));

        const lambdaPricing = new LambdaPricing();
        await lambdaPricing.init();
        const costRecord = lambdaPricing.calculate(lambdaDimensions, { includeFreeTier: true });

        log.info('Cost record for LAMBDA', costRecord);
        await CLOUDWATCH.putMetricData({
            service: 'lambda',
            cost: parseFloat(costRecord.totalCost),
            tagKey,
            tagValue,
            timestamp: end,
        });

        return { status: 200 };
    } catch (e) {
        log.error('Something went wrong', e);
        return {
            status: 400,
            message: e.message,
        };
    }
};
