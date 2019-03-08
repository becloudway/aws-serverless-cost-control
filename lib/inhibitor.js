"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const clients_1 = require("./clients");
const logger_1 = require("./logger");
const resource_1 = require("./resource");
const parseActionablesFromEvent = ({ Records }) => Records.map((record) => {
    const attributes = record.Sns.MessageAttributes;
    return new resource_1.Resource(attributes.serviceName.Value, attributes.resourceId.Value);
});
// eslint-disable-next-line func-call-spacing,no-spaced-func
const actions = new Map();
const pricings = new Map();
actions.set(config_1.SERVICE_DYNAMODB, resourceId => clients_1.dynamodbClient.throttle(resourceId, { readCapacityUnits: 1, writeCapacityUnits: 1 }));
actions.set(config_1.SERVICE_RDS, resourceId => clients_1.rdsClient.throttle(resourceId, { maxCapacity: 2, minCapacity: 2, autoPause: true }));
actions.set(config_1.SERVICE_LAMBDA, resourceId => clients_1.lambdaClient.throttle(resourceId, 0));
exports.handler = async (event) => {
    logger_1.log.info('Received event', JSON.stringify(event, null, 2));
    try {
        await Promise.all(parseActionablesFromEvent(event).map(async (actionable) => {
            logger_1.log.info(`Throttling ${actionable.service} resource ${actionable.resourceId}`);
            await actions.get(actionable.service)(actionable.resourceId);
            logger_1.log.info(`${actionable.resourceId} throttled.`);
        }));
        return { status: 200 };
    }
    catch (e) {
        logger_1.log.error('Something went wrong', e);
        return {
            status: 400,
            message: e.message,
        };
    }
};
//# sourceMappingURL=inhibitor.js.map