const { subMinutes } = require('date-fns');
const ResourceManager = require('./resourceManager');
const config = require('./config');
const { CLOUDWATCH } = require('./clients');
const { LambdaPricing, RdsPricing } = require('./pricing');
const { LambdaDimension, RdsDimension } = require('./dimension');
const log = require('./logger');

const parseTagFromEvent = ({ tag }) => {
    if (tag) return { tagKey: tag.key, tagValue: tag.value };
    throw new Error('No tags specified');
};

const getTimeRange = () => {
    const end = subMinutes(Date.now(), config.metrics.METRIC_DELAY);
    const start = subMinutes(end, config.metrics.METRIC_WINDOW);
    return { start, end };
};

const getLambdaCostRecords = async (resourceManager, start, end) => {
    const lambdaFunctions = await resourceManager.getResources(
        config.SERVICE_LAMBDA,
        config.RESOURCE_LAMBDA_FUNCTION,
    );

    const lambdaDimensions = await Promise.all(lambdaFunctions.map(
        lambdaFunction => new LambdaDimension({ start, end, lambdaFunction }).create(),
    ));

    const lambdaPricing = new LambdaPricing();
    await lambdaPricing.init();
    const costRecords = lambdaPricing.calculate(lambdaDimensions);

    log.info('Cost records for LAMBDA', costRecords);

    return costRecords;
};

const getRdsCostRecords = async (resourceManager, start, end) => {
    const rdsClusters = await resourceManager.getResources(
        config.SERVICE_RDS,
        config.RESOURCE_RDS_CLUSTER_INSTANCE,
    );

    const rdsDimensions = await Promise.all(rdsClusters.map(
        rdsCluster => new RdsDimension({ start, end, rdsCluster }).create(),
    ));

    const rdsPricing = new RdsPricing();
    await rdsPricing.init();
    const costRecords = rdsPricing.calculate(rdsDimensions);

    log.info('Cost records for RDS', costRecords);

    return costRecords;
};

exports.handler = async (event) => {
    log.info('Received event', event);

    try {
        const { tagKey, tagValue } = parseTagFromEvent(event);
        const { start, end } = getTimeRange();
        const resourceManager = await new ResourceManager({ tagKey, tagValue }).init();

        const lambdaCostRecords = await getLambdaCostRecords(resourceManager, start, end);
        const rdsCostRecords = await getRdsCostRecords(resourceManager, start, end);

        await Promise.all([
            ...lambdaCostRecords.map(costRecord => CLOUDWATCH.putMetricData({
                service: 'lambda',
                cost: parseFloat(costRecord.totalCost),
                resourceId: costRecord.resourceId,
                tagKey,
                tagValue,
                timestamp: end,
            })),
            ...rdsCostRecords.map(costRecord => CLOUDWATCH.putMetricData({
                service: 'rds',
                cost: parseFloat(costRecord.totalCost),
                resourceId: costRecord.resourceId,
                tagKey,
                tagValue,
                timestamp: end,
            })),
        ]);


        return { status: 200 };
    } catch (e) {
        log.error('Something went wrong', e);
        return {
            status: 400,
            message: e.message,
        };
    }
};
