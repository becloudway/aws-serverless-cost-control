const resourceCostCalculator = require('./lib/functions/resourceCostCalculator');
const resourceThrottler = require('./lib/functions/resourceThrottler');
const anomalyDetector = require('./lib/functions/anomalyDetector');
const costStreamer = require('./lib/functions/costStreamer');

module.exports = {
    resourceCostCalculator: resourceCostCalculator.handler,
    costStreamer: costStreamer.handler,
    resourceThrottler: resourceThrottler.handler,
    anomalyDetector: anomalyDetector.handler,
};
